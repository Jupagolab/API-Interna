import { Router } from "express";
import { backupOLT } from "../controllers/olts.js";

const router = Router();

router.post("/backup", backupOLT);

export default router;