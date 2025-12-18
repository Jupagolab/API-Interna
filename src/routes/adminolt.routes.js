// src/routes/adminolt.routes.js
import express from 'express';
import { authorizeONU, disableONU, enableONU, getOLTList, getONUSignal, getONUStatus, getONUsUnauthorized, getVLANsList } from '../controllers/adminolt.controller.js';

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

// 3. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/:id/status', getONUStatus);

// 4. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.get('/onus/:id/signal', getONUSignal);

// 5. Obtener VLANs de una OLT específica (Lento/Asíncrono)
// 
app.get('/olts/:id/vlans', getVLANsList);

// 6. Obtener ONUs No Autorizadas (Lento/Asíncrono)
// 
app.post('/onus/authorize', authorizeONU);
// 7. Activar ONU (Lento/Asíncrono)
// 
app.post('/onus/:id/enable', enableONU);
// 8. Desactivar ONU (Lento/Asíncrono)
// 
app.post('/onus/:id/disable', disableONU);

export default app;