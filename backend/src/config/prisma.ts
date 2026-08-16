import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Crear el pool de conexiones de PostgreSQL
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Pasar el pool al adaptador de Prisma
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

