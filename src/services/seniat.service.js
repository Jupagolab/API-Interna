/**
 * seniat.service.js  (ESM)
 * Lógica pura de consulta al SENIAT — sin dependencia de Express.
 */

// ─── Imports nativos primero ──────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ─── __dirname ────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import Jimp from 'jimp';

// ─── Imports de terceros ──────────────────────────────────────────────────────
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';
import { stringify } from 'querystring';

// ─── Configuración ────────────────────────────────────────────────────────────
const { OCR_API_KEY, SENIAT_CAPTCHA, SENIAT_BUSCA } = process.env;
const TMP_DIR        = path.join(__dirname, '..', '..', 'tmp');
const MAX_INTENTOS   = 10;
const DEBUG          = process.env.NODE_ENV !== 'production';

// ─── Utilidades internas ──────────────────────────────────────────────────────

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function limpiarTmp(mantenerHtml = false) {
  ['captcha.jpg', 'lee.jpg'].forEach(f => {
    const p = path.join(TMP_DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
  if (!mantenerHtml) {
    const h = path.join(TMP_DIR, 'respuesta.html');
    if (fs.existsSync(h)) fs.unlinkSync(h);
  }
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validarDoc(doc) {
  doc = doc.replace(/\s+/g, '').toUpperCase();
  if (!doc) throw new Error('Debe ingresar la cédula o RIF.');

  const primera = doc[0];
  if (['V', 'E'].includes(primera)) {
    if (!/^[VE]\d{7,8}$/.test(doc))
      throw new Error('La cédula debe contener 7 u 8 dígitos numéricos.');
  } else if (['J', 'G', 'P'].includes(primera)) {
    if (!/^[JGP]\d{9}$/.test(doc))
      throw new Error('El RIF debe contener 9 dígitos numéricos.');
  } else {
    throw new Error('Formato no válido. La primera letra debe ser J, G, P, V o E.');
  }
  return doc;
}

// ─── Dígito verificador ───────────────────────────────────────────────────────

function calcularDigitoCedula(c) {
  const l = c[0].toUpperCase();
  const n = c.slice(1).length === 8 ? c.slice(1) : '0' + c.slice(1);
  const d = (l + n + '1').split('');

  d[8] = String(Number(d[8]) * 2);
  d[7] = String(Number(d[7]) * 3);
  d[6] = String(Number(d[6]) * 4);
  d[5] = String(Number(d[5]) * 5);
  d[4] = String(Number(d[4]) * 6);
  d[3] = String(Number(d[3]) * 7);
  d[2] = String(Number(d[2]) * 2);
  d[1] = String(Number(d[1]) * 3);

  const especial = l === 'V' ? 1 : l === 'E' ? 2 : 0;
  const suma     = d.slice(1, 9).reduce((a, x) => a + Number(x), 0) + especial * 4;
  const dv       = (11 - (suma % 11)) >= 10 ? 0 : 11 - (suma % 11);

  return l + n + dv;
}

// ─── OCR ──────────────────────────────────────────────────────────────────────

async function leerOCRSpace(imagePath, ocrEngine = 2) {
  const imageData = fs.readFileSync(imagePath).toString('base64');
  const form      = new FormData();

  form.append('base64Image', `data:image/jpeg;base64,${imageData}`);
  form.append('language', 'eng');
  form.append('isOverlayRequired', ocrEngine === 3 ? 'true' : 'false');
  form.append('OCREngine', String(ocrEngine));

  const { data } = await axios.post('https://api.ocr.space/parse/image', form, {
    headers: { ...form.getHeaders(), apikey: OCR_API_KEY },
  });

  if (data.ErrorMessage?.length) throw new Error('Error OCR: ' + data.ErrorMessage[0]);

  let text = ocrEngine === 3
    ? data.ParsedResults[0].TextOverlay.Lines
        .map(l => l.Words.map(w => w.WordText).join('')).join('')
    : data.ParsedResults[0].ParsedText || '';

  text = text.replace(/[^a-zA-Z0-9]/g, '');
  if (text.length > 0) text = text[0].replace(/[lLI]/, '1') + text.slice(1);

  if (DEBUG) console.log(`[OCR] Código leído: "${text}"`);
  return text;
}

// ─── Procesamiento de imagen ──────────────────────────────────────────────────

async function procesarCaptcha(client) {
  ensureTmpDir();

  const captchaPath = path.join(TMP_DIR, 'captcha.jpg');
  const leePath     = path.join(TMP_DIR, 'lee.jpg');

  const res = await client.get(SENIAT_CAPTCHA, { responseType: 'arraybuffer' });
  if (res.status !== 200)
    throw new Error(`No se pudo descargar el captcha. Código: ${res.status}`);

  fs.writeFileSync(captchaPath, res.data);

  const image = await Jimp.read(captchaPath);
  const origW = image.getWidth();
  const origH = image.getHeight();

  image
    .resize(origW * 4, origH * 4, Jimp.RESIZE_BICUBIC)
    .threshold({ max: 128 })
    .blur(3)
    .resize(300, 90, Jimp.RESIZE_BICUBIC);

  const canvas = new Jimp(Math.round(300 * 1.3), Math.round(90 * 1.3), 0xFFFFFFFF);
  canvas
    .composite(image, Math.round((300 * 1.3 - 300) / 2), Math.round((90 * 1.3 - 90) / 2))
    .blur(2)
    .threshold({ max: 100 })
    .resize(300, 90, Jimp.RESIZE_BICUBIC);

  await canvas.writeAsync(leePath);
  return leePath;
}

// ─── Parseo HTML ──────────────────────────────────────────────────────────────

/**
 * Extrae todas las tablas del HTML ignorando anidamiento.
 * Resuelve el problema de tablas anidadas que confundía al regex simple.
 */
function extraerTablas(html) {
  const tablas = [];
  let i = 0;

  console.log(html)

  while (i < html.length) {
    // Buscar apertura de <table ...>
    const inicio = html.toLowerCase().indexOf('<table', i);
    if (inicio === -1) break;

    // Contar niveles de anidamiento para encontrar el </table> correcto
    let nivel    = 0;
    let j        = inicio;
    let contenido = '';

    while (j < html.length) {
      const abre  = html.toLowerCase().indexOf('<table', j + 1);
      const cierra = html.toLowerCase().indexOf('</table', j + 1);

      if (cierra === -1) break;

      // Si hay otra apertura antes del cierre, aumentar nivel
      if (abre !== -1 && abre < cierra) {
        nivel++;
        j = abre;
      } else {
        if (nivel === 0) {
          // Este es el cierre de nuestra tabla raíz
          const fin = html.indexOf('>', cierra) + 1;
          contenido = html.slice(inicio, fin);
          i = fin;
          break;
        }
        nivel--;
        j = cierra;
      }
    }

    if (contenido) tablas.push(contenido);
    else { i = inicio + 1; }
  }

  return tablas;
}

/**
 * Limpia el HTML de una tabla: quita tags, decodifica entidades, normaliza espacios.
 */
function limpiarTexto(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#xA0;/g, ' ')
    .replace(/\?/g, 'o')       // el SENIAT usa iso-8859 y "ó" aparece como "?"
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsearRespuesta(html) {
  // Guardar HTML crudo en desarrollo para inspección
  if (DEBUG) {
    fs.writeFileSync(path.join(TMP_DIR, 'respuesta.html'), html, 'utf8');
    console.log(`[DEBUG] HTML guardado en ${path.join(TMP_DIR, 'respuesta.html')}`);
  }

  // Extraer tablas raíz (sin anidamiento)
  const tablasRaw = extraerTablas(html);
  const tablas    = tablasRaw.map(limpiarTexto);

  if (DEBUG) {
    console.log(`[DEBUG] Total tablas encontradas: ${tablas.length}`);
    tablas.forEach((t, idx) => console.log(`[DEBUG] Tabla[${idx}]: ${t.substring(0, 120)}`));
  }

  if (tablas.length === 0) return null;

  // ── Buscar la tabla que contiene el resultado ─────────────────────────────
  // El SENIAT devuelve una tabla con el RIF y nombre, buscamos la que
  // contenga un patrón de RIF (letra + 9 dígitos) o el mensaje de error.
  const RIF_REGEX    = /\b[JGPVE]\d{9}\b/i;
  const ERROR_REGEX  = /c[oó]digo.*no.*coincide|no existe el contribuyente/i;
  const DATOS_REGEX  = /actividad|condici[oó]n|contribuyente/i;

  let tablaEncabezado = null;
  let tablaDatos      = null;
  let captchaError    = false;

  for (const t of tablas) {
    if (ERROR_REGEX.test(t)) {
      if (/c[oó]digo.*no.*coincide/i.test(t)) {
        captchaError = true;
        break;
      }
      if (/no existe el contribuyente/i.test(t))
        return { registro: 'NO_EXISTE', rif: '', nombre: 'No existe el contribuyente solicitado' };
    }
    if (RIF_REGEX.test(t) && !tablaEncabezado)   tablaEncabezado = t;
    if (DATOS_REGEX.test(t) && !tablaDatos)        tablaDatos      = t;
  }

  if (captchaError) return 'CAPTCHA_ERROR';
  if (!tablaEncabezado) return null;

  // ── Parsear encabezado (RIF + Nombre + Siglas) ────────────────────────────
  const registro  = /REGISTRO VENCIDO/i.test(tablaEncabezado) ? 'VENCIDO' : 'ACTIVO';
  const encabeza  = tablaEncabezado.replace(/REGISTRO VENCIDO/i, '').trim();

  // Extraer RIF del texto
  const rifMatch  = encabeza.match(/\b([JGPVE]\d{9})\b/i);
  const rif       = rifMatch ? rifMatch[1].toUpperCase() : '';

  // El resto después del RIF es nombre + siglas
  const resto     = rif ? encabeza.slice(encabeza.indexOf(rif) + rif.length).trim() : encabeza;
  const siglasM   = resto.match(/\(([^)]+)\)/);
  const siglas    = siglasM ? `(${siglasM[1]})` : '';
  const nombre    = resto
    .replace(/\([^)]+\)/, '')
    .replace(/[^A-Za-z0-9áéíóúüÁÉÍÓÚÜñÑ\s.,-]/g, '')
    .trim();

  // ── Parsear datos (Actividad económica + Condición) ────────────────────────
  let actividad = '';
  let condicion = '';

  if (tablaDatos) {
    // El formato típico es: "Actividad Económica: VALOR Condición: VALOR"
    const actMatch = tablaDatos.match(/actividad\s+econ[oó]mica\s*:?\s*([^:]+?)(?=condici[oó]n|$)/i);
    const conMatch = tablaDatos.match(/condici[oó]n\s*:?\s*(.+?)(?=actividad|$)/i);

    actividad = actMatch ? actMatch[1].trim() : '';
    condicion = conMatch ? conMatch[1].trim() : '';

    // Fallback: split por ":"
    if (!actividad && !condicion) {
      const partes  = tablaDatos.split(':');
      actividad = partes.length > 1 ? partes[1].replace(/condici[oó]n/i, '').trim() : '';
      condicion = partes.length > 2 ? partes[2].trim() : '';
    }
  }

  return { registro, rif, nombre, siglas, actividad, condicion };
}

// ─── Función principal exportada ──────────────────────────────────────────────

export async function consultarRIF(docRaw) {
  let doc = validarDoc(docRaw);
  if (/^[VE]/.test(doc)) doc = calcularDigitoCedula(doc);

  const jar = new CookieJar();

  const tlsAnterior = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const client = wrapper(axios.create({
    jar,
    timeout: 30000,
  }));

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    if (DEBUG) console.log(`\n[SENIAT] Intento ${intento}/${MAX_INTENTOS} — doc: ${doc}`);

    const leePath = await procesarCaptcha(client);
    const codigo  = await leerOCRSpace(leePath, 2);

    if (!codigo) {
      if (DEBUG) console.log('[SENIAT] OCR devolvió vacío, reintentando...');
      limpiarTmp(true);
      continue;
    }

    const form = new FormData();
    form.append('codigo', codigo);
    form.append('p_rif', doc);

    const { data: html } = await client.post(SENIAT_BUSCA, form, {
      headers: form.getHeaders(),
    });

    const resultado = parsearRespuesta(html);

    if (resultado === 'CAPTCHA_ERROR') {
      if (DEBUG) console.log('[SENIAT] Captcha incorrecto, reintentando...');
      limpiarTmp(true);  // mantener HTML para diagnóstico
      continue;
    }

    limpiarTmp();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = tlsAnterior;
    return resultado;
  }

  limpiarTmp();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = tlsAnterior;
  throw new Error(`No se pudo resolver el captcha después de ${MAX_INTENTOS} intentos.`);
}