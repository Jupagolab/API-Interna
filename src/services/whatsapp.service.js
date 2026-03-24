import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const CHANNEL_ID = process.env.WHATSAPP_CHANNEL_ID;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('Escanea el QR con tu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp conectado'));

client.on('disconnected', (reason) => {
  console.log('⚠️ WhatsApp desconectado:', reason);
  client.initialize();
});

export const initWhatsApp = () => client.initialize();

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