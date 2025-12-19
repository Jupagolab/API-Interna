// src/routes/adminolt.routes.js
import express from 'express';
import { authorizeONU, disableONU, enableONU, getOLTList, getONUSignal, getONUStatus, getONUsUnauthorized, getVLANsList } from '../controllers/adminolt.controller.js';
import { verifyClientToken } from '../middleware/auth.js';

const app = express.Router();

// ==========================================
// RUTAS DE LA API
// ==========================================

// 1. Obtener lista de OLTs (Rápido/Síncrono)
// 
app.get('/olts', verifyClientToken, getOLTList);

// 2. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/unauthorized', verifyClientToken, getONUsUnauthorized);

// 3. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/:id/status', verifyClientToken, getONUStatus);

// 4. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/:id/signal', verifyClientToken, getONUSignal);

// 5. Obtener VLANs de una OLT específica (Lento/Asíncrono)
// 
app.get('/olts/:id/vlans', verifyClientToken, getVLANsList);

// 6. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.post('/onus/authorize', verifyClientToken, authorizeONU);
// 7. Activar ONU (Lento/Asíncrono)
// 
app.post('/onus/:id/enable', verifyClientToken, enableONU);
// 8. Desactivar ONU (Lento/Asíncrono)
// 
app.post('/onus/:id/disable', verifyClientToken, disableONU);

export default app;