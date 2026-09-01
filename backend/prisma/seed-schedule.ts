import { prisma } from '../src/config/prisma.js';
import type {OpenF1Meeting} from "./api-models/openf1.model.js";

const year = 2026;
const MEETINGS_URL = `https://api.openf1.org/v1/meetings?year=${year}`

async function main(){
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
                infoUrl: event.circuit_info_url || null,
                countryId: dbCountry.id,
            },
            create: {
                name: event.circuit_short_name,
                type: event.circuit_type || 'unknown',
                imageUrl: event.circuit_image || null,
                infoUrl: event.circuit_info_url || null,
                countryId: dbCountry.id,
            },
        });

        // Calcular estado dinámico
        const startDateObj = new Date(event.date_start);
        const endDateObj = new Date(event.date_end);

        // EVENTO
        await prisma.event.upsert({
            where: {
                name_year: {
                    name: event.meeting_name,
                    year: event.year,
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
                officialName: event.meeting_official_name,
                year: event.year,
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


