import { Router } from "express";
import { addVenta } from "../controllers/ventas.js";

const router = Router();

router.post("/", addVenta);

export default router;