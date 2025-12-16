import { Router } from "express";
import { addVenta } from "../controllers/ventas.js";
import { findPreventa, markAsResolved } from "../controllers/preventa.js"

const router = Router();

router.post("/", addVenta);

router.post("/preventa", findPreventa);

router.put("/preventa", markAsResolved);

export default router;