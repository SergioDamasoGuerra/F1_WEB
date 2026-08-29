import type { Request, Response } from "express";
import {prisma} from '../config/prisma.js'

export const getTeams = async (req: Request, res: Response) => {
    try{
        const teams = await prisma.team.findMany({});
        res.json(teams);
    } catch(err){
        console.error('Error getting teams:', err);
        res.status(500).json({ error: 'Error getting teams.' });
    }
}

