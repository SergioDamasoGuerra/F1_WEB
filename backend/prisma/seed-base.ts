import {prisma} from "../src/config/prisma.js"
import type {OpenF1Driver, OpenF1Session} from "./api-models/openf1.model.js";
import {TEAM_CANONICAL_MAP} from "./data/team-aliases.js";
import {fetchWithRetry} from "../src/utils/http-utils.js";

const year = 2026;

async function seedSeasonEntities(){
    console.log(`📡 Sincronización de Equipos y Pilotos para la temporada ${year}...`);

    // Obtener todas las sesiones del año
    const sessions = await fetchWithRetry<OpenF1Session[]>(
        `https://api.openf1.org/v1/sessions?year=${year}`
    );

    if(!sessions || sessions.length === 0){
        console.log(`⚠️ No se encontraron sesiones para el año ${year}.`);
        return;
    }

    // Extraer 1 sola session_key por evento para optimizar llamadas
    const selectedSessionKeys = new Set<number>();
    const seenMeetings = new Set<number>();

    for (const s of sessions) {
        if(!seenMeetings.has(s.meeting_key)){
            seenMeetings.add(s.meeting_key);
            selectedSessionKeys.add(s.session_key);
        }
    }

    // Una sola petición multiclave a la API de OpenF1
    const sessionKeysParams = Array.from(selectedSessionKeys)
        .map(sessionKey => `session_key=${sessionKey}`)
        .join('&');

    const apiDrivers = await fetchWithRetry<OpenF1Driver[]>(
        `https://api.openf1.org/v1/drivers?${sessionKeysParams}`
    );

    if(!apiDrivers || apiDrivers.length === 0){
        console.log("⚠️ No se obtuvieron datos de pilotos/equipos desde la API.");
        return;
    }

    // Filtrar duplicados en memoria
    const teamsMap = new Map<string, { officialName: string; colour: string | null }>();
    const driversMap = new Map<string, OpenF1Driver>();

    for (const d of apiDrivers) {
        // Si tiene equipo Y no se ha guardado -> guardar
        if(d.team_name && !teamsMap.has(d.team_name)){
            teamsMap.set(d.team_name, {
                officialName: d.team_name,
                colour: d.team_colour ? `#${d.team_colour}` : null,
            });
        }

        // Mapear pilotos únicos por acrónimo
        if(d.name_acronym && d.driver_number && !driversMap.has(d.name_acronym)){
            driversMap.set(d.name_acronym, d);
        }
    }

    // Procesar equipos ('Team' y 'SeasonTeam')
    console.log(`🏢 Sincronizando ${teamsMap.size} equipos...`);
    for (const [rawTeamName, teamData] of teamsMap) {
        const canonicalName = TEAM_CANONICAL_MAP[rawTeamName] ?? rawTeamName;

        // Team (base/estático)
        const team = await prisma.team.upsert({
            where: {name: canonicalName},
            update: {},
            create: {name: canonicalName}
        });

        // SeasonTeam (dinámico: específico del año)
        await prisma.seasonTeam.upsert({
            where: {
                teamId_year: {
                    teamId: team.id,
                    year: year
                }
            },
            update: {
                officialName: teamData.officialName,
                colour: teamData.colour,
            },
            create: {
                teamId: team.id,
                year: year,
                officialName: teamData.officialName,
                colour: teamData.colour,
            }
        });
    }

    // Procesar pilotos ('Driver' y 'SeasonDriver')
    console.log(`👤 Sincronizando ${driversMap.size} pilotos...`);
    for(const [acronym, apiDriver] of driversMap) {
        // Driver (base/estático)
        const driver = await prisma.driver.upsert({
            where: {acronym: acronym},
            update: {
                name: apiDriver.full_name,
                imageUrl: apiDriver.headshot_url || null,
            },
            create: {
                name: apiDriver.full_name,
                acronym: acronym,
                imageUrl: apiDriver.headshot_url || null,
            }
        });

        // SeasonDriver (dorsal de ese año)
        await prisma.seasonDriver.upsert({
            where: {
                driverId_year: {
                    driverId: driver.id,
                    year: year,
                }
            },
            update: {
                number: apiDriver.driver_number
            },
            create: {
                driverId: driver.id,
                year: year,
                number: apiDriver.driver_number,
            }
        });
    }

    console.log(`✅ Sincronización completa de Equipos y Pilotos para ${year}.`);
}

seedSeasonEntities()
    .catch((e) => {
        console.error('❌ Error durante el Seed Base:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

