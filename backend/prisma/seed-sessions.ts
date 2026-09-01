import {prisma} from '../src/config/prisma.js'
import type {OpenF1Meeting, OpenF1Session} from "./api-models/openf1.model.js";


const year = 2026;
const MEETINGS_URL = `https://api.openf1.org/v1/meetings?year=${year}`;
const SESSIONS_URL = `https://api.openf1.org/v1/sessions?year=${year}`;

async function main() {
    console.log('📡 Obteniendo datos (sesiones) de la API de OpenF1...');

    // Obtener eventos de la BD
    const dbEvents = await prisma.event.findMany({ where: { year: year } });

    // Peticiones HTTP a OpenF1
    const [apiMeetingsRes, apiSessionsRes] = await Promise.all([
        fetch(MEETINGS_URL),
        fetch(SESSIONS_URL)
    ]);

    if (!apiMeetingsRes.ok || !apiSessionsRes.ok) {
        throw new Error(`Error HTTP: MEETINGS: ${apiMeetingsRes.status} ${apiMeetingsRes.statusText}\n
                                              SESSIONS: ${apiSessionsRes.status} ${apiSessionsRes.statusText}`);
    }
    const apiMeetings: OpenF1Meeting[] = await apiMeetingsRes.json();
    const apiSessions: OpenF1Session[] = await apiSessionsRes.json();

    // Mapa clave:meeting_key (OpenF1), valor:eventID (mi DB)
    const meetingToEventMap = new Map<number, number>();

    for (const meeting of apiMeetings) {
        const dbEvent = dbEvents.find(e =>
            e.name === meeting.meeting_name
        );

        if (dbEvent) {
            meetingToEventMap.set(meeting.meeting_key, dbEvent.id);
        }
    }

    console.log(meetingToEventMap);

    // Iterar las sesiones e insertar en la BD
    for (const session of apiSessions) {
        const eventId = meetingToEventMap.get(session.meeting_key);

        if (!eventId) continue;

        await prisma.session.upsert({
            where: {
                eventId_type: {
                    eventId: eventId,
                    type: session.session_name,
                },
            },
            update: {
                startDate: new Date(session.date_start),
                endDate: new Date(session.date_end),
            },
            create: {
                type: session.session_name,
                startDate: new Date(session.date_start),
                endDate: new Date(session.date_end),
                eventId: eventId,
            },
        });
    }

    console.log(`✅ Sesiones del año ${year} obtenidas correctamente.`);
}


main()
    .catch((e) => {
        console.error('❌ Error durante el Seed de Schedule:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

