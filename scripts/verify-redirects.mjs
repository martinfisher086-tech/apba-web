/**
 * Verifies that all redirect-candidates from extraction/redirect-candidates.csv
 * are declared in the hosting platform redirect config (_redirects for Netlify
 * or vercel.json for Vercel). Run in CI after build.
 *
 * Usage: node scripts/verify-redirects.mjs [--config path/to/_redirects]
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load extraction redirect candidates ────────────────────────────────────
const csvPath = resolve(ROOT, "../extraction/redirect-candidates.csv");
if (!existsSync(csvPath)) {
  console.warn(`⚠  redirect-candidates.csv not found at ${csvPath} — skipping verification`);
  process.exit(0);
}

const csvLines = readFileSync(csvPath, "utf-8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("from"));

const candidates = csvLines.map((line) => {
  const [from, to, statusStr] = line.split(",").map((s) => s.trim());
  return { from, to, status: parseInt(statusStr ?? "301", 10) };
});

// ── Load declared redirects ─────────────────────────────────────────────────
const netlifyRedirects = resolve(ROOT, "public/_redirects");
const vercelConfig = resolve(ROOT, "vercel.json");

let declared = new Set();

if (existsSync(netlifyRedirects)) {
  const lines = readFileSync(netlifyRedirects, "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"));
  for (const line of lines) {
    const [from] = line.split(/\s+/);
    if (from) declared.add(from);
  }
  console.log(`📄 Loaded ${declared.size} redirects from public/_redirects`);
} else if (existsSync(vercelConfig)) {
  const config = JSON.parse(readFileSync(vercelConfig, "utf-8"));
  for (const r of config.redirects ?? []) {
    declared.add(r.source);
  }
  console.log(`📄 Loaded ${declared.size} redirects from vercel.json`);
} else {
  console.warn("⚠  No redirect config found (public/_redirects or vercel.json). Skipping.");
  process.exit(0);
}

// ── Diff ────────────────────────────────────────────────────────────────────
const missing = candidates.filter((c) => !declared.has(c.from));
const extra = [...declared].filter((d) => !candidates.find((c) => c.from === d));

if (missing.length === 0) {
  console.log(`✅ All ${candidates.length} redirect candidates are declared.`);
} else {
  console.error(`\n❌ ${missing.length} redirect(s) from extraction are NOT declared:\n`);
  for (const { from, to, status } of missing) {
    console.error(`   ${from}  →  ${to}  [${status}]`);
  }
}

if (extra.length > 0) {
  console.warn(`\n⚠  ${extra.length} declared redirect(s) have no extraction candidate (may be intentional):`);
  for (const d of extra) console.warn(`   ${d}`);
}

process.exit(missing.length > 0 ? 1 : 0);
