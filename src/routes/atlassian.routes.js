import express from 'express';
import { getStatusAtlassian } from '../controllers/atlassian.controller.js';

const router = express.Router();

// Obtener estado formateado de un Statuspage de Atlassian (sin autenticación)
router.get("/estadoservicios", getStatusAtlassian);

export default router;
