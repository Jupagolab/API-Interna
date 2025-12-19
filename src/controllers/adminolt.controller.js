import axios from "axios";
import { conectarYEsperarWebSocket } from "../services/websocket.js";
import { ADMINOLT_CONFIG } from "../config/server.js";

export const getOLTList = async (req, res) => {
  try {
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/olt-list/`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
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
    const apiUrl = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/vlans/${oltId}/`;
    const { data } = await axios.get(apiUrl, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
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
    const apiUrl = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/onu/unauthorized/`;
    const { data } = await axios.get(apiUrl, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
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

// Validar Estado de la ONU (Online/Offline/Los)
export const getONUStatus = async (req, res) => {
  const idOnu = req.params.id; // ID interno de AdminOLT
  console.log(`--- Consultando Estado para ONU ID: ${idOnu} ---`);

  try {
    // Endpoint documentado en página 16
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/info-onu-authorized/run-status-onu/${idOnu}/`;
    
    const { data } = await axios.get(url, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
    });

    if (data.facility) {
      const wsResult = await conectarYEsperarWebSocket(data.facility);
      // La respuesta útil viene dentro de 'onu_run_status'
      return res.json({
        success: true,
        status: wsResult.onu_run_status?.label || 'Desconocido', // Ej: "Online"
        details: wsResult.onu_run_status
      });
    }

    res.json({ success: true, data: data });

  } catch (error) {
    console.error('Error consultando estado:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// Obtener Señal Óptica (RX) en tiempo real
export const getONUSignal = async (req, res) => {
  const idOnu = req.params.id;
  console.log(`--- Midiendo Señal para ONU ID: ${idOnu} ---`);

  try {
    // Endpoint documentado en página 14
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/onu/olt-rx-signal/${idOnu}/`;
    
    const { data } = await axios.get(url, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
    });

    if (data.facility) {
      const wsResult = await conectarYEsperarWebSocket(data.facility);
      // La respuesta útil viene dentro de 'onu_olt_rx_signal'
      return res.json({
        success: true,
        signal_1490: wsResult.onu_olt_rx_signal?.signal_1490, // Señal de bajada
        status_text: wsResult.onu_olt_rx_signal?.reference,   // Ej: "very-good"
        full_data: wsResult.onu_olt_rx_signal
      });
    }

    res.json({ success: true, data: data });

  } catch (error) {
    console.error('Error obteniendo señal:', error.message);
    res.status(500).json({ error: error.message });
  }
}

export const authorizeONU = async (req, res) => {
  console.log('--- Iniciando Autorización de ONU ---');

  // Los datos de la ONU vienen en el body del request
  const payload = req.body;

  try {
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/onu/authorize/`;

    // 1. Hacemos el POST [cite: 692]
    const { data } = await axios.post(url, payload, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
    });

    // CASO A: La API nos pide esperar (WebSocket) [cite: 134]
    if (data.facility) {
      console.log(`Recibido facility: ${data.facility}. Conectando a WS...`);

      // Reutilizamos tu servicio "llave maestra"
      const wsResult = await conectarYEsperarWebSocket(data.facility);

      return res.json({
        success: true,
        mode: 'websocket',
        data: wsResult
      });
    }

    // CASO B: La API respondió directo (según el ejemplo de la doc) [cite: 725]
    console.log('Respuesta directa recibida (sin facility).');
    res.json({
      success: true,
      mode: 'direct',
      data: data
    });

  } catch (error) {
    console.error('Error autorizando ONU:', error.message);
    // Manejo de errores detallado (útil si falta un campo requerido como 'sn' o 'port')
    res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
}

export const enableONU = async (req, res) => {
  const idOnu = req.params.id; // ID interno de AdminOLT
  console.log(`--- Activando ONU ID: ${idOnu} ---`);

  try {
    // Endpoint: POST /onu/enable/<int:id_onu>/
    // Documentación: Página 30 
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/onu/enable/${idOnu}/`;

    // Enviamos body vacío {}
    const { data } = await axios.post(url, {}, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
    });

    // Manejo Híbrido: Si devuelve facility, usamos WebSocket 
    if (data.facility) {
      console.log(`Recibido facility: ${data.facility}. Esperando confirmación WS...`);
      const wsResult = await conectarYEsperarWebSocket(data.facility);
      
      return res.json({
        success: true,
        mode: 'websocket',
        message: 'ONU activada correctamente',
        data: wsResult
      });
    }

    // Respuesta directa 
    res.json({ 
        success: true, 
        mode: 'direct', 
        message: 'ONU activada correctamente',
        data: data 
    });

  } catch (error) {
    console.error('Error activando ONU:', error.message);
    res.status(500).json({ 
        error: error.message,
        details: error.response?.data || null 
    });
  }
}

export const disableONU = async (req, res) => {
  const idOnu = req.params.id; // ID interno de AdminOLT
  console.log(`--- Desactivando ONU ID: ${idOnu} ---`);

  try {
    // Endpoint: POST /onu/disable/<int:id_onu>/
    // [cite: 808]
    const url = `https://${ADMINOLT_CONFIG.subdomain}.adminolt.com/api/onu/disable/${idOnu}/`;

    // Enviamos un objeto vacío {} como body porque es un POST, aunque no requiera datos
    const { data } = await axios.post(url, {}, {
      headers: { 'Authorization': `Token ${ADMINOLT_CONFIG.token}` }
    });

    // Manejo Híbrido: Si devuelve facility, usamos WebSocket
    if (data.facility) {
      console.log(`Recibido facility: ${data.facility}. Esperando confirmación WS...`);
      const wsResult = await conectarYEsperarWebSocket(data.facility);
      
      return res.json({
        success: true,
        mode: 'websocket',
        message: 'ONU desactivada correctamente',
        data: wsResult
      });
    }

    // Respuesta directa (si la OLT respondió rápido)
    res.json({ 
        success: true, 
        mode: 'direct', 
        message: 'ONU desactivada correctamente',
        data: data 
    });

  } catch (error) {
    console.error('Error desactivando ONU:', error.message);
    res.status(500).json({ 
        error: error.message,
        details: error.response?.data || null 
    });
  }
}