import { Router } from "express";
import { addGanador } from "../controllers/sorteo.js";
import { verifyClientToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyClientToken, addGanador);

export default router;