import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'

export const getDrivers = async (req: Request, res: Response) => {
    try{
        const drivers = await prisma.driver.findMany({
            include: {team:true},
        });

        drivers.sort((a, b) =>
            (a.position ?? Infinity) - (b.position ?? Infinity)
        );

        res.json(drivers);
    } catch(err){
        console.error('Error getting drivers:', err);
        res.status(500).json({ error: 'Error getting drivers.' });
    }
}

