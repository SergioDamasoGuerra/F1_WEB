import {prisma} from "../src/config/prisma.js"
import type {OpenF1Driver, OpenF1Team} from "./api-models/openf1.model.js";

const DRIVERS_URL = 'https://api.openf1.org/v1/drivers?session_key=latest';
const TEAMS_URL = 'https://api.openf1.org/v1/championship_teams?session_key=latest';

function getDriverAcronym(driver: OpenF1Driver): string {
    // Usar acrónimo de la API si lo trae
    if (driver.name_acronym) {
        return driver.name_acronym.toUpperCase();
    }

    // Si no, lo derivamos del apellido
    const cleanName = driver.full_name || driver.first_name || 'UNKNOWN';
    const lastName = cleanName.trim().split(' ').pop() || 'UNKNOWN';
    let acronym = lastName.substring(0, 3).toUpperCase();

    // Asegurar unicidad -> adjuntarle el número del piloto
    if (driver.driver_number) {
        acronym = `${acronym}${driver.driver_number}`;
    }
    return acronym;
}

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
            where: { number: driver.driver_number },
            update: {
                number: driver.driver_number,
                name: driver.full_name,
                acronym: getDriverAcronym(driver),
                imageUrl: driver.headshot_url || null,
            },
            create: {
                number: driver.driver_number,
                name: driver.full_name,
                acronym: getDriverAcronym(driver),
                imageUrl: driver.headshot_url || null,
            },
        });
    }
    console.log('✅ Pilotos guardados en PostgreSQL.');

}

main()
    .catch((e) => {
        console.error('❌ Error durante el Seed Base:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

