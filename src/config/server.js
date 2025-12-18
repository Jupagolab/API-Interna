// server.js
import express from 'express';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';

// Cargar .env EXPLÍCITAMENTE
configDotenv({ path: '.env' });

const upload = multer({ dest: "uploads/" });

const { PORT } = process.env;

export const ADMINOLT_CONFIG = {
  subdomain: process.env.ADMINOLT_SUBDOMAIN,
  token: process.env.ADMINOLT_API_TOKEN
};

const app = express();

app.use(cors());
app.use(express.json());

app.set("port", PORT || 4000);

// Importar rutas
// Rutas existentes
// TRELLO
import routeTrello from '../routes/trello.js';
app.use("/api/trello", routeTrello);
// VENTAS
import routeVentas from '../routes/ventas.js';
app.use("/api/ventas", routeVentas);
// SORTEO
import routeSorteo from '../routes/sorteo.js';
app.use("/api/sorteo", routeSorteo);
import routeAssemblyAI from '../routes/assembly.js';
app.use("/api/assembly", routeAssemblyAI);
import routeOpenAI from '../routes/openai.js';
app.use("/api/openai", routeOpenAI);

// =============== WEBSOCKET ======================
import routeAdminOLT from '../routes/adminolt.routes.js'
app.use("/api/adminolt", routeAdminOLT);

export default app;