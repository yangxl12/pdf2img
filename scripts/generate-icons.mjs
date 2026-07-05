/**
 * Generate PWA icon PNGs (192x192 and 512x512) using Node.js stdlib only.
 * Usage: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync, crc32 } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public");

mkdirSync(OUT_DIR, { recursive: true });

function createPng(width, height) {
  const BG_R = 0xf7, BG_G = 0xf3, BG_B = 0xea; // warm cream
  const ACC_R = 0x5d, ACC_G = 0x40, ACC_B = 0x37; // dark brown

  const cx = width / 2, cy = height / 2;
  const radius = width * 0.38;
  const radiusSq = radius * radius;

  // Build raw pixel rows (RGBA)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = [0]; // filter byte: none
    for (let x = 0; x < width; x++) {
      const dx = x - cx, dy = y - cy;
      const inCircle = dx * dx + dy * dy <= radiusSq;
      if (inCircle) {
        row.push(ACC_R, ACC_G, ACC_B, 255);
      } else {
        row.push(BG_R, BG_G, BG_B, 255);
      }
    }
    rawRows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rawRows);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData) >>> 0, 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = deflateSync(raw);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = createPng(size, size);
  const path = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`  ✓ ${path}  (${png.length.toLocaleString()} bytes)`);
}

console.log("\nDone. Icons generated.");
