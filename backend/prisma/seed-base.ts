import {prisma} from "../src/config/prisma.js"

interface OpenF1Team {
        meeting_key: number;
        points_current: number;
        points_start: number;
        position_current: number;
        position_start: number;
        session_key: number;
        team_name: string;
}

interface OpenF1Driver {
    "broadcast_name": string;
    "driver_number": number;
    "first_name": string;
    "full_name": string;
    "headshot_url": string;
    "last_name": string;
    "meeting_key": number;
    "name_acronym": string;
    "session_key": number;
    "team_colour": string;
    "team_name": string;
}

const DRIVERS_URL = 'https://api.openf1.org/v1/drivers?session_key=latest';
const TEAMS_URL = 'https://api.openf1.org/v1/championship_teams?session_key=latest';

async function main(){
    console.log(`📡 Iniciando sincronización de Equipos y Pilotos`);

    const [driversRes, teamsRes] = await Promise.all([
        fetch(DRIVERS_URL),
        fetch(TEAMS_URL),
    ]);

    if (!driversRes.ok || !teamsRes.ok) {
        throw new Error('Error al conectar con la API de OpenF1');
    }

    const openF1Drivers = (await driversRes.json()) as OpenF1Driver[];
    const openF1Teams = (await teamsRes.json()) as OpenF1Team[];

    for (const team of openF1Teams) {
        if (!team.team_name) continue;

        await prisma.team.upsert({
            where: { name: team.team_name },
            update: {
                name: team.team_name,
            },
            create: {
                name: team.team_name,
            },
        });
    }
    console.log('✅ Equipos guardados en PostgreSQL.');

    for (const driver of openF1Drivers) {
        if (!driver.driver_number) continue;

        await prisma.driver.upsert({
            where: { driverNumber: driver.driver_number },
            update: {
                driverNumber: driver.driver_number,
                name: driver.full_name,
                acronym: driver.name_acronym || 'DRV',
                imageUrl: driver.headshot_url || null,
            },
            create: {
                driverNumber: driver.driver_number,
                name: driver.full_name,
                acronym: driver.name_acronym || 'DRV',
                imageUrl: driver.headshot_url || null,
            },
        });
    }
    console.log('✅ Equipos guardados en PostgreSQL.');

}

main()
    .catch((e) => {
        console.error('❌ Error durante el Seed Base:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

