import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getDriverStandingsByEvent(req: Request, res: Response) {
    try {
        const eventId = Number(req.query.eventId);

        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({ error: 'Parámetro eventId no válido' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { seasonId: true }
        });

        if (!event) return res.status(404).json({ error: `Evento no encontrado para eventId = ${eventId}` });

        const standings = await prisma.driverEventStanding.findMany({
            where: { eventId },
            include: {
                driver: {
                    include: {
                        seasons: {
                            where: { year: event.seasonId },
                            select: { number: true } // Traer solo el dorsal
                        }
                    }
                },
                team: {
                    include: {
                        seasons: {
                            where: { year: event.seasonId },
                        }
                    }
                }
            },
            orderBy: { position: 'asc' },
        });

        return res.json(standings);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener la clasificación de pilotos' });
    }
}


export async function getTeamStandingsByEvent(req: Request, res: Response) {
    try {
        const eventId = Number(req.query.eventId);

        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({ error: 'Parámetro eventId no válido' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { seasonId: true }
        });

        if (!event) return res.status(404).json({ error: `Evento no encontrado para eventId = ${eventId}` });

        const standings = await prisma.teamEventStanding.findMany({
            where: {
                eventId,
                team: {
                    seasons: {
                        some: {
                            year: event.seasonId
                        }
                    }
                }
            },
            include: {
                team: {
                    include: {
                        seasons: {
                            where: { year: event.seasonId },
                        }
                    }
                },
            },
            orderBy: { position: 'asc' },
        });

        return res.json(standings);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener la clasificación de equipos' });
    }
}

