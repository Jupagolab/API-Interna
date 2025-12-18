// src/routes/adminolt.routes.js
import express from 'express';
import { getOLTList, getONUsUnauthorized, getVLANsList } from '../controllers/adminolt.controller.js';

const app = express.Router();

// ==========================================
// RUTAS DE LA API
// ==========================================

// 1. Obtener lista de OLTs (Rápido/Síncrono)
// 
app.get('/olts', getOLTList);

// 2. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/unauthorized', getONUsUnauthorized);

// 3. Obtener VLANs de una OLT específica (Lento/Asíncrono)
// 
app.get('/olts/:id/vlans', getVLANsList);

export default app;