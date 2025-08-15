import express from 'express';
import { configDotenv } from 'dotenv';
import cors from 'cors'

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

export default app;