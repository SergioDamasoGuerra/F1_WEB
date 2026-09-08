import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'
import {calculateEventStatus} from "../utils/event-status.util.js";

export const getEvents = async (req: Request, res: Response) => {
    try{
        const year = Number(req.query.year);

        if (!year || isNaN(year)) {
            return res.status(400).json({ error: 'Parámetro year no válido' });
        }

        const events = await prisma.event.findMany({
            where: {
                season: {
                    year: year,
                }
            },
            include: {
                circuit: {include: {country: true}},
                season: true
            },
            orderBy: {startDate: 'asc'},
        });
        const eventsWithStatus = events.map((event) => ({
            ...event,
            status: calculateEventStatus(event.startDate, event.endDate, event.isCancelled),
        }));
        return res.json(eventsWithStatus);
    }catch(err){
        console.error('Error getting events:', err);
        res.status(500).json({ error: 'Error getting events.' });
    }
}

export const getEventWithNeighbors = async (req: Request, res: Response) => {
    try{
        const yearParam = Number(req.query.year);

        if (!yearParam || isNaN(yearParam)) {
            return res.status(400).json({ error: 'Parámetro year no válido' });
        }

        const nameParam = req.query.name;

        if(!nameParam || typeof nameParam !== 'string') return res.status(400).json({ error: 'Parámetro name no válido' });

         // Convertimos 'italian-grand-prix' -> 'italian grand prix' (o usa regex / mode: 'insensitive')
        const formattedName = nameParam.replace(/-/g, ' ');
        const currentEvent = await prisma.event.findFirst({
            where: {
                season: {
                    year: yearParam,
                },
                name: {
                    equals: formattedName,
                    mode: 'insensitive' // Ignora mayúsculas y minúsculas
                }
            },
            include: {circuit: {include: {country: true}}},
        });

        if (!currentEvent) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        const [previousEvent, nextEvent] = await prisma.$transaction([

            // Evento inmediatamente anterior
            prisma.event.findFirst({
                where: { startDate: { lt: currentEvent.startDate } },
                orderBy: { startDate: 'desc' },
                select: {
                    id: true,
                    circuit: { select: { country: { select: { flagUrl: true } } } },
                },
            }),

            // Evento inmediatamente posterior
            prisma.event.findFirst({
                where: { startDate: { gt: currentEvent.startDate } },
                orderBy: { startDate: 'asc' },
                select: {
                    id: true,
                    circuit: { select: { country: { select: { flagUrl: true } } } },
                },
            }),

        ]); // FIN transacción

        // Mapear para aplanar el flagUrl y hacer coincidir los nombres con el Frontend
        const responseData = {
            currentEvent: currentEvent,
            pastEvent: previousEvent ? {
                id: previousEvent.id,
                flagUrl: previousEvent.circuit?.country?.flagUrl,
            } : null,
            nextEvent: nextEvent ? {
                id: nextEvent.id,
                flagUrl: nextEvent.circuit?.country?.flagUrl,
            } : null,
        };

        return res.json(responseData);

    }catch(err){
        console.error('Error getting events:', err);
        res.status(500).json({ error: 'Error getting events.' });
    }
}


export const getLatestSeason = async (req: Request, res: Response) => {
    try {
        const latestSeason = await prisma.season.findFirst({
            orderBy: {year: 'desc'},
            select: { year: true },
        });

        if (!latestSeason) {
            // Por si la base de datos está completamente vacía: devolver año actual
            return res.json({ year: new Date().getFullYear() });
        }

        return res.json({ year: latestSeason.year });
    } catch (error) {
        console.error('Error getting latest season:', error);
        return res.status(500).json({ error: 'Error getting latest season.' });
    }
};

export const getAllSeasonYears = async (req: Request, res: Response) => {
    try {
        const years = await prisma.season.findMany({
            select: { year: true },
            orderBy: { year: 'desc' },
        });

        return res.json(years);
    } catch (error) {
        console.error('Error getting latest season:', error);
        return res.status(500).json({ error: 'Error getting latest season.' });
    }
}
