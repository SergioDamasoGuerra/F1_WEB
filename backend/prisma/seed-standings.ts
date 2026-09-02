import {prisma} from '../src/config/prisma.js';

type F1Stats = {
    points: number;
    teamId?: number | undefined;
    positionsCount: Record<number, number>;
};

type F1ItemComparable = {
    points: number;
    positionsCount: Record<number, number>;
};

function compareStandings(a: F1ItemComparable, b: F1ItemComparable): number {
    // Primero por puntos
    if(b.points !== a.points) return b.points - a.points;

    // Criterio de desempate FIA: comparar conteo de P1, P2, ..., P22
    for(let pos = 1; pos <= 22; pos++){
        const countA = a.positionsCount[pos] || 0;
        const countB = b.positionsCount[pos] || 0;

        if(countB !== countA){
            return countB - countA; // devuelve el que tenga más finalizaciones
        }
    }

    // Empate absoluto = igualdad
    return 0;
}

async function main() {
    console.log('⏳ Actualizando standings...')

    // Obtener:
    // - Todos los pilotos y equipos
    // - Eventos ya finalizados
    const [allDrivers, allTeams, pastEvents] = await Promise.all([
        prisma.driver.findMany(),
        prisma.team.findMany(),
        prisma.event.findMany({
            where: {
                isCancelled: false,
                endDate: { lte: new Date() },
                NOT: {name: {contains: 'testing', mode: 'insensitive'}}
            },
            orderBy: { startDate: 'asc' },
            include: {
                sessions: {
                    where: { type: { in: ['Race', 'Sprint'] } },
                    include: { results: true }
                }
            }
        })
    ]);

    if (pastEvents.length === 0) {
        console.log("ℹ️ No hay eventos pasados para procesar.");
        return;
    }

    // No incluir pretemporada / testing
    pastEvents.filter(e =>
        !e.name.toLowerCase().includes('testing'));

    // Mapas acumulativos globales a lo largo de la temporada
    const driverAccumulator = new Map<number, F1Stats>();
    for (const driver of allDrivers) {
        driverAccumulator.set(driver.id, {
            points: 0,
            positionsCount: {}
        });
    }

    const teamAccumulator = new Map<number, F1Stats>();
    for (const team of allTeams) {
        teamAccumulator.set(team.id, {points: 0, positionsCount: {}});
    }

    // Iterar eventos
    for(const event of pastEvents) {
        // Sumar puntos obtenidos en el GP
        for(const session of event.sessions){
            const isMainRace = session.type.toLowerCase() === 'race';

            for(const result of session.results){
                // Acumular al piloto
                const currentDriver = driverAccumulator.get(result.driverId) ??
                    { points: 0, positionsCount: {} };

                const currentTeam = teamAccumulator.get(result.teamId) ??
                    { points: 0, positionsCount: {} };

                const newDriverPositionsCount = { ...currentDriver.positionsCount };
                const newTeamPositionsCount = { ...currentTeam.positionsCount };

                // Incrementar cuenta solo si es carrera principal y es posición válida
                if (isMainRace && result.position && result.position > 0) {
                    newDriverPositionsCount[result.position] = (newDriverPositionsCount[result.position] || 0) + 1;
                    newTeamPositionsCount[result.position] = (newTeamPositionsCount[result.position] || 0) + 1;
                }

                driverAccumulator.set(result.driverId, {
                    points: currentDriver.points + result.points,
                    teamId: result.teamId,
                    positionsCount: newDriverPositionsCount
                });

                teamAccumulator.set(result.teamId, {
                    points: currentTeam.points + result.points,
                    positionsCount: newTeamPositionsCount
                });

            }
        }

        // TODO: desempate oficial de posiciones

        // Calcular la posición de pilotos en este GP
        const rankedDrivers = Array.from(driverAccumulator.entries())
            .map(([driverId, data]) => ({
                driverId,
                points: data.points,
                teamId: data.teamId,
                positionsCount: data.positionsCount
            }))
            .sort((a, b) => compareStandings(a, b));

        // Guardar DriverStandings de este GP
        for(let index = 0; index < rankedDrivers.length; index++) {
            const item = rankedDrivers[index];
            const position = index + 1;

            if(!item || !item.teamId) continue;

            await prisma.driverEventStanding.upsert({
                where: {
                    driverId_eventId: {
                        driverId: item.driverId,
                        eventId: event.id
                    }
                },
                update:{
                    points: item.points,
                    position: position,
                    teamId: item.teamId
                },
                create: {
                    driverId: item.driverId,
                    eventId: event.id,
                    teamId: item.teamId,
                    points: item.points,
                    position: position
                }
            });
        }

        // Calcular la posición de equipos en este GP
        const rankedTeams = Array.from(teamAccumulator.entries())
            .map(([teamId, data]) => ({
                teamId,
                points: data.points,
                positionsCount: data.positionsCount
            }))
            .sort((a, b) => compareStandings(a, b));

        // Guardar TeamStandings de este GP
        for(let index = 0; index < rankedTeams.length; index++) {
            const item = rankedTeams[index];
            const position = index + 1;

            if(!item) continue;

            await prisma.teamEventStanding.upsert({
                where: {
                    teamId_eventId:{
                        teamId: item.teamId,
                        eventId: event.id
                    }
                },
                update: {
                    points: item.points,
                    position: position
                },
                create:{
                    teamId: item.teamId,
                    eventId: event.id,
                    points: item.points,
                    position: position
                }
            });
        }
    }

    console.log("✅ Standings actualizadas.")
}


main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Standings:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

