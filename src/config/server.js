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
import routeTrello from '../routes/trello.js';
app.use("/api/trello", routeTrello)

export default app;