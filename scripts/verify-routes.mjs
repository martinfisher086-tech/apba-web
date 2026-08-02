/**
 * Verifies that every route declared in extraction/required-routes.json has a
 * corresponding built page in dist/. Run in CI after build.
 *
 * Usage: node scripts/verify-routes.mjs [--dist path/to/dist]
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const distArg = args.indexOf("--dist");
const DIST = distArg !== -1 ? args[distArg + 1] : resolve(ROOT, "dist");

// ── Load canonical route manifest ────────────────────────────────────────────
const routesPath = resolve(ROOT, "extraction/required-routes.json");
if (!existsSync(routesPath)) {
  console.error(`❌ Required route manifest not found at ${routesPath}.`);
  process.exit(1);
}

const routes = JSON.parse(readFileSync(routesPath, "utf-8"));
if (
  !Array.isArray(routes) ||
  routes.some((route) => typeof route !== "string")
) {
  console.error("❌ Route manifest must be a JSON array of path strings.");
  process.exit(1);
}

// ── Check dist ───────────────────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.error(
    `❌ dist/ directory not found at ${DIST}. Run \`npm run build\` first.`,
  );
  process.exit(1);
}

const missing = [];
const ok = [];

for (const route of [...new Set(routes)]) {
  // Astro static output: /foo/bar/ → dist/foo/bar/index.html
  const htmlPath = resolve(DIST, route.replace(/^\//, ""), "index.html");
  if (existsSync(htmlPath)) {
    ok.push(route);
  } else {
    missing.push(route);
  }
}

console.log(`\n✅ ${ok.length}/${routes.length} IA routes found in dist/`);

if (missing.length > 0) {
  console.error(`\n❌ ${missing.length} IA routes missing from dist/:\n`);
  for (const r of missing) console.error(`   ${r}`);
  process.exit(1);
}
