import { Router } from "express";
import { addVenta } from "../controllers/ventas.js";
import { findPreventa } from "../controllers/preventa.js"

const router = Router();

router.post("/", addVenta);

router.post("/preventa", findPreventa);

export default router;