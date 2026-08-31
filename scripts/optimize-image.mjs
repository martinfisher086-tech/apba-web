/**
 * Prepare an editorial image (course flyer, news hero) for the site.
 *
 * Editors send full-resolution JPEGs (~250 KB). This emits the responsive set
 * the templates expect: `<name>-<width>.jpg` (fallback) and `<name>-<width>.webp`
 * for every width in WIDTHS, written into public/.
 *
 * Usage:
 *   node scripts/optimize-image.mjs <source-image> <public-relative-base>
 *
 * Example:
 *   node scripts/optimize-image.mjs cursos/banner_curso_nuevo.jpg images/cursos/curso-nuevo
 *   → public/images/cursos/curso-nuevo-{640,960,1200}.{jpg,webp}
 *
 * Then point the content record's `image.url` at the 1200px JPEG
 * (`/images/cursos/curso-nuevo-1200.jpg`); `responsiveSources()` in
 * src/lib/images.ts derives the rest of the set from it.
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** Keep in sync with RESPONSIVE_WIDTHS in src/lib/images.ts. */
const WIDTHS = [640, 960, 1200];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, base] = process.argv.slice(2);

if (!source || !base) {
  console.error(
    "Usage: node scripts/optimize-image.mjs <source-image> <public-relative-base>",
  );
  process.exit(1);
}

const outBase = resolve(root, "public", base);
mkdirSync(dirname(outBase), { recursive: true });

const kb = (path) => `${(statSync(path).size / 1024).toFixed(0)} KB`;

for (const width of WIDTHS) {
  const resized = sharp(resolve(root, source)).resize({
    width,
    withoutEnlargement: true,
  });

  const jpg = `${outBase}-${width}.jpg`;
  const webp = `${outBase}-${width}.webp`;

  const { width: w, height: h } = await resized
    .clone()
    .jpeg({
      quality: 80,
      progressive: true,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
    })
    .toFile(jpg);

  await resized.clone().webp({ quality: 78 }).toFile(webp);

  console.log(`${w}×${h}  jpg ${kb(jpg)}  webp ${kb(webp)}  → ${base}-${width}`);
}
