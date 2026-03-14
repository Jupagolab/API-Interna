import { Router } from "express";
import { autorizarONU } from "../controllers/smartolt.js";

import multer from 'multer'
import { verifyClientToken } from "../middleware/auth.js";

const router = Router();
const upload = multer();

router.post("/autorizar-onu", verifyClientToken, upload.none(), autorizarONU)

export default router;