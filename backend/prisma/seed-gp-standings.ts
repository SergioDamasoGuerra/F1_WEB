import {prisma} from '../src/config/prisma.js'
import{TEAM_STANDING_OVERRIDES} from './data/overrides.js'

interface OpenF1DriverStanding {
    driver_number: number;
    meeting_key: number;
    points_current: number;
    points_start: number;
    position_current: number;
    position_start: number;
    session_key: number;
}

interface OpenF1TeamStanding {
    meeting_key: number;
    points_current: number;
    points_start: number;
    position_current: number;
    position_start: number;
    session_key: number;
    team_name: string;
}

interface OpenF1DriverInfo {
    broadcast_name: string;
    driver_number: number;
    first_name: string;
    full_name: string;
    headshot_url: string;
    last_name: string;
    meeting_key: number;
    name_acronym: string;
    session_key: number;
    team_colour: string;
    team_name: string;
}

const year = 2026;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


// Helper robusto con Exponential Backoff y lectura de Headers
async function fetchWithRetry(
    url: string,
    retries = 5,           // Subimos a 5 reintentos para dar margen
    baseDelayMs = 2000     // 2s base
): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                // Si la API nos devuelve cuántos segundos esperar en los headers, lo usamos
                const retryAfterHeader = response.headers.get('Retry-After');
                let delay = retryAfterHeader
                    ? parseInt(retryAfterHeader, 10) * 1000
                    : baseDelayMs * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s, 16s...

                // Jitter: añadimos entre 100ms y 500ms aleatorios para no colisionar
                delay += Math.floor(Math.random() * 400) + 100;

                console.warn(
                    ` ⚠️ Rate limit alcanzado (429). Reintento ${i + 1}/${retries}. Esperando ${(delay / 1000).toFixed(1)}s...`
                );

                await sleep(delay);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = baseDelayMs * Math.pow(2, i);
            console.warn(` ⚠️ Error de red/petición. Reintentando en ${(delay / 1000).toFixed(1)}s...`);
            await sleep(delay);
        }
    }
}


