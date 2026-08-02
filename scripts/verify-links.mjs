import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const unavailable = new Set([
  "http://shorturl.at/kryEH",
  "https://revistadefilosofia.org/28-01.pdf%20ISSN%202341-2910",
  "https://forms.gle/LcoP8o87wVde8rdTA",
  "https://docs.google.com/forms/d/100XHJAE1KmGU1O8Jo5eHncv_fTuAWN-58IFRZME7iUg/edit",
  "https://docs.google.com/forms/d/e/1FAIpQLSfQVN1zsNYSXRKlW5jfY7acjWlUadX-lYJG36NAoXR9KnMqCw/viewform",
]);
if (!existsSync(dist)) {
  console.error("❌ dist/ is missing. Run npm run build before test:links.");
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routeExists(pathname) {
  if (pathname === "/api/forms")
    return existsSync(resolve(root, "api/forms.js"));
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  return (
    existsSync(resolve(dist, decoded)) ||
    existsSync(resolve(dist, decoded, "index.html")) ||
    existsSync(resolve(dist, `${decoded.replace(/\/$/, "")}.html`))
  );
}

const failures = [];
const references = new Set();
for (const htmlPath of walk(dist).filter((path) => extname(path) === ".html")) {
  const html = readFileSync(htmlPath, "utf8");
  const attributePattern = /\b(?:href|src|action)\s*=\s*["']([^"']+)["']/gi;
  for (const [, value] of html.matchAll(attributePattern))
    references.add(value);
}

for (const value of references) {
  if (unavailable.has(value))
    failures.push(`known unavailable external link: ${value}`);
  if (/^https?:\/\/(?:www\.)?psicologos\.org\.ar\/wp-content\//i.test(value))
    failures.push(`legacy-hosted file dependency: ${value}`);
  if (/^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(value)) continue;
  const pathname = new URL(value, "https://local.invalid").pathname;
  if (!routeExists(pathname))
    failures.push(`missing internal target: ${value}`);
}

if (failures.length) {
  console.error(
    `❌ Link integrity failed (${failures.length}):\n${failures.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `✅ ${references.size} unique links and public asset references resolve.`,
);
