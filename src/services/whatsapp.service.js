import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const CHANNEL_ID = process.env.WHATSAPP_CHANNEL_ID;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable', // ← Chrome del sistema
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('Escanea el QR con tu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp conectado'));

client.on('disconnected', async (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  try {
    await client.initialize();
  } catch (error) {
    console.error('❌ Error al intentar reconectar WhatsApp:', error.message);
  }
});

export const initWhatsApp = async (retries = 3) => {
  try {
    await client.initialize();
  } catch (error) {
    console.error('⚠️ Error al inicializar WhatsApp:', error.message);
    if (retries > 0) {
      console.log(`Reintentando inicialización en 5 segundos... (Intentos restantes: ${retries})`);
      setTimeout(() => initWhatsApp(retries - 1), 5000);
    } else {
      console.error('❌ Fallo crítico: No se pudo inicializar WhatsApp después de varios intentos.');
    }
  }
};

export const sendChannelMessage = async (text) => {
  try {
    // Validar formato del ID del canal (debe terminar en @newsletter)
    const chatId = CHANNEL_ID.includes('@') ? CHANNEL_ID : `${CHANNEL_ID}@newsletter`;
    
    // Usamos el método nativo en lugar de inyección de código
    await client.sendMessage(chatId, text);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando mensaje al canal de WhatsApp:', error.message);
    return { error: error.message };
  }
};
