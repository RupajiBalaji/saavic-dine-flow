import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '../public/qr-codes');
const svgDir = path.resolve(outDir, 'svg');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
if (!fs.existsSync(svgDir)) {
  fs.mkdirSync(svgDir, { recursive: true });
}

// Generate for Tables 01 to 20
// Using relative /t/table-XX paths or standard placeholder URL
const baseUrl = process.env.VITE_APP_URL || 'https://saavic.com';

async function generateQRCodes() {
  console.log(`Generating 20 Table QR Codes for base URL: ${baseUrl}...`);

  for (let i = 1; i <= 20; i++) {
    const tableNum = String(i).padStart(2, '0');
    const slug = `table-${tableNum}`;
    const targetUrl = `${baseUrl}/t/${slug}`;

    // 1. High-Res PNG (1024x1024)
    const pngPath = path.join(outDir, `${slug}.png`);
    await QRCode.toFile(pngPath, targetUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#1e3a2b', // Saavic deep leaf emerald
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction for robust phone camera scanning
    });

    // 2. Crisp SVG for printing & vector design
    const svgPath = path.join(svgDir, `${slug}.svg`);
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#1e3a2b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    fs.writeFileSync(svgPath, svgString);

    console.log(`✓ Table ${tableNum} (${slug}): ${targetUrl}`);
  }

  console.log(`\n🎉 All 20 QR codes generated successfully in:`);
  console.log(`- PNGs: ${outDir}`);
  console.log(`- SVGs: ${svgDir}`);
}

generateQRCodes().catch((err) => {
  console.error('Error generating QR codes:', err);
  process.exit(1);
});
