import { Router } from "express";
import { addNewCard, getCardsBoard, getCustomFieldsBoard, getLabelsBoard, getCardsName, getMembersBoard, updateCard } from "../controllers/trello.js";
import { verifyClientToken } from "../middleware/auth.js";

const router = Router();

// OBTENER MIEMBROS
router.get("/boards/:id/members", verifyClientToken, getMembersBoard)
// OBTENER ETIQUETAS
router.get("/boards/:id/labels", verifyClientToken, getLabelsBoard)
// OBTENER CAMPOS PERSONALIZADOS
router.get("/boards/:id/customFields", verifyClientToken, getCustomFieldsBoard)
// OBTENER CAMPOS PERSONALIZADOS
router.get("/boards/:id/cards", verifyClientToken, getCardsBoard)
// AGREGAR UNA NUEVA CARD
router.post("/cards", verifyClientToken, addNewCard)
// ACTUALIZAR CARDS
router.put("/cards/:id/customFields", verifyClientToken, updateCard)
// OBTENER CARD POR NOMBRE
router.post("/cards/name", verifyClientToken, getCardsName)


export default router;