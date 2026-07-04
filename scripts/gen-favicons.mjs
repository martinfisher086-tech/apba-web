/**
 * gen-favicons.mjs — rasterize /public/favicon.svg into the full favicon set.
 *
 * Source of truth: public/favicon.svg (the brand mark).
 * Outputs (all under public/):
 *   favicon.ico                  — 16/32/48 PNG-embedded multi-size ICO (legacy + OS)
 *   favicon.png                  — 32×32 transparent PNG
 *   apple-touch-icon.png         — 180×180 opaque (iOS adds its own rounding)
 *   icons/icon-192.png           — 192×192 opaque (PWA manifest)
 *   icons/icon-512.png           — 512×512 opaque (PWA manifest)
 *   icons/icon-maskable-512.png  — 512×512 opaque, mark within safe zone (maskable)
 *
 * Run:  node scripts/gen-favicons.mjs
 * Requires: sharp (already a transitive dep of Astro).
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const NAVY = "#16519E";
const svg = readFileSync(join(PUBLIC, "favicon.svg"));

/** Render the SVG to an N×N PNG buffer. `flatten` fills transparency with navy. */
async function render(size, { flatten = false } = {}) {
  let img = sharp(svg, { density: 512 }).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (flatten) img = img.flatten({ background: NAVY });
  return img.png().toBuffer();
}

/** Assemble a valid .ico that embeds PNG images (supported by all modern UAs). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  const payloads = [];
  entries.forEach(([size, buf], i) => {
    const b = 16 * i;
    dir.writeUInt8(size >= 256 ? 0 : size, b + 0); // width (0 = 256)
    dir.writeUInt8(size >= 256 ? 0 : size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(buf.length, b + 8); // bytes in resource
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += buf.length;
    payloads.push(buf);
  });
  return Buffer.concat([header, dir, ...payloads]);
}

const [png16, png32, png48] = await Promise.all([render(16), render(32), render(48)]);

writeFileSync(join(PUBLIC, "favicon.png"), png32);
writeFileSync(join(PUBLIC, "favicon.ico"), buildIco([[16, png16], [32, png32], [48, png48]]));
writeFileSync(join(PUBLIC, "apple-touch-icon.png"), await render(180, { flatten: true }));

mkdirSync(join(PUBLIC, "icons"), { recursive: true });
writeFileSync(join(PUBLIC, "icons", "icon-192.png"), await render(192, { flatten: true }));
writeFileSync(join(PUBLIC, "icons", "icon-512.png"), await render(512, { flatten: true }));
writeFileSync(join(PUBLIC, "icons", "icon-maskable-512.png"), await render(512, { flatten: true }));

console.log("✓ Favicons generated from public/favicon.svg");
