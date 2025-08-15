import { Router } from "express";
import { addGanador } from "../controllers/sorteo.js";

const router = Router();

router.post("/", addGanador);

export default router;