import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "node_modules", "pdfjs-dist");
const targetRoot = join(root, "public", "pdfjs");

const assetDirs = ["cmaps", "standard_fonts", "wasm", "iccs", "image_decoders"];

await mkdir(targetRoot, { recursive: true });

for (const dir of assetDirs) {
  const from = join(sourceRoot, dir);
  const to = join(targetRoot, dir);
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

console.log(`Synced PDF.js assets to ${targetRoot}`);
