// Erzeugt das Vorschaubild für geteilte Links (LinkedIn, WhatsApp): public/images/og-bavhelden.png
// Aufruf: node entwuerfe/logos/vorschaubild.cjs
const sharp = require('sharp');
const path = require('path');
const wurzel = path.join(__dirname, '..', '..');
(async () => {
  const B = 1200, H = 630;
  const grund = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${H}">
    <defs>
      <radialGradient id="g" cx="30%" cy="0%" r="90%">
        <stop offset="0" stop-color="#3DADFF" stop-opacity="0.35"/>
        <stop offset="0.4" stop-color="#3D50FF" stop-opacity="0.4"/>
        <stop offset="1" stop-color="#3D50FF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#0C0E12"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="bold" font-size="60" fill="#ffffff">
      <text x="500" y="255">Betriebsrente, die sich</text>
      <text x="500" y="335">für Ihr Unternehmen</text>
      <text x="500" y="415" fill="#3DADFF">rechnet.</text>
    </g>
    <text x="500" y="490" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="30" fill="#ffffff" fill-opacity="0.7">Für Arbeitgeber, Geschäftsführung und HR</text>
    <text x="500" y="540" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="24" fill="#ffffff" fill-opacity="0.5">eine Marke der DieFinanzchecker GmbH</text>
  </svg>`);
  const logo = await sharp(path.join(wurzel, 'src/assets/images/logo/bavhelden-dunkel.png')).resize({ width: 380 }).toBuffer();
  const m = await sharp(logo).metadata();
  await sharp(grund).composite([{ input: logo, left: 70, top: Math.round((H - m.height) / 2) }]).png({ compressionLevel: 9 }).toFile(path.join(wurzel, 'public/images/og-bavhelden.png'));
  console.log('fertig');
})();
