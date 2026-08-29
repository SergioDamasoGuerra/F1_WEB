import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import driversRoutes from './routes/drivers.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import eventsRoutes from './routes/events.routes.js';
import standingsRotes from "./routes/standings.rotes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
// Habilitar CORS para permitir peticiones desde Angular
app.use(cors({
    origin: 'http://localhost:4200', // Permite peticiones únicamente desde tu frontend
    credentials: true,               // Permite tokens o cabeceras de autorización
}));
app.use(express.json());

// Rutas
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', driversRoutes);
app.use('/api', teamsRoutes);
app.use('/api', eventsRoutes);
app.use('/api', standingsRotes);

export default app;

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor F1 escuchando en http://localhost:${PORT}`);
});

