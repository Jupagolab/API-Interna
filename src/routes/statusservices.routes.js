import express from 'express';
import { getStatusServicios } from '../controllers/statusservices.controller.js';

const router = express.Router();

router.get("/estadoservicios", getStatusServicios);

export default router;

