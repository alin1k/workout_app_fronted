/**
 * Generate PWA icons from an inline SVG.
 * Run with: node scripts/generate-icons.mjs
 *
 * Requires: npm install -D sharp   (one-time)
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

// ── Inline SVG icon ─────────────────────────────────────────────
// A simple "G" on a rounded green background matching the Grove palette.
function makeSvg(size) {
  const fontSize = Math.round(size * 0.52);
  const dy = Math.round(size * 0.02);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#3d7a4a"/>
  <text x="50%" y="50%" dy="${dy}" text-anchor="middle" dominant-baseline="central"
        font-family="'Hanken Grotesk','Helvetica Neue',Arial,sans-serif"
        font-weight="800" font-size="${fontSize}" fill="#f5f7f0" letter-spacing="-0.02em">G</text>
</svg>`;
}

// ── Try sharp (best quality), fall back to raw SVG ──────────────
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  // sharp not available — just write SVGs
  console.log('sharp not installed — writing SVG icons instead (still works for PWA).');
  for (const size of [192, 512]) {
    const path = resolve(publicDir, `icon-${size}.svg`);
    writeFileSync(path, makeSvg(size));
    console.log(`  ✓ ${path}`);
  }
  console.log('\nTip: npm install -D sharp && node scripts/generate-icons.mjs  for PNG icons.');
  process.exit(0);
}

for (const size of [192, 512]) {
  const buf = await sharp(Buffer.from(makeSvg(size)))
    .resize(size, size)
    .png()
    .toBuffer();
  const path = resolve(publicDir, `icon-${size}.png`);
  writeFileSync(path, buf);
  console.log(`  ✓ ${path}`);
}
console.log('Done — PNG icons written.');
