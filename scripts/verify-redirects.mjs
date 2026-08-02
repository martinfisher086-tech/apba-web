import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "vercel.json");
const newsPath = resolve(root, "extraction/news-clean.json");

if (!existsSync(configPath)) {
  console.error(
    "❌ vercel.json is required; redirect verification cannot be skipped.",
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const news = JSON.parse(readFileSync(newsPath, "utf8")).items;
const requiredAliases = {
  "/agenda-2/": "/agenda/",
  "/informacion-util-2/": "/informacion-util/",
  "/asistencia-2/": "/asistencia/",
  "/que-es-apba/": "/institucional/que-es-apba/",
  "/representacion-gremial/": "/institucional/representacion-gremial/",
  "/docencia-e-investigacion/": "/institucional/docencia-e-investigacion/",
  "/publicaciones/": "/institucional/publicaciones/",
  "/departamentos/": "/institucional/departamentos/",
  "/comision-directiva/": "/institucional/comision-directiva/",
  "/gaceta-psicologica/": "/revistas/",
  "/noticias/": "/novedades/",
  "/cursos-gratuitos/": "/cursos/",
  "/apba/": "/institucional/",
  "/asesoramiento-juridico/": "/contacto/",
  "/pacientes/": "/contacto/",
  "/seguro-mala-praxis/": "/contacto/",
  "/convenios/": "/beneficios/",
};

const required = new Map(Object.entries(requiredAliases));
for (const item of news) {
  const source = new URL(item.legacyUrl, "https://psicologos.org.ar").pathname;
  required.set(source, item.newUrl);
}

const declared = new Map(
  (config.redirects ?? []).map((redirect) => [
    redirect.source,
    { destination: redirect.destination, permanent: redirect.permanent },
  ]),
);
const failures = [];
for (const [source, destination] of required) {
  const redirect = declared.get(source);
  if (!redirect) failures.push(`${source} is missing`);
  else if (redirect.destination !== destination)
    failures.push(
      `${source} points to ${redirect.destination}, expected ${destination}`,
    );
  else if (redirect.permanent !== true)
    failures.push(`${source} must be permanent (301)`);
}

if (failures.length) {
  console.error(
    `❌ Redirect coverage failed (${failures.length}):\n${failures.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `✅ ${required.size} historical redirects are declared as permanent.`,
);
