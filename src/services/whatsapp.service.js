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
  return await client.pupPage.evaluate(async (chId, msg) => {
    try {
      const newsletter = window.Store.WAWebNewsletterCollection._models.find(
        n => n.id._serialized === chId
      );
      if (!newsletter) return { error: 'Canal no encontrado' };

      await window.Store.SendChannelMessage.sendNewsletterTextMsg(
        newsletter,
        msg,
        { linkPreview: null }
      );
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  }, CHANNEL_ID, text);
};
