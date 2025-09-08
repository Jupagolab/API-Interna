import trelloClient from "../utils/trelloClient.js";
import { configDotenv } from "dotenv";
import Ventas from '../models/ventas.js';
configDotenv();

const { TRELLO_ID_LIST_ASIGNAR } = process.env;

export const getMembersBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/members`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const getCardsName = async (req, res) => {
  try {
    const { nombre, apellido } = req.body;
    const response = await Ventas.find({"nombre_completo": {"$regex": `${nombre}.*${apellido}`}});
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const getLabelsBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/labels`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const getCustomFieldsBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/customFields`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const getCardsBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await trelloClient.get(`/boards/${id}/cards`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const addNewCard = async (req, res) => {
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
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
export const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const customFields = req.body;
    const response = await trelloClient.put(`/cards/${id}/customFields`, customFields);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de Trello
      res.status(error.response.status).json({
        error: error.response.data || 'Error from Trello API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}