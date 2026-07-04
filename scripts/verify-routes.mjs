/**
 * Verifies that every route declared in extraction/ia-tree.json has a
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

// ── Load IA tree ─────────────────────────────────────────────────────────────
const iaPath = resolve(ROOT, "../extraction/ia-tree.json");
if (!existsSync(iaPath)) {
  console.warn(`⚠  ia-tree.json not found at ${iaPath} — skipping verification`);
  process.exit(0);
}

const iaTree = JSON.parse(readFileSync(iaPath, "utf-8"));

// Collect all href values recursively
function collectHrefs(nodes, acc = []) {
  for (const node of nodes ?? []) {
    if (node.href && !node.href.startsWith("http") && !node.href.startsWith("mailto")) {
      acc.push(node.href);
    }
    if (node.children) collectHrefs(node.children, acc);
  }
  return acc;
}

const routes = [...new Set(collectHrefs(iaTree))];

// ── Check dist ───────────────────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.error(`❌ dist/ directory not found at ${DIST}. Run \`npm run build\` first.`);
  process.exit(1);
}

const missing = [];
const ok = [];

for (const route of routes) {
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
