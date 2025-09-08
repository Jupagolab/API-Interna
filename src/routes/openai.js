import { Router } from "express";
import { transcribeAudio } from "../controllers/openai.js";

const router = Router();

router.post("/transcribir", transcribeAudio)

export default router;