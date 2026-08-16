import { prisma } from '../src/config/prisma.js';

interface OpenF1Meeting{
    "circuit_key": number,
    "circuit_info_url": string,
    "circuit_image": string,
    "circuit_short_name": string,
    "circuit_type": string,
    "country_code": string,
    "country_flag": string,
    "country_key": number,
    "country_name": string,
    "date_end": string,
    "date_start": string,
    "gmt_offset": string,
    "is_cancelled": boolean,
    "location": string,
    "meeting_key": number,
    "meeting_name": string,
    "meeting_official_name": string,
    "year": number
}

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
            },
            create: {
                name: event.circuit_short_name,
                type: event.circuit_type || 'unknown',
                imageUrl: event.circuit_image || null,
                infoUrl: event.circuit_info_url || null,
            },
        });

        // Calcular estado dinámico
        const dateStartObj = new Date(event.date_start);
        const dateEndObj = new Date(event.date_end);
        const currentStatus = getStatus(dateStartObj, dateEndObj, event.is_cancelled);

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
                dateStart: dateStartObj,
                dateEnd: dateEndObj,
                isCancelled: event.is_cancelled,
                status: currentStatus,
                countryId: dbCountry.id,
                circuitId: dbCircuit.id,
            },
            create: {
                name: event.meeting_name,
                officialName: event.meeting_official_name,
                year: event.year,
                dateStart: dateStartObj,
                dateEnd: dateEndObj,
                isCancelled: event.is_cancelled,
                status: currentStatus,
                countryId: dbCountry.id,
                circuitId: dbCircuit.id,
            },
        });
    }
    console.log('✅ Eventos guardados en PostgreSQL.');
}

function getStatus(
    startDate: Date,
    endDate: Date,
    isCancelled: boolean,
): 'done' | 'current' | 'upcoming' | 'cancelled' {
    if (isCancelled) return 'cancelled';
    const now = new Date();
    if (now > endDate) return 'done';
    if (now >= startDate && now <= endDate) return 'current';
    return 'upcoming';
}


main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Schedule:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


