import { prisma } from '../src/config/prisma.js';

// Tipos para mapear la respuesta de OpenF1
interface OpenF1DriverInfo {
    driver_number: number;
    broadcast_name: string;
    first_name: string;
    last_name: string;
    full_name: string;
    headshot_url: string;
    name_acronym: string;
    team_colour: string;
    team_name: string;
}

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
    "meeting_key": number;
    "points_current": number;
    "points_start": number;
    "position_current": number;
    "position_start": number;
    "session_key": number;
    "team_name": string;
}

const DRIVERS_INFO_URL = 'https://api.openf1.org/v1/drivers?session_key=latest';
const DRIVERS_STANDINGS_URL = 'https://api.openf1.org/v1/championship_drivers?session_key=latest';
const TEAMS_STANDINGS_URL = 'https://api.openf1.org/v1/championship_teams?session_key=latest';

async function main() {
    console.log('📡 Obteniendo datos de la API de OpenF1...');

    // 1. Obtener datos de OpenF1 en paralelo
    const [driversRes, driversStandingsRes, teamsStandingsRes] = await Promise.all([
        fetch(DRIVERS_INFO_URL),
        fetch(DRIVERS_STANDINGS_URL),
        fetch(TEAMS_STANDINGS_URL),
    ]);

    if (!driversRes.ok || !driversStandingsRes.ok || !teamsStandingsRes.ok) {
        throw new Error('Error al conectar con la API de OpenF1');
    }

    const openF1Drivers = (await driversRes.json()) as OpenF1DriverInfo[];
    const openF1Standings = (await driversStandingsRes.json()) as OpenF1DriverStanding[];
    const openF1Teams = (await teamsStandingsRes.json()) as OpenF1TeamStanding[];

    // 2. Mapear y guardar Equipos en PostgreSQL
    for (const team of openF1Teams) {
        if (!team.team_name) continue;

        await prisma.team.upsert({
            where: { name: team.team_name },
            update: {
                points: team.points_current ?? 0,
                position: team.position_current ?? 0,
            },
            create: {
                name: team.team_name,
                points: team.points_current ?? 0,
                position: team.position_current ?? 0,
            },
        });
    }
    console.log('✅ Equipos guardados en PostgreSQL.');

    // 3. Mapear y guardar Pilotos en PostgreSQL
    for(const driver of openF1Drivers) {
        const dbTeam = await prisma.team.findUnique({
            where: {name: driver.team_name}
        });
        if (!dbTeam) continue;

        const standing = openF1Standings.find((s) => s.driver_number === driver.driver_number);

        const teamColor = driver.team_colour ? `#${driver.team_colour}` : null;

        await prisma.driver.upsert({
            where: {driverNumber: driver.driver_number},
            update: {
                name: driver.full_name,
                acronym: driver.name_acronym || 'DRV',
                teamId: dbTeam.id,
                points: standing?.points_current ?? 0,
                position: standing?.position_current ?? null,
                imageUrl: driver.headshot_url || null,
                teamColor: teamColor,
            },
            create: {
                driverNumber: driver.driver_number,
                name: driver.full_name,
                acronym: driver.name_acronym || 'DRV',
                teamId: dbTeam.id,
                points: standing?.points_current ?? 0,
                position: standing?.position_current ?? null,
                imageUrl: driver.headshot_url || null,
                teamColor: teamColor,
            },
        });
    }
    console.log('✅ Pilotos guardados en PostgreSQL.');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Standings:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

