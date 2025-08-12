import trelloClient from "../utils/trelloClient.js";
import { configDotenv } from "dotenv";
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

export const addNewCard = async (req, res) => {
  try {
    const { id } = req.params;
    trelloClient.params["idList"] = TRELLO_ID_LIST_ASIGNAR;
    const { name, desc, labels, members } = req.body;

    trelloClient.params["name"] = name;
    trelloClient.params["desc"] = desc;
    trelloClient.params["labels"] = labels;
    trelloClient.params["members"] = members;
    
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