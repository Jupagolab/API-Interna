/**
 * rif.controller.js
 * Recibe la petición HTTP, llama al servicio y devuelve la respuesta.
 * No contiene lógica de negocio — solo traduce HTTP ↔ servicio.
 */

import { consultarRIF } from '../services/seniat.service.js';

export const getRIF = async (req, res) => {
  // Acepta el parámetro tanto por query (?doc=J...) como por param de ruta (/:doc)
  const doc = req.params.doc || req.query.doc;

  if (!doc) {
    return res.status(400).json({ res: 'error', mensaje: 'Debe enviar el RIF o cédula.' });
  }

  try {
    const data = await consultarRIF(doc);
    return res.status(200).json({ res: 'ok', data });
  } catch (err) {
    // Errores de validación → 400, errores de scraping → 502
    const esValidacion = /formato|cédula|rif|letra|dígit/i.test(err.message);
    return res.status(esValidacion ? 400 : 502).json({
      res: 'error',
      mensaje: err.message,
    });
  }
}