async function main() {
    console.log(`📡 Iniciando sincronización de Standings para la temporada ${year}...`);

    // 1. Obtener de la base de datos los eventos del año
    const events = await prisma.event.findMany({
        where: {year},
        orderBy: {dateStart: 'asc'},
    });

    const now = new Date();

    for(const event of events) {
        // Ignorar eventos cancelados, futuros o pretemporada (testing)
        if (
            event.isCancelled ||
            event.dateEnd > now ||
            event.name.toLowerCase().includes('testing')
        ) {
            continue;
        }

        console.log(`\n🏎️ Procesando standings para: ${event.name}...`);

        try{
            // Obtener la meeting_key del evento
            const meetingUrl = `https://api.openf1.org/v1/meetings?year=${year}&meeting_name=${encodeURIComponent(event.name)}`;
            const meetings = await fetchWithRetry(meetingUrl);
            await sleep(800); // Pausa para no saturar la API

            if (!meetings || !meetings.length) {
                console.warn(`⚠️ No se encontró 'meeting' en OpenF1 para ${event.name}`);
                continue;
            }
            const meetingKey = meetings[0].meeting_key;

            // Obtener session_key de la carrera ('Race')
            const sessionUrl = `https://api.openf1.org/v1/sessions?meeting_key=${meetingKey}&session_name=Race`;
            const sessions = await fetchWithRetry(sessionUrl);
            await sleep(800); // Pausa para no saturar la API

            if (!sessions || !sessions.length) {
                console.warn(`⚠️ No se encontró sesión 'Race' para ${event.name}`);
                continue;
            }
            const sessionKey = sessions[0].session_key;
            await sleep(800); // Pausa para no saturar la API

            // Map temporal de alineación (Piloto -> Equipo en este GP)
            const driversInfoUrl = `https://api.openf1.org/v1/drivers?session_key=${sessionKey}`;
            const sessionDrivers: OpenF1DriverInfo[] = await fetchWithRetry(driversInfoUrl);
            await sleep(800);

            const driverTeamMap = new Map<number, string>();
            sessionDrivers?.forEach((d) => driverTeamMap.set(d.driver_number, d.team_name));

            // Obtener los Standings (Pilotos)
            const driverStandingsUrl = `https://api.openf1.org/v1/championship_drivers?session_key=${sessionKey}`;
            const driverStandingsData: OpenF1DriverStanding[] = await fetchWithRetry(driverStandingsUrl);
            await sleep(800); // Pausa para no saturar la API

            if (!driverStandingsData?.length) {
                console.warn(` ⚠️ No hay standings de pilotos para la sesión ${sessionKey}`);
            } else {
                for (const standing of driverStandingsData) {
                    const dbDriver = await prisma.driver.findUnique({
                        where: { driverNumber: standing.driver_number },
                    });

                    if (!dbDriver) continue;

                    // Buscar equipo en este GP especifico
                    const teamName = driverTeamMap.get(standing.driver_number);
                    const dbTeam = teamName ? await prisma.team.findFirst({ where: { name: { contains: teamName, mode: 'insensitive' } } }) : null;

                    if (!dbTeam) continue;

                    await prisma.driverEventStanding.upsert({
                        where: {
                            driverId_eventId: {
                                driverId: dbDriver.id,
                                eventId: event.id,
                            },
                        },
                        update: {
                            points: standing.points_current,
                            position: standing.position_current,
                            teamId: dbTeam.id,
                        },
                        create: {
                            driverId: dbDriver.id,
                            eventId: event.id,
                            teamId: dbTeam.id,
                            points: standing.points_current,
                            position: standing.position_current,
                        },
                    });
                }
            }

            // Arrastre de pilotos que no participaron en el gp
            // todo -> calcular posiciones de los pilotos faltantes (lógica FIA)

            // Obtener todos los standings recién insertados
            const currentGPStandings = await prisma.driverEventStanding.findMany({
                where: { eventId: event.id },
            });
            const driversInCurrentGP = new Set(currentGPStandings.map(
                (s) => s.driverId)
            );

            // Obtener todos los pilotos de la BD
            const allDrivers = await prisma.driver.findMany();

            // Buscar qué pilotos faltan en el GP actual
            const missingDrivers = allDrivers.filter(
                (d) => !driversInCurrentGP.has(d.id)
            );

            if(missingDrivers.length > 0) {
                // Buscar cuál fue el gp inmediatamente anterior al actual
                const previousEvent = await prisma.event.findFirst({
                    where: {
                        year,
                        dateStart: {lt: event.dateStart},
                        isCancelled: false,
                    },
                    orderBy: {dateStart: 'desc'},
                });

                if(previousEvent) {
                    for(const missingDriver of missingDrivers) {
                        // Buscar el último standing registrado del piloto en el GP anterior
                        const lastStanding = await prisma.driverEventStanding.findUnique({
                            where: {
                                driverId_eventId: {
                                    driverId: missingDriver.id,
                                    eventId: previousEvent.id,
                                },
                            },
                        });

                        if (lastStanding) {
                            await prisma.driverEventStanding.create({
                                data: {
                                    driverId: missingDriver.id,
                                    eventId: event.id,
                                    points: lastStanding.points,
                                    teamId: lastStanding.teamId,
                                    position: lastStanding.position, // recálculo posterior
                                },
                            });
                        }

                    }
                }
            }

            // --- LÓGICA DE REORDENACIÓN GLOBAL DEL GP ---

            // 1. Obtenemos TODOS los standings del GP (oficiales de OpenF1 + arrastrados)
            const allGpStandings = await prisma.driverEventStanding.findMany({
                where: { eventId: event.id },
            });

            // 2. Ordenamos por Puntos (Descendente).
            // En caso de empate a puntos, usamos la posición previa o el ID como fallback temporal.
            allGpStandings.sort((a, b) => {
                if (b.points !== a.points) {
                    return b.points - a.points; // Quien tiene más puntos va arriba
                }
                return a.position - b.position; // Criterio de desempate temporal: quien estaba antes mejor posicionado
            });

            // 3. Reasignamos las posiciones 1, 2, 3... N en la base de datos
            for (const [index, standing] of allGpStandings.entries()) {
                await prisma.driverEventStanding.update({
                    where: { id: standing.id },
                    data: { position: index + 1 },
                });
            }

            console.log(`  🔄 Standings de Pilotos guardados y reordenados correctamente.`);

            // Obtener los Standings (Equipos)
            const teamStandingsUrl = `https://api.openf1.org/v1/championship_teams?session_key=${sessionKey}`;
            const teamStandingsData: OpenF1TeamStanding[] = await fetchWithRetry(teamStandingsUrl);
            await sleep(800); // Pausa para no saturar la API

            if (!teamStandingsData?.length) {
                console.warn(` ⚠️ No hay standings de equipos para la sesión ${sessionKey}`);
            } else {
                for (const standing of teamStandingsData) {
                    const dbTeam = await prisma.team.findFirst({
                        where: { name: { contains: standing.team_name, mode: 'insensitive' } },
                    });

                    if (!dbTeam) continue;

                    // sobre escritura para datos que vengan mal de la API
                    const override = TEAM_STANDING_OVERRIDES[meetingKey]?.[dbTeam.name];

                    const pointsToSave = override ? override.points : standing.points_current;
                    const positionToSave = override ? override.position : standing.position_current;

                    await prisma.teamEventStanding.upsert({
                        where: {
                            teamId_eventId: {
                                teamId: dbTeam.id,
                                eventId: event.id,
                            },
                        },
                        update: {
                            points: pointsToSave,
                            position: positionToSave,
                        },
                        create: {
                            teamId: dbTeam.id,
                            eventId: event.id,
                            points: pointsToSave,
                            position: positionToSave,
                        },
                    });
                }
                console.log(`  🛡️ Standings de Equipos guardados`);
            }

            console.log(`✅ Standings guardados para ${event.name}`);
        } catch (error) {
            console.error(`❌ Error procesando el evento ${event.name}:`, error);
        }
    }
    console.log('\n🏁 Sincronización de Standings completada.');
}

main()
    .catch((error) => {
        console.error('❌ Error fatal en el Seed de Standings:', error);
        process.exit(1);
    })
.finally(async () => {
    await prisma.$disconnect();
});


// FIN