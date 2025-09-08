import axios from "axios";
import fs from "fs-extra";

const { ASSEMBLY_BASE_URL, ASSEMBLY_API_KEY } = process.env;

const baseUrl = ASSEMBLY_BASE_URL;
const headers = {
  authorization: ASSEMBLY_API_KEY, // ⚠️ Reemplaza con tu API Key real
};
export const transcribeAudio = async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ error: "Falta la URL del audio" });
    }

    // Paso 1: Crear la transcripción
    const data = {
      audio_url: audioUrl,
    };

    const url = `${baseUrl}/v2/transcript`;
    const response = await axios.post(url, data, { headers });

    const transcriptId = response.data.id;


    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;

    // Paso 2: Polling hasta que finalice
    let transcriptionResult;
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, { headers });
      transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === "completed") {
        break;
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcripción fallida: ${transcriptionResult.error}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera 3s antes de reintentar
      }
    }

    // Paso 3: Responder al cliente
    res.json({
      text: transcriptionResult.text,
      transcriptionResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en la transcripción" });
  }

}
