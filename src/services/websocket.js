import WebSocket from "ws";

// --- CONFIGURACIÓN ---
const CONFIG = {
  subdomain: process.env.ADMINOLT_SUBDOMAIN,
  token: process.env.ADMINOLT_API_TOKEN
};

// ==========================================
// HELPER: Función Reutilizable para WebSocket
// ==========================================
// Esta función se encarga de la parte "difícil": conectar, esperar y devolver el JSON
export const conectarYEsperarWebSocket = (facility) => {
  return new Promise((resolve, reject) => {
    // URL estándar para sockets en AdminOLT
    const wsUrl = `wss://${CONFIG.subdomain}.adminolt.com/ws/${facility}?subscribe-broadcast`;
    console.log(`   -> Conectando al WS: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    // Timeout de seguridad (45 segundos) por si el servidor no responde
    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
      reject(new Error('Tiempo de espera del WebSocket agotado (Timeout)'));
    }, 45000);

    ws.on('open', () => {
      // Enviamos trigger para iniciar la transmisión de datos
      ws.send("Get response data");
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());

        // Esperamos a que el status sea "DONE"
        if (response.status === 'DONE') {
          clearTimeout(timeout);
          ws.close();
          resolve(response); // Devolvemos todo el objeto JSON
        }
        // Si está en PROGRESS, seguimos esperando sin hacer nada
      } catch (err) {
        console.error("Error parseando mensaje WS", err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};