import { Router } from "express";
import { addNewCard, getCustomFieldsBoard, getLabelsBoard, getMembersBoard, updateCard } from "../controllers/trello.js";

const router = Router();

// OBTENER MIEMBROS
router.get("/boards/:id/members", getMembersBoard)
// OBTENER ETIQUETAS
router.get("/boards/:id/labels", getLabelsBoard)
// OBTENER CAMPOS PERSONALIZADOS
router.get("/boards/:id/customFields", getCustomFieldsBoard)
// OBTENER CUSTOM FIELDS
router.post("/cards", addNewCard)
// ACTUALIZAR CARDS
router.put("/cards/:id/customFields", updateCard)

export default router;