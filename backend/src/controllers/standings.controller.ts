import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getDriverStandingsByEvent(req: Request, res: Response) {
    try {
        const eventId = Number(req.query.eventId);

        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({ error: 'Parámetro eventId no válido' });
        }

        const standings = await prisma.driverEventStanding.findMany({
            where: { eventId },
            include: {
                driver: true,
                team: true
            },
            orderBy: { position: 'asc' }, // Ordenados de 1º a 22º
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

        const standings = await prisma.teamEventStanding.findMany({
            where: { eventId },
            include: {
                team: true
            },
            orderBy: { position: 'asc' }, // Ordenados de 1º a 11º
        });

        return res.json(standings);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener la clasificación de equipos' });
    }
}

