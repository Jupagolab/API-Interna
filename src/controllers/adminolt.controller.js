import axios from "axios";
import { conectarYEsperarWebSocket } from "../services/websocket.js";

// --- CONFIGURACIÓN ---
const CONFIG = {
  subdomain: process.env.ADMINOLT_SUBDOMAIN ,
  token: process.env.ADMINOLT_API_TOKEN
};

export const getOLTList = async (req, res) => {
  try {
    const url = `https://${CONFIG.subdomain}.adminolt.com/api/olt-list/`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Token ${CONFIG.token}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getVLANsList = async (req, res) => {
  const oltId = req.params.id;
  console.log(`--- Buscando VLANs para OLT ID: ${oltId} ---`);

  try {
    // Paso A: Pedir facility para las VLANs
    const apiUrl = `https://${CONFIG.subdomain}.adminolt.com/api/vlans/${oltId}/`;
    const { data } = await axios.get(apiUrl, {
      headers: { 'Authorization': `Token ${CONFIG.token}` }
    });

    if (!data.facility) {
      // A veces AdminOLT devuelve la lista directa si está en caché, manejamos ese caso:
      if (data.vlans) return res.json({ success: true, cached: true, data: data.vlans });
      return res.status(500).json({ error: 'No facility returned' });
    }

    // Paso B: Esperar al WebSocket (reusamos la misma función)
    const wsResult = await conectarYEsperarWebSocket(data.facility);

    // Paso C: Extraer la lista de VLANs
    const vlans = wsResult.vlans || [];

    res.json({
      success: true,
      olt_id: oltId,
      count: vlans.length,
      data: vlans
    });

  } catch (error) {
    console.error('Error en VLANs:', error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getONUsUnauthorized = async (req, res) => {
  console.log('--- Iniciando búsqueda de ONUs No Autorizadas ---');
  try {
    // Paso A: Pedir facility
    const apiUrl = `https://${CONFIG.subdomain}.adminolt.com/api/onu/unauthorized/`;
    const { data } = await axios.get(apiUrl, {
      headers: { 'Authorization': `Token ${CONFIG.token}` }
    });

    if (!data.facility) return res.status(500).json({ error: 'No facility returned' });

    // Paso B: Esperar al WebSocket
    const wsResult = await conectarYEsperarWebSocket(data.facility);

    // Paso C: Filtrar solo la parte que nos interesa
    const onus = wsResult.unauthorized_onus || {};

    res.json({
      success: true,
      count: Object.keys(onus).length,
      data: onus
    });

  } catch (error) {
    console.error('Error en ONUs:', error.message);
    res.status(500).json({ error: error.message });
  }
}