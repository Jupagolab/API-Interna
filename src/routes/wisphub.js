import { Router } from "express";
import { crearTicket } from "../controllers/wisphub.js";

import multer from 'multer'
import { verifyClientToken } from "../middleware/auth.js";

const router = Router();
const upload = multer();

router.post("/tickets", verifyClientToken, upload.none(), crearTicket)

export default router;