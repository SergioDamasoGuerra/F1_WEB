import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const SALT_ROUNDS = 10;

// Registro de usuario
export const register = async(req: Request, res: Response) => {
    try{
        const {username, password} = req.body;

        if(!username || !password){
            res.status(400).json({ error: 'Username and password is required' });
            return;
        }

        // Comprobar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: {username}
        });
        if(existingUser){
            res.status(400).json({ error: 'Username already taken' });
            return;
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Crear en la BD
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
            select: {id: true, username: true, createdAt: true}, // No devolver el password
        });

        res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
    }catch(err){
        console.error("Error en registro:", err);
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
    try{
        const {username, password} = req.body;

        if(!username || !password){
            res.status(400).json({ error: 'Username and password is required' });
            return;
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: {username}
        });

        if(!user){
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        // Validar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        // Generar JWT (válido por 7 días)
        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign(
            { id: user.id, username: user.username },
            secret,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Successful login',
            token,
            user: { id: user.id, username: user.username },
        });

    }catch(err){
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
};


// Endpoint para comprobar perfil autenticado (/api/auth/me)
export const getMe = async(req: AuthenticatedRequest, res: Response) => {
    try{
        if (!req.user) {
            res.status(401).json({ error: 'Unauthenticated user.' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {id: req.user?.id},
            select: {id: true, username: true, createdAt: true},
        });

        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        res.json({user});
    }catch(err){
        res.status(500).json({ error: 'Error getting the profile.' });
    }
};


