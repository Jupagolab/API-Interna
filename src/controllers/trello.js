import trelloClient from "../utils/trelloClient.js";
import { configDotenv } from "dotenv";
import Ventas from '../models/ventas.js';
configDotenv();

const { TRELLO_ID_LIST_ASIGNAR } = process.env;

export const getMembersBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/members`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}

export const getCardsName = async (req, res, next) => {
  try {
    const { nombre, apellido } = req.body;
//    const response = await Ventas.find({"cedula": nombre})
//    const response = await Ventas.find({"nombre_completo": {"$regex": `"${apellido}.*${nombre}"`}});
      const response = await Ventas.find({
      $and: [
    { nombre_completo: { $regex: nombre, $options: "i" } },
    { nombre_completo: { $regex: apellido, $options: "i" } }
  ]})
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export const getLabelsBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/labels`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}

export const getCustomFieldsBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/customFields`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}

export const getCardsBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/cards`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}

export const addNewCard = async (req, res, next) => {
  try {
    trelloClient.defaults.params["idList"] = TRELLO_ID_LIST_ASIGNAR;
    const { name, desc, labels, members } = req.body;

    trelloClient.defaults.params["name"] = name;
    trelloClient.defaults.params["desc"] = desc;
    trelloClient.defaults.params["idLabels"] = labels.toString();
    trelloClient.defaults.params["idMembers"] = members.toString();
    trelloClient.defaults.params["start"] = Date.now();

    const response = await trelloClient.post(`/cards`);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}
export const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customFields = req.body;
    const response = await trelloClient.put(`/cards/${id}/customFields`, customFields);
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
}
