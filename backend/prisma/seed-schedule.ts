import { prisma } from '../src/config/prisma.js';
import type {OpenF1Meeting} from "./api-models/openf1.model.js";

const targetYear = 2025;
const MEETINGS_URL = `https://api.openf1.org/v1/meetings?year=${targetYear}`

async function main(){
    console.log(`📡 Actualizando temporada ${targetYear}...`);

    // Crea la Season si no existe, o no hace nada si ya estaba registrada
    await prisma.season.upsert({
        where: { year: targetYear },
        update: {},
        create: { year: targetYear },
    });

    console.log('📡 Obteniendo datos (eventos) de la API de OpenF1...');

    const response = await fetch(MEETINGS_URL);
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    const eventsRes: OpenF1Meeting[] = await response.json();

    for(const event of eventsRes) {
        // Guard de seguridad: omitir registros incompletos
        if (!event.meeting_name || !event.country_code || !event.circuit_short_name) {
            continue;
        }

        // PAIS
        const dbCountry = await prisma.country.upsert({
            where: { code: event.country_code },
            update: {
                name: event.country_name,
                flagUrl: event.country_flag || null,
            },
            create: {
                code: event.country_code,
                name: event.country_name,
                flagUrl: event.country_flag || null,
            },
        });

        // CIRCUITO
        const dbCircuit = await prisma.circuit.upsert({
            where: { name: event.circuit_short_name },
            update: {
                type: event.circuit_type || 'unknown',
                imageUrl: event.circuit_image || null,
                info: "DEFAULT CIRCUIT INFO.", // event.circuit_info_url || null (coordenadas, etc...)
                countryId: dbCountry.id,
            },
            create: {
                name: event.circuit_short_name,
                type: event.circuit_type || 'unknown',
                imageUrl: event.circuit_image || null,
                info: "DEFAULT CIRCUIT INFO.", // event.circuit_info_url || null (coordenadas, etc...)
                countryId: dbCountry.id,
            },
        });

        // Calcular estado dinámico
        const startDateObj = new Date(event.date_start);
        const endDateObj = new Date(event.date_end);

        // EVENTO
        await prisma.event.upsert({
            where: {
                name_seasonId: {
                    name: event.meeting_name,
                    seasonId: targetYear,
                },
            },
            update: {
                officialName: event.meeting_official_name,
                startDate: startDateObj,
                endDate: endDateObj,
                isCancelled: event.is_cancelled,
                circuitId: dbCircuit.id,
            },
            create: {
                name: event.meeting_name,
                seasonId: targetYear,
                officialName: event.meeting_official_name,
                startDate: startDateObj,
                endDate: endDateObj,
                isCancelled: event.is_cancelled,
                circuitId: dbCircuit.id,
            },
        });
    }
    console.log('✅ Eventos guardados en PostgreSQL.');
}


main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Schedule:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


