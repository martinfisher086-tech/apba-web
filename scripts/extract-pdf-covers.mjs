/**
 * Extract cover images from Gaceta Psicológica PDFs.
 *
 * Strategy:
 *  1. Intercept each PDF URL in Playwright.
 *  2. Fetch the PDF bytes server-side (Node).
 *  3. Serve an HTML page that embeds the PDF as base64 + renders it with
 *     pdfjs (CDN) on a <canvas>. Cross-origin worker restriction is bypassed
 *     with a blob: URL that importScripts() the CDN worker.
 *  4. Wait for the canvas render, then screenshot.
 *
 * Run from apba-web/:
 *   node scripts/extract-pdf-covers.mjs
 */

import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, "../public/images/gaceta");
mkdirSync(outputDir, { recursive: true });

const journals = [
  {
    number: 1,
    url: "https://psicologos.org.ar/wp-content/uploads/2021/12/Gaceta_psicologica-ultima.pdf",
  },
  {
    number: 2,
    url: "https://psicologos.org.ar/wp-content/uploads/2022/04/Gaceta_psicologica_02_22-03-1-1.pdf",
  },
  {
    number: 3,
    url: "https://psicologos.org.ar/wp-content/uploads/2023/05/Gaceta_Psicologica_03_FEB_2023.pdf",
  },
  {
    number: 4,
    url: "https://psicologos.org.ar/wp-content/uploads/2023/08/Gaceta_Psicologica_04_FINAL_AGOSTO.pdf",
  },
  {
    number: 5,
    url: "https://psicologos.org.ar/wp-content/uploads/2024/01/Gaceta_Psicologica_05_FINAL.pdf",
  },
  {
    number: 6,
    url: "https://psicologos.org.ar/wp-content/uploads/2024/08/Gaceta_Psicologica_06_FINAL.pdf",
  },
];

// Target width for the cover (height scales proportionally with the PDF)
const TARGET_WIDTH = 800;
// CDN — pdfjs 3.11 is stable and widely cached
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

function buildHtml(base64) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; }
  html, body { background:#fff; }
  canvas { display:block; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<!-- 1. Data first so the render script can read it synchronously -->
<script>window.__pdfBase64 = '${base64}';</script>
<!-- 2. pdfjs library -->
<script src="${PDFJS_CDN}/pdf.min.js"></script>
<!-- 3. Render -->
<script>
(async () => {
  try {
    // Blob-URL worker bypasses cross-origin new Worker() restriction
    const workerUrl = '${PDFJS_CDN}/pdf.worker.min.js';
    const workerBlob = new Blob(
      ["importScripts('" + workerUrl + "')"],
      { type: 'text/javascript' }
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

    const base64 = window.__pdfBase64;
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const pdf  = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pg   = await pdf.getPage(1);
    const vp0  = pg.getViewport({ scale: 1 });
    const scale = ${TARGET_WIDTH} / vp0.width;
    const vp   = pg.getViewport({ scale });

    const canvas = document.getElementById('c');
    canvas.width  = Math.round(vp.width);
    canvas.height = Math.round(vp.height);

    await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    window.__pdfDone = true;
  } catch (e) {
    window.__pdfError = String(e);
  }
})();
</script>
</body>
</html>`;
}

const browser = await chromium.launch({ headless: true });

for (const journal of journals) {
  console.log(`\nProcessing issue #${journal.number} …`);
  const context = await browser.newContext({
    viewport: { width: TARGET_WIDTH, height: 1200 },
  });
  const page = await context.newPage();

  try {
    // Intercept the PDF request and serve our rendering HTML instead
    await page.route(journal.url, async (route) => {
      const response = await route.fetch();
      const body = await response.body();
      const base64 = body.toString("base64");
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: buildHtml(base64),
      });
    });

    await page.goto(journal.url, { waitUntil: "load", timeout: 60_000 });

    // Wait until pdfjs signals render complete (or error)
    await page.waitForFunction(
      () => window.__pdfDone || window.__pdfError,
      { timeout: 30_000 }
    );

    const err = await page.evaluate(() => window.__pdfError);
    if (err) throw new Error(`pdfjs render: ${err}`);

    // Screenshot just the canvas element — no browser chrome, exact PDF size
    const canvas = page.locator("#c");
    const outputPath = resolve(outputDir, `cover-${journal.number}.jpg`);
    await canvas.screenshot({ path: outputPath, type: "jpeg", quality: 88 });

    console.log(`  ✓ Saved ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ Failed for issue #${journal.number}: ${err.message}`);
  } finally {
    await context.close();
  }
}

await browser.close();
console.log("\nAll done.");
