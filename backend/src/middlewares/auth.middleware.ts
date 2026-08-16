import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}

export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if(!token) {
        res.status(401).json({error: 'Acceso denegado. Token no proporcionado.'});
        return;
    }

    try{
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret) as unknown as {id: number; username: string};
        req.user = decoded;
        next();
    } catch(err) {
        res.status(403).json({ error: 'Token inválido o expirado.' });
    }
}

/*

REQ (Solicitud / Request): Representa los datos que envía el cliente al servidor.
En AuthenticatedRequest se añade la propiedad opcional user para guardar ahí los datos del usuario autenticado.

RES (Respuesta / Response): Objeto para enviar la respuesta de vuelta al cliente.
Si la autenticación falla, responde directamente con un error HTTP (401 o 403) y detiene el flujo.

NEXT (Función de "Siguiente"): Es la instrucción que le dice a Express: "Todo está correcto con este middleware,
                                                                         dale el control a la siguiente función o ruta"

Flujo paso a paso del código:

1. Lee la cabecera HTTP
2. Extrae el Token
3. Validación de presencia (si no hay token -> error)
4. Verificación matemática (JWT Verify) (comprueba si el token fue firmado por tu servidor y si aún no ha caducado)
5. Inyección del usuario actual

 */
