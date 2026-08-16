import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'

export const getDrivers = async (req: Request, res: Response) => {
    try{
        const drivers = await prisma.driver.findMany({
            include: {team:true},
            orderBy: {position: 'asc'},
        });
        res.json(drivers);
    } catch(err){
        console.error('Error getting drivers:', err);
        res.status(500).json({ error: 'Error getting drivers.' });
    }
}

