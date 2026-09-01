import { prisma } from '../src/config/prisma.js';
import { fetchWithRetry } from "../src/utils/http-utils.js";
import type { OpenF1Meeting, OpenF1Session, OpenF1SessionResult, OpenF1Driver } from "./api-models/openf1.model.js";
import {getGapToLeader, getSessionPoints} from "../src/utils/result-util.js";

const year = 2026;
const MEETINGS_URL = `https://api.openf1.org/v1/meetings?year=${year}`;
const SESSIONS_URL = `https://api.openf1.org/v1/sessions?year=${year}`;

// Leer flag opcional desde la terminal (ej: npm run seed:results -- --eventId=12)
const eventIdArg = process.argv.find(arg => arg.startsWith('--eventId='))?.split('=')[1];
const targetEventId = eventIdArg ? parseInt(eventIdArg, 10) : null;

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
    const [allMeetings, allSessions, dbEvents, dbDrivers, dbTeams] = await Promise.all([
        fetchWithRetry<OpenF1Meeting[]>(MEETINGS_URL),
        fetchWithRetry<OpenF1Session[]>(SESSIONS_URL),
        prisma.event.findMany({ where: { year } }),
        prisma.driver.findMany(),
        prisma.team.findMany(),
    ]);

    // Mapa: dado en evento (id) obtener su meeting_key (OpenF1)
    const eventToMeetingMap = new Map<number, number>();
    for (const meeting of allMeetings) {
        const dbEvent = dbEvents.find(e => e.name === meeting.meeting_name);
        if (dbEvent) eventToMeetingMap.set(dbEvent.id, meeting.meeting_key);
    }

    // Mapas para ID de BD de Pilotos y Equipos
    const driverNumberMap = new Map<number, number>(dbDrivers.map(d => [d.number, d.id]));
    const teamNameMap = new Map<string, number>(dbTeams.map(t => [t.name.toLowerCase(), t.id]));

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

        // MAP: driver_number -> team_name
        const sessionTeamMap = new Map<number, string>();
        for (const d of sessionDrivers) {
            if (d.driver_number && d.team_name) {
                sessionTeamMap.set(d.driver_number, d.team_name.toLowerCase());
            }
        }

        for (const res of sessionResults) {
            const driverId = driverNumberMap.get(res.driver_number);
            if (!driverId) continue;

            const teamNameLower = sessionTeamMap.get(res.driver_number);
            const teamId = teamNameLower ? teamNameMap.get(teamNameLower) : null;

            if (!teamId) {
                console.warn(`⚠️ No se encontró teamId para el piloto ${res.driver_number} en la sesión ${apiSession.session_key}`);
                continue;
            }

            // Mapear status dinámicamente
            let status = 'FINISHED';
            if (res.dnf) status = 'DNF';
            if (res.dns) status = 'DNS';
            if (res.dsq) status = 'DSQ';

            // Lógica para determinar sesiones y guardar según el tipo
            const cleanType = session.type.toLowerCase();

            // Clasificaciones (incluye Qualy estándar, Sprint Qualifying y Sprint Shootout)
            const isQualifying = cleanType.includes('qualifying') || cleanType.includes('shootout');

            // Carreras (Carrera del domingo o Carrera Sprint)
            const isRaceOrSprint = cleanType.includes('race') || cleanType.includes('sprint');

            let duration: number | null = null;
            let q1Time: number | null = null;
            let q2Time: number | null = null;
            let q3Time: number | null = null;

            if (isQualifying) {
                // Para Clasificación (Q1, Q2, Q3)
                if (Array.isArray(res.duration)) {
                    q1Time = res.duration[0] ?? null;
                    q2Time = res.duration[1] ?? null;
                    q3Time = res.duration[2] ?? null;
                }
            } else if (!isRaceOrSprint) {
                // Solo en Entrenamientos Libres (FP1, FP2, FP3) se guarda duration
                duration = res.duration;
            }

            const rawGap = getGapToLeader(res.gap_to_leader);
            // Convertir a String o null para encajar con el campo de Prisma
            const gapToLeader: string | null = rawGap !== null ? String(rawGap) : null;

            const points = getSessionPoints(session.id, session.type, res.position, status);

            await prisma.result.upsert({
                where: {
                    sessionId_driverId: {
                        sessionId: session.id,
                        driverId: driverId,
                    }
                },
                update: {
                    teamId: teamId,
                    position: res.position,
                    status: status,
                    points: points,
                    duration: duration,
                    gapToLeader: gapToLeader,
                    q1Time: q1Time,
                    q2Time: q2Time,
                    q3Time: q3Time,
                },
                create: {
                    sessionId: session.id,
                    driverId: driverId,
                    teamId: teamId,
                    position: res.position,
                    points: points,
                    status: status,
                    duration: duration,
                    gapToLeader: gapToLeader,
                    q1Time: q1Time,
                    q2Time: q2Time,
                    q3Time: q3Time,
                }
            });
        }
    }

    console.log("✅ Resultados de sesiones sincronizados.");
}

main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Resultados:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


