import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'
import {calculateEventStatus} from "../utils/event-status.util.js";

export const getEvents = async (req: Request, res: Response) => {
    try{
        const events = await prisma.event.findMany({
            include: {
                circuit: {include: {country: true}}
            },
            orderBy: {startDate: 'asc'},
        });
        const eventsWithStatus = events.map((event) => ({
            ...event,
            status: calculateEventStatus(event.startDate, event.endDate, event.isCancelled),
        }));
        return res.json(eventsWithStatus);
    }catch(err){
        console.error('Error getting drivers:', err);
        res.status(500).json({ error: 'Error getting events.' });
    }
}

