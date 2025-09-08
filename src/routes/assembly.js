import { Router } from "express";
import { transcribeAudio } from "../controllers/assembly.js";

const router = Router();

router.post("/transcribe", transcribeAudio);

export default router;