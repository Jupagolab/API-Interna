/**
 * rif.routes.js
 * Define los endpoints relacionados con la consulta de RIF/cédula.
 *
 * Endpoints disponibles:
 *   GET /api/rif/:doc        → /api/rif/J070339047
 *   GET /api/rif?doc=...     → /api/rif?doc=J070339047
 */

import { Router }from 'express';
import { getRIF } from '../controllers/rif.controller.js';

const router = Router();

// Ruta con parámetro en URL  →  GET /api/rif/J070339047
router.get('/:doc', getRIF);

// Ruta con query string      →  GET /api/rif?doc=J070339047
router.get('/', getRIF);

export default router;