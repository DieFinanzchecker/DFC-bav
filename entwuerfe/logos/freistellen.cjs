// Stellt das bAVhelden-Logo frei (weißer Hintergrund -> durchsichtig) und erzeugt
// zusätzlich eine Variante für dunklen Hintergrund (Dunkelblau -> Weiß).
// Aufruf im Projektordner: node entwuerfe/logos/freistellen.cjs
const sharp = require('sharp');
const quelle = 'entwuerfe/logos/bavhelden-original.webp';

(async () => {
  const { data, info } = await sharp(quelle).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const hell = Buffer.alloc(n * 4);   // für helle Hintergründe: Originalfarben
  const dunkel = Buffer.alloc(n * 4); // für dunkle Hintergründe: Dunkelblau wird Weiß
  for (let i = 0; i < n; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    // Deckkraft: Weiß = 0, kräftige Farbe = 1 (weißen Anteil herausrechnen)
    let a = 1 - Math.min(r, g, b) / 255;
    if (a < 0.06) a = 0;
    const f = (c) => (a > 0 ? Math.max(0, Math.min(255, Math.round((c - (1 - a) * 255) / a))) : 0);
    const fr = f(r), fg = f(g), fb = f(b);
    const al = Math.round(a * 255);
    hell.set([fr, fg, fb, al], i * 4);
    const istDunkelblau = fr < 90 && fg < 120 && fb < 190 && fb > fr;
    dunkel.set(istDunkelblau ? [255, 255, 255, al] : [fr, fg, fb, al], i * 4);
  }
  const roh = { raw: { width: info.width, height: info.height, channels: 4 } };
  const ziel = 'src/assets/images/logo/';
  await sharp(hell, roh).trim().png().toFile(ziel + 'bavhelden-hell.png');
  await sharp(dunkel, roh).trim().png().toFile(ziel + 'bavhelden-dunkel.png');
  // Nur die Figur (ohne Schriftzug) für die schmale Kopfzeile
  const figur = await sharp(dunkel, roh).extract({ left: 80, top: 160, width: 1070, height: 500 }).png().toBuffer();
  await sharp(figur).trim().png().toFile(ziel + 'bavhelden-figur-dunkel.png');
  // Kontrollbilder auf dunklem bzw. weißem Grund
  await sharp(ziel + 'bavhelden-dunkel.png').flatten({ background: '#0F110C' }).resize(700).png().toFile('entwuerfe/logos/kontrolle-dunkel.png');
  await sharp(ziel + 'bavhelden-hell.png').flatten({ background: '#ffffff' }).resize(700).png().toFile('entwuerfe/logos/kontrolle-hell.png');
  await sharp(ziel + 'bavhelden-figur-dunkel.png').flatten({ background: '#0F110C' }).resize(700).png().toFile('entwuerfe/logos/kontrolle-figur.png');
})();
