import express from 'express';
import { getStatusServicios } from '../controllers/statusgator.controller.js';

const router = express.Router();

router.get("/estadoservicios", getStatusServicios);

export default router;

