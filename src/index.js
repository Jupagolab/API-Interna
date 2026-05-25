import app from './config/server.js'
import './config/database.js';
import { initWhatsApp } from './services/whatsapp.service.js';
// Prevenir caídas del proceso por excepciones fuera de Express (ej. ws, background jobs)
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException] Error crítico no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] Promesa rechazada no manejada:', reason);
});

const PORT = app.get("port");

app.listen(PORT, () => {
  console.log(`Server on port: ${PORT}`)
  initWhatsApp();
})
