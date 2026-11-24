// Cloudflare-Worker für bavhelden.de
// - Alle normalen Seitenaufrufe liefert Cloudflare direkt aus dem Ordner dist/ aus
//   (dieser Code läuft dafür gar nicht, siehe "run_worker_first" in wrangler.jsonc).
// - Nur /api/anfrage landet hier: Das Kontaktformular wird geprüft und als E-Mail
//   über Cloudflare Email Routing an die Adresse aus EMPFAENGER geschickt.
import { EmailMessage } from 'cloudflare:email';

const MITARBEITERZAHLEN = ['1-9', '10-49', '50-249', '250+'];
const MAX_LAENGE = { firmenname: 200, ansprechpartner: 200, email: 200, telefon: 50, nachricht: 5000 };
const EMAIL_MUSTER = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/anfrage') {
      if (request.method !== 'POST') {
        return new Response('Methode nicht erlaubt', { status: 405, headers: { Allow: 'POST' } });
      }
      return anfrageVerarbeiten(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function anfrageVerarbeiten(request, env) {
  const willJson = (request.headers.get('Accept') || '').includes('application/json');
  const antwort = (ok, status, fehler) =>
    willJson
      ? Response.json(ok ? { ok: true } : { ok: false, fehler }, { status })
      : Response.redirect(new URL(`/?anfrage=${ok ? 'gesendet' : 'fehler'}#kontakt`, request.url), 303);

  // Nur Formulare von der eigenen Seite annehmen
  const herkunft = request.headers.get('Origin');
  if (herkunft && new URL(herkunft).host !== new URL(request.url).host) {
    return antwort(false, 403, 'Ungültige Herkunft');
  }

  let formular;
  try {
    formular = await request.formData();
  } catch {
    return antwort(false, 400, 'Ungültige Daten');
  }
  const feld = (name) => String(formular.get(name) ?? '').trim();

  // Spam-Falle: Dieses Feld ist für Menschen unsichtbar. Ist es ausgefüllt, war es ein
  // Bot – wir tun so, als hätte alles geklappt, verschicken aber nichts.
  if (feld('webseite')) return antwort(true, 200);

  const daten = {
    firmenname: feld('firmenname'),
    ansprechpartner: feld('ansprechpartner'),
    mitarbeiterzahl: feld('mitarbeiterzahl'),
    email: feld('email'),
    telefon: feld('telefon'),
    nachricht: feld('nachricht'),
  };

  const fehlt = !daten.firmenname || !daten.ansprechpartner || !daten.email || feld('dsgvo') !== 'on';
  const zuLang = Object.entries(MAX_LAENGE).some(([name, max]) => daten[name].length > max);
  if (fehlt || zuLang || !EMAIL_MUSTER.test(daten.email) || !MITARBEITERZAHLEN.includes(daten.mitarbeiterzahl)) {
    return antwort(false, 400, 'Bitte prüfen Sie Ihre Angaben.');
  }

  try {
    const roh = mailZusammenbauen(daten, env.ABSENDER, env.EMPFAENGER);
    await env.ANFRAGE_MAIL.send(new EmailMessage(env.ABSENDER, env.EMPFAENGER, roh));
  } catch (e) {
    console.error('Versand der Anfrage fehlgeschlagen:', e);
    return antwort(false, 500, 'Versand fehlgeschlagen');
  }
  return antwort(true, 200);
}

function mailZusammenbauen(d, absender, empfaenger) {
  const text = [
    'Neue Anfrage über das Kontaktformular auf bavhelden.de',
    '',
    `Firma:           ${d.firmenname}`,
    `Ansprechpartner: ${d.ansprechpartner}`,
    `Mitarbeiter:     ${d.mitarbeiterzahl}`,
    `E-Mail:          ${d.email}`,
    `Telefon:         ${d.telefon || '–'}`,
    '',
    'Nachricht:',
    d.nachricht || '–',
    '',
    '---',
    'Einwilligung zur Datenverarbeitung: erteilt',
    `Eingegangen: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    'Mit „Antworten“ schreiben Sie direkt an den Interessenten.',
  ].join('\r\n');

  const domain = absender.split('@')[1];
  return [
    `From: bAVhelden Kontaktformular <${absender}>`,
    `To: <${empfaenger}>`,
    `Reply-To: <${d.email}>`,
    `Subject: ${kopfzeile(`bAV-Anfrage: ${d.firmenname}`)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64(text).replace(/.{1,76}/g, '$&\r\n'),
  ].join('\r\n');
}

// Umlaute und Sonderzeichen im Betreff sicher kodieren (und Zeilenumbrüche entfernen)
function kopfzeile(wert) {
  return `=?UTF-8?B?${base64(wert.replace(/[\r\n]+/g, ' '))}?=`;
}

function base64(text) {
  let binaer = '';
  for (const byte of new TextEncoder().encode(text)) binaer += String.fromCharCode(byte);
  return btoa(binaer);
}
