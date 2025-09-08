import fs from "fs";
import OpenAI from "openai";

const { OPENAI_API_KEY } = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Endpoint para recibir audio por link
export const transcribeAudio = async (req, res) => {
  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({ error: "Debes enviar un audioUrl válido" });
    }

    // Descargar el archivo temporalmente
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = `uploads/temp_${Date.now()}.mp3`;
    fs.writeFileSync(filePath, buffer);

    // Enviar a Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    // Borrar archivo temporal
    fs.unlinkSync(filePath);

    res.json({ texto: transcription.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando el audio" });
  }
};