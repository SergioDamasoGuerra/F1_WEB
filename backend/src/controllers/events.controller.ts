import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'

export const getEvents = async (req: Request, res: Response) => {
    try{
        const events = await prisma.event.findMany({
            include: {country:true, circuit:true},
            orderBy: {dateStart: 'asc'},
        });
        res.json(events);
    }catch(err){
        console.error('Error getting drivers:', err);
        res.status(500).json({ error: 'Error getting events.' });
    }
}

