import express from 'express';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors'

const upload = multer({ dest: "uploads/" });

configDotenv();

const { PORT } = process.env;

const app = express();

app.use(cors());
app.use(express.json());

app.set("port", PORT || 4000);

// Rutas
// TRELLO
import routeTrello from '../routes/trello.js';
app.use("/api/trello", routeTrello)
// VENTAS
import routeVentas from '../routes/ventas.js';
app.use("/api/ventas", routeVentas)
// SORTEO
import routeSorteo from '../routes/sorteo.js';
app.use("/api/sorteo", routeSorteo)
import routeAssemblyAI from '../routes/assembly.js';
app.use("/api/assembly", routeAssemblyAI)
import routeOpenAI from '../routes/openai.js';
app.use("/api/openai", routeOpenAI)

export default app;