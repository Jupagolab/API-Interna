// server.js
import express from 'express';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import axios from 'axios'
import WebSocket from 'ws';

// Cargar .env EXPLÍCITAMENTE
configDotenv({ path: '.env' });

const upload = multer({ dest: "uploads/" });

const { PORT } = process.env;

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

// Configuración con tus credenciales
const CONFIG = {
  subdomain: process.env.ADMINOLT_SUBDOMAIN,
  token: process.env.ADMINOLT_API_TOKEN
};

// Función auxiliar que envuelve el WebSocket en una Promesa
// Esto permite usar "await" y esperar a que AdminOLT termine de escanear
const conectarYEsperarWebSocket = (facility) => {
  return new Promise((resolve, reject) => {
    // Construcción de URL WSS según documentación [cite: 20, 137]
    const wsUrl = `wss://${CONFIG.subdomain}.adminolt.com/ws/${facility}?subscribe-broadcast`;
    const ws = new WebSocket(wsUrl);

    // Timeout de seguridad (por si el WS se cuelga) - 30 segundos
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Tiempo de espera del WebSocket agotado'));
    }, 30000);

    ws.on('open', () => {
      console.log('   -> WS Conectado. Enviando trigger...');
      // Según docs, a veces se requiere enviar un mensaje para iniciar [cite: 153]
      ws.send("Get response data");
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());

        // Verificamos si el proceso terminó [cite: 96, 211]
        if (response.status === 'DONE') {
          clearTimeout(timeout);
          ws.close(); // Cerramos conexión
          resolve(response.unauthorized_onus || {}); // Devolvemos solo las ONUs
        } else {
          // Si el estado es "PROGRESS" u otro, seguimos esperando [cite: 173]
          console.log(`   -> Estado WS: ${response.status}`);
        }
      } catch (err) {
        console.error("Error parseando mensaje WS", err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

// --- RUTA DE EXPRESS ---
app.get('/api/buscar-onus', async (req, res) => {
  console.log('--- Iniciando búsqueda de ONUs no autorizadas ---');

  try {
    // PASO 1: Obtener el Facility ID vía HTTP [cite: 31]
    const apiUrl = `https://${CONFIG.subdomain}.adminolt.com/api/onu/unauthorized/`;
    const httpResponse = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Token ${CONFIG.token}`
      }
    });

    const facility = httpResponse.data.facility;// [cite: 14, 17]

    if (!facility) {
      return res.status(500).json({ error: 'No se recibió facility ID de AdminOLT' });
    }

    console.log(`1. Facility obtenido: ${facility}`);

    // PASO 2: Conectar al WebSocket y esperar la respuesta final [cite: 134]
    console.log('2. Esperando datos del WebSocket...');
    const listaOnus = await conectarYEsperarWebSocket(facility);

    console.log(`3. Proceso terminado. Enviando ${Object.keys(listaOnus).length} ONUs al cliente.`);

    // Devolvemos el JSON limpio al cliente (Frontend/Postman)
    res.json({
      success: true,
      total: Object.keys(listaOnus).length,
      data: listaOnus
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.response ? error.response.data : null
    });
  }
});


export default app;