import { Router } from "express";
import { addVenta } from "../controllers/ventas.js";
import { findPreventa, markAsResolved } from "../controllers/preventa.js"
import { verifyClientToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyClientToken, addVenta);

router.post("/preventa", verifyClientToken, findPreventa);

router.put("/preventa", verifyClientToken, markAsResolved);

export default router;