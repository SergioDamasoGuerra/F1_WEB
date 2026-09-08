import { prisma } from '../src/config/prisma.js';
import { fetchWithRetry } from "../src/utils/http-utils.js";
import type { OpenF1Meeting, OpenF1Session, OpenF1SessionResult, OpenF1Driver } from "./api-models/openf1.model.js";
import {getGapToLeader, getPracticeResult, getQualyResult, getRaceResult} from "../src/utils/result-util.js";

const year = 2026;
const MEETINGS_URL = `https://api.openf1.org/v1/meetings?year=${year}`;
const SESSIONS_URL = `https://api.openf1.org/v1/sessions?year=${year}`;

// Leer flag opcional desde la terminal (ej: npm run seed:results -- --eventId=12)
const eventIdArg = process.argv.find(arg => arg.startsWith('--eventId='))?.split('=')[1];
const parsedId = eventIdArg ? parseInt(eventIdArg, 10) : null;
const targetEventId = parsedId && !isNaN(parsedId) ? parsedId : null;

async function main() {
    if (targetEventId) {
        console.log(`📡 Sincronizando únicamente los resultados para el evento ID: ${targetEventId}...`);
    } else {
        console.log("📡 Sincronizando resultados de TODAS las sesiones pasadas del año...");
    }

    // Filtrar sesiones pasadas en Prisma (opcionalmente por eventId)

    const pastSessions = await prisma.session.findMany({
            where: {
                endDate: { lte: new Date() },
                event: {
                    seasonId: year,
                    isCancelled: false,
                    ...(targetEventId ? { id: targetEventId } : {}) // Filtra por evento si se especifica
                }
            },
            include: { event: true },
    });

    if (pastSessions.length === 0) {
        console.log("ℹ️ No se encontraron sesiones pasadas para procesar.");
        return;
    }

    const pastSessionsLength = pastSessions.length;
    let pastSessionsCount = 0;

    // Cargas iniciales paralelas (API y BD)
    const [allMeetings, allSessions, dbEvents, dbDrivers, dbSeasonTeams] = await Promise.all([
        fetchWithRetry<OpenF1Meeting[]>(MEETINGS_URL),
        fetchWithRetry<OpenF1Session[]>(SESSIONS_URL),
        prisma.event.findMany({ where: { seasonId: year } }),
        prisma.driver.findMany({
            select: { id: true, acronym: true }
        }),
        prisma.seasonTeam.findMany({
            where: { year: year },
            select: {
                teamId: true,
                officialName: true,
                team: {
                    select: { name: true }
                }
            }
        }),
    ]);

    // Mapa: dado en evento (id) obtener su meeting_key (OpenF1)
    const eventToMeetingMap = new Map<number, number>();
    for (const meeting of allMeetings) {
        const dbEvent = dbEvents.find(e => e.name === meeting.meeting_name);
        if (dbEvent) eventToMeetingMap.set(dbEvent.id, meeting.meeting_key);
    }

    // Mapas para ID de BD de Pilotos y Equipos
    const driverAcronymMap = new Map<string, number>();
    for (const d of dbDrivers) {
        if (d.acronym) {
            driverAcronymMap.set(d.acronym.trim().toUpperCase(), d.id);
        }
    }

    if (driverAcronymMap.size === 0) {
        console.error(`❌ CRÍTICO: No se encontraron acrónimos de pilotos en la tabla Driver.`);
        return;
    }

    const teamNameMap = new Map<string, number>();
    for (const st of dbSeasonTeams) {
        if (st.officialName) {
            teamNameMap.set(st.officialName.toLowerCase().trim(), st.teamId);
        }
        if (st.team?.name) {
            teamNameMap.set(st.team.name.toLowerCase().trim(), st.teamId);
        }
    }

    if (teamNameMap.size === 0) {
        console.error(`❌ CRÍTICO: No se encontraron nombres de equipos cargados para el año ${year} en SeasonTeam.`);
        return;
    }

    // 3. Procesamiento de sesiones
    for (const session of pastSessions) {
        const meeting_key = eventToMeetingMap.get(session.eventId);
        if (!meeting_key) continue;

        const apiSession = allSessions.find(s =>
            s.session_name === session.type && s.meeting_key === meeting_key
        );
        if (!apiSession) continue;

        pastSessionsCount++;
        console.log(
            ` ⏳ Procesando: GP ${session.event.name} - ${session.type}
            (${pastSessionsCount}/${pastSessionsLength})`
        );

        const [sessionResults, sessionDrivers] = await Promise.all([
            fetchWithRetry<OpenF1SessionResult[]>(
                `https://api.openf1.org/v1/session_result?session_key=${apiSession.session_key}`
            ),
            fetchWithRetry<OpenF1Driver[]>(
                `https://api.openf1.org/v1/drivers?session_key=${apiSession.session_key}`
            )
        ]);

        if (!sessionResults || sessionResults.length === 0) {
            console.warn(`  ⚠️ Sin resultados en API para la sesión ${session.type}`);
            continue;
        }

        // MAP: driver_number -> driverId (DB)
        const sessionDriverIdMap = new Map<number, number>();
        for (const d of sessionDrivers) {
            if (d.driver_number && d.name_acronym) {
                const dbDriverId = driverAcronymMap.get(d.name_acronym.trim().toUpperCase());
                if (dbDriverId) {
                    sessionDriverIdMap.set(d.driver_number, dbDriverId);
                }
            }
        }

        // MAP: driver_number -> team_name
        const sessionTeamMap = new Map<number, string>();
        for (const d of sessionDrivers) {
            if (d.driver_number && d.team_name) {
                sessionTeamMap.set(d.driver_number, d.team_name.toLowerCase().trim());
            }
        }

        // Procesar los resultados de cada sesión en paralelo
        await Promise.all(
            sessionResults.map(async (res) => {
                const driverId = sessionDriverIdMap.get(res.driver_number);
                if (!driverId) {
                    console.warn(`  ⚠️ Piloto no mapeado para dorsal: ${res.driver_number}`);
                    return;
                }

                const teamNameLower = sessionTeamMap.get(res.driver_number);
                const teamId = teamNameLower ? teamNameMap.get(teamNameLower) : null;
                if (!teamId) {
                    console.warn(`  ⚠️ Equipo no encontrado para dorsal ${res.driver_number} (Nombre API: "${teamNameLower}")`);
                    return;
                }

                // Mapear status dinámicamente
                let status = 'FINISHED';
                if (res.dnf) status = 'DNF';
                if (res.dns) status = 'DNS';
                if (res.dsq) status = 'DSQ';

                const gapToLeader = getGapToLeader(res.gap_to_leader);

                // Lógica para determinar sesiones y guardar según el tipo
                const cleanType = session.type.toLowerCase();
                const isQualifying = cleanType.includes('qualifying') || cleanType.includes('shootout');
                const isRaceOrSprint = cleanType.includes('race') || cleanType.includes('sprint');

                let raceResult = null;
                let qualyResult = null;
                let practiceResult = null;

                if(isRaceOrSprint) {
                    raceResult = getRaceResult(res, session, status);
                } else if (isQualifying) {
                    qualyResult = getQualyResult(res);
                } else{
                    practiceResult = getPracticeResult(res);
                }

                // Construir los bloques de Prisma condicionalmente
                const raceDataCreate = raceResult ? { create: raceResult } : undefined;
                const qualyDataCreate = qualyResult ? { create: qualyResult } : undefined;
                const practiceDataCreate = practiceResult ? { create: practiceResult } : undefined;

                const raceDataUpdate = raceResult ? { upsert: { create: raceResult, update: raceResult } } : undefined;
                const qualyDataUpdate = qualyResult ? { upsert: { create: qualyResult, update: qualyResult } } : undefined;
                const practiceDataUpdate = practiceResult ? { upsert: { create: practiceResult, update: practiceResult } } : undefined;

                //upsert
                await prisma.result.upsert({
                    where:{
                        sessionId_driverId:{
                            sessionId: session.id,
                            driverId: driverId,
                        }
                    },
                    update:{
                        position: res.position,
                        status: status,
                        gapToLeader: gapToLeader,
                        teamId: teamId,
                        ...(raceDataUpdate && { raceData: raceDataUpdate }),
                        ...(qualyDataUpdate && { qualyData: qualyDataUpdate }),
                        ...(practiceDataUpdate && { practiceData: practiceDataUpdate }),
                    },
                    create:{
                        position: res.position,
                        status: status,
                        gapToLeader: gapToLeader,
                        sessionId: session.id,
                        driverId: driverId,
                        teamId: teamId,
                        // Solo se incluyen en el objeto final si tienen valor
                        ...(raceDataCreate && { raceData: raceDataCreate }),
                        ...(qualyDataCreate && { qualyData: qualyDataCreate }),
                        ...(practiceDataCreate && { practiceData: practiceDataCreate }),
                    }
                }); // FIN UPSERT
            })
        ); // FIN RESULTADOS (PROMISE.ALL)

    } // FIN BUCLE DE SESIONES

    console.log("✅ Resultados de sesiones sincronizados.");
} // FIN MAIN

main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Resultados:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


