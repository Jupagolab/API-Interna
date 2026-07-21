import { Router } from 'express';
import { sendChannelMessage } from '../services/whatsapp.service.js';
import { sendCumpleMessage, sendCumpleMessageImage } from '../services/whatsapp.service.js';

const router = Router();

router.post('/send', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'El campo message es requerido' });
  }

  try {
    const result = await sendChannelMessage(message);
    if (result.error) return res.status(500).json(result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sendCumple', async (req, res) => {
  const { img_url, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'El campo message es requerido' });
  }

  const imagenExistente = !img_url ? false : true;

  try {
    let result;
    if (imagenExistente) {
      result = await sendCumpleMessageImage(img_url, message);
    } else {
      result = await sendCumpleMessage(message);
    }
    if (result.error) return res.status(500).json(result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;