/**
 * CMS data layer — reads from extraction JSON during static build.
 * Replace with Sanity/Strapi API calls after CP-6.
 *
 * Import pattern:
 *   import { getNewsArticles, getNewsArticleBySlug } from "@lib/cms";
 *
 * All functions return typed data per src/types/models.ts.
 */

import rawNewsData from "../../extraction/news-clean.json";
import rawPagesData from "../../extraction/pages-clean.json";
import type {
  NewsArticle,
  ImageAsset,
  JournalIssue,
  Course,
  CertificationProgram,
  Event,
  Benefit,
  Regulation,
  Page,
  Organization,
  MembershipInfo,
} from "@models/models";

// ─── PLACEHOLDER HELPERS ─────────────────────────────────────────────────────

// ─── RAW JSON TYPES (news-clean.json) ────────────────────────────────────────

interface _RawHeroImage {
  featuredMediaId: number | null;
  status: "downloaded" | "pending_download" | "none";
  url?: string;
  alt?: string;
}

interface _RawNewsItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  heroImage: _RawHeroImage;
  categories: string[];
  tags: string[];
  publishDate: string;
  modifiedDate: string;
  status: string;
  legacyUrl: string;
  newUrl: string;
}

interface _RawNewsFeed {
  items: _RawNewsItem[];
}

const _rawNews = rawNewsData as _RawNewsFeed;

// ─── RAW JSON TYPES (pages-clean.json) ──────────────────────────────────────

interface _RawPage {
  id: number;
  slug: string;
  title: string;
  body: string;
  parent: string | null;
  menuOrder: number;
  status: string;
  legacyUrl: string;
  needsManualReview?: boolean;
}

interface _RawPagesFeed {
  items: _RawPage[];
}

const _rawPages = rawPagesData as unknown as _RawPagesFeed;

const _unavailableExternalLinks = [
  "http://shorturl.at/kryEH",
  "https://revistadefilosofia.org/28-01.pdf?fbclid=IwAR0nUDmaSIQsJuK8L7Sqw5o4lxZsY7uzPmDv3g0T16kVpjdCKC9xqDuUgzQ",
  "https://forms.gle/LcoP8o87wVde8rdTA",
  "https://docs.google.com/forms/d/100XEMObW6ARPh5xm12GOhHFpwhmp7qdw5TXhf2NBjcA/edit?usp=sharing",
  "https://docs.google.com/forms/d/e/1FAIpQLScjJGp_OVwbfJ3EAvCPBPMajpVSLVnt7oywLNb1ur3O74QDyA/viewform?usp=publish-editor",
];

function _escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _prepareImportedHtml(html: string): string {
  let prepared = html.replaceAll(
    /https?:\/\/psicologos\.org\.ar\/wp-content\/uploads/gi,
    "/wp-content/uploads",
  );

  for (const url of _unavailableExternalLinks) {
    const linkPattern = new RegExp(
      `<a\\b[^>]*href=["']${_escapeRegExp(url)}["'][^>]*>(.*?)<\\/a>`,
      "gis",
    );
    prepared = prepared.replace(
      linkPattern,
      '$1 <a href="mailto:martinfisher086@gmail.com">(consultar disponibilidad)</a>',
    );
  }

  return prepared;
}

function _mapPage(item: _RawPage): Page {
  let body = _prepareImportedHtml(
    item.body.replace(
      "<p>Secretaria de Prensa: <strong>Paula Giménez</strong></p>",
      "",
    ),
  );

  if (item.slug === "normativa") {
    body = body.replaceAll(
      "/wp-content/uploads/2019/12/",
      "/documents/normativa/",
    );
  }

  const page: Page = {
    slug: item.slug,
    title: item.title,
    body,
    menuOrder: item.menuOrder,
    status: item.status as "published" | "draft",
    legacyUrls: [item.legacyUrl],
    seo: {
      title: `${item.title} — APBA`,
      description: "",
      noindex: false,
    },
  };
  if (item.parent) page.parent = item.parent;
  return page;
}

function _mapNewsItem(item: _RawNewsItem): NewsArticle {
  const raw = item.heroImage;
  let heroImage: ImageAsset | undefined;
  if (raw.status === "downloaded" && raw.url) {
    heroImage = { url: raw.url, alt: raw.alt ?? "" };
  }
  // pending_download → leave heroImage undefined so components render their own branded placeholder

  const article: NewsArticle = {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    body: _prepareImportedHtml(item.body),
    category: item.categories[0] ?? "novedades",
    tags: item.tags,
    author: "APBA",
    publishDate: item.publishDate,
    modifiedDate: item.modifiedDate,
    status: item.status as "published" | "draft" | "private",
    legacyUrls: [item.legacyUrl],
    seo: {
      title: `${item.title} — APBA`,
      description: item.excerpt.slice(0, 155),
      noindex: false,
    },
  };
  if (heroImage) article.heroImage = heroImage;
  return article;
}

// ─── ORGANIZATION ────────────────────────────────────────────────────────────

export async function getOrganization(): Promise<Organization> {
  // TODO: replace with CMS query
  return {
    legalName: "Asociación de Psicólogas y Psicólogos de Buenos Aires",
    shortName: "APBA",
    email: "apba@psicologos.org.ar",
    addresses: [{ city: "Buenos Aires" }],
    social: {
      facebook: "https://www.facebook.com/APBAarg/",
      instagram: "https://www.instagram.com/apbaarg/",
    },
    logo: {
      url: "/images/apba-logo.svg",
      alt: "APBA — Asociación de Psicólogas y Psicólogos de Buenos Aires",
    },
  };
}

// ─── NEWS ────────────────────────────────────────────────────────────────────

export async function getNewsArticles(options?: {
  limit?: number;
  category?: string;
}): Promise<NewsArticle[]> {
  let items = _rawNews.items.filter((i) => i.status === "published");

  const cat = options?.category;
  if (cat) {
    items = items.filter((i) => i.categories.includes(cat));
  }

  if (options?.limit) {
    items = items.slice(0, options.limit);
  }

  return items.map(_mapNewsItem);
}

export async function getNewsArticleBySlug(
  slug: string,
): Promise<NewsArticle | null> {
  const all = await getNewsArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function getNewsArticleSlugs(): Promise<string[]> {
  const all = await getNewsArticles();
  return all.map((a) => a.slug);
}

// ─── JOURNAL ─────────────────────────────────────────────────────────────────

const _WP_UPLOADS = "/wp-content/uploads";

const _journalData: JournalIssue[] = [
  {
    slug: "numero-6",
    number: 6,
    title: "Consumos problemáticos",
    publishDate: "2024-08-01",
    coverImage: {
      url: "/images/gaceta/cover-6.jpg",
      alt: "Portada Gaceta Psicológica N° 6 — Consumos problemáticos",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2024/08/Gaceta_Psicologica_06_FINAL.pdf`,
      filename: "Gaceta_Psicologica_06_FINAL.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title: "Gaceta Psicológica N° 6 — Consumos problemáticos — APBA",
      description:
        "Descargá el N° 6 de la Gaceta Psicológica de APBA: Consumos problemáticos. Agosto 2024.",
      noindex: false,
    },
  },
  {
    slug: "numero-5",
    number: 5,
    title: "Educación y subjetividad",
    subtitle:
      "Aprendizajes y conflictos epocales: tensiones, malestares y desafíos",
    publishDate: "2024-01-01",
    coverImage: {
      url: "/images/gaceta/cover-5.jpg",
      alt: "Portada Gaceta Psicológica N° 5 — Educación y subjetividad",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2024/01/Gaceta_Psicologica_05_FINAL.pdf`,
      filename: "Gaceta_Psicologica_05_FINAL.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title: "Gaceta Psicológica N° 5 — Educación y subjetividad — APBA",
      description:
        "Descargá el N° 5 de la Gaceta Psicológica de APBA: Educación y subjetividad.",
      noindex: false,
    },
  },
  {
    slug: "numero-4",
    number: 4,
    title: "Psicoanálisis y política",
    publishDate: "2023-08-01",
    coverImage: {
      url: "/images/gaceta/cover-4.jpg",
      alt: "Portada Gaceta Psicológica N° 4 — Psicoanálisis y política",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2023/08/Gaceta_Psicologica_04_FINAL_AGOSTO.pdf`,
      filename: "Gaceta_Psicologica_04_FINAL_AGOSTO.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title: "Gaceta Psicológica N° 4 — Psicoanálisis y política — APBA",
      description:
        "Descargá el N° 4 de la Gaceta Psicológica de APBA: Psicoanálisis y política. Agosto 2023.",
      noindex: false,
    },
  },
  {
    slug: "numero-3",
    number: 3,
    title: "Salud Mental y Trabajo",
    publishDate: "2023-02-01",
    coverImage: {
      url: "/images/gaceta/cover-3.jpg",
      alt: "Portada Gaceta Psicológica N° 3 — Salud Mental y Trabajo",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2023/05/Gaceta_Psicologica_03_FEB_2023.pdf`,
      filename: "Gaceta_Psicologica_03_FEB_2023.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title: "Gaceta Psicológica N° 3 — Salud Mental y Trabajo — APBA",
      description:
        "Descargá el N° 3 de la Gaceta Psicológica de APBA: Salud Mental y Trabajo.",
      noindex: false,
    },
  },
  {
    slug: "numero-2",
    number: 2,
    title: "Articulaciones y tensiones en tiempos inciertos",
    publishDate: "2022-04-01",
    coverImage: {
      url: "/images/gaceta/cover-2.jpg",
      alt: "Portada Gaceta Psicológica N° 2 — Articulaciones y tensiones en tiempos inciertos",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2022/04/Gaceta_psicologica_02_22-03-1-1.pdf`,
      filename: "Gaceta_psicologica_02_22-03-1-1.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title:
        "Gaceta Psicológica N° 2 — Articulaciones y tensiones en tiempos inciertos — APBA",
      description:
        "Descargá el N° 2 de la Gaceta Psicológica de APBA: Articulaciones y tensiones en tiempos inciertos.",
      noindex: false,
    },
  },
  {
    slug: "numero-1",
    number: 1,
    title: "Infancias",
    publishDate: "2021-12-01",
    coverImage: {
      url: "/images/gaceta/cover-1.jpg",
      alt: "Portada Gaceta Psicológica N° 1 — Infancias",
      width: 800,
    },
    pdfFile: {
      url: `${_WP_UPLOADS}/2021/12/Gaceta_psicologica-ultima.pdf`,
      filename: "Gaceta_psicologica-ultima.pdf",
      mimeType: "application/pdf",
    },
    articles: [],
    seo: {
      title: "Gaceta Psicológica N° 1 — Infancias — APBA",
      description:
        "Descargá el N° 1 de la Gaceta Psicológica de APBA: Infancias. Diciembre 2021.",
      noindex: false,
    },
  },
];

export async function getJournalIssues(): Promise<JournalIssue[]> {
  return _journalData;
}

export async function getJournalIssueBySlug(
  slug: string,
): Promise<JournalIssue | null> {
  const all = await getJournalIssues();
  return all.find((j) => j.slug === slug) ?? null;
}

export async function getJournalIssueByNumber(
  number: number,
): Promise<JournalIssue | null> {
  const all = await getJournalIssues();
  return all.find((j) => j.number === number) ?? null;
}

export async function getJournalIssueSlugs(): Promise<string[]> {
  const all = await getJournalIssues();
  return all.map((j) => j.slug);
}

// ─── COURSES ─────────────────────────────────────────────────────────────────

/**
 * Editorial course listing. Ordered for display: open enrolment first, then
 * courses already running, then finished editions.
 * Source: flyers + course briefs supplied by APBA (agosto 2026).
 */
const _courseData: Course[] = [
  {
    slug: "preparacion-examen-residencias-2027",
    title: "Curso de Preparación para Examen de Residencias 2027",
    description:
      "Preparación para el examen de residencias 2027 a cargo de docentes que transitaron la residencia. Ocho meses de cursada virtual, de octubre a abril.",
    body: [
      `<p>Desde APBA lanzamos nuestro <strong>Curso de Preparación para el Examen de Residencias 2027</strong>.</p>`,
      `<p>Sabemos lo que implica este recorrido, porque ya lo transitamos. Somos un equipo de docentes que realizamos la residencia y pasamos por este examen, por eso te ofrecemos una propuesta pensada desde nuestra propia experiencia, para que la preparación sea más amena y en compañía.</p>`,
      `<p>También convocamos docentes que integran la bibliografía para que puedan transmitir sus propios textos y ustedes tengan un acercamiento desde la palabra del autor/a.</p>`,
      `<h2>¿Cómo es la cursada?</h2>`,
      `<ul><li><strong>Duración:</strong> 8 meses, de octubre a abril, con posibilidad de sumar un mes de repaso intensivo conforme al cronograma oficial que se publicará más adelante.</li><li><strong>Modalidad:</strong> virtual, los días martes de 18 a 22 hs.</li></ul>`,
      `<h2>¿Qué trabajamos?</h2>`,
      `<ul><li>Choices de práctica.</li><li>Lectura de los textos acompañada por docentes.</li><li>Repaso de preguntas de años anteriores.</li><li>Trabajo con exámenes previos.</li><li>Acompañamiento del recorrido con tutorías individuales si fueran necesarias.</li><li>Trabajo grupal sobre las dudas y dificultades que surjan.</li></ul>`,
      `<p>Ofrecemos aranceles accesibles porque entendemos el momento que atraviesan y pensamos en facilitar un ingreso más democrático y con menores barreras de costos y tiempos.</p>`,
    ].join("\n\n"),
    image: {
      url: "/images/cursos/curso-preparacion-residencias-2027-1200.jpg",
      alt: "Curso de preparación de examen de residencias 2027 — APBA",
      width: 1200,
      height: 671,
    },
    modality: "virtual",
    schedule: "Martes de 18 a 22 hs.",
    duration: "8 meses, de octubre a abril",
    instructors: [],
    isFree: false,
    price: "Aranceles accesibles — consultar",
    registrationUrl: "mailto:cursosapba@gmail.com",
    status: "upcoming",
    seo: {
      title: "Curso de Preparación para Examen de Residencias 2027 — APBA",
      description:
        "Curso virtual de APBA para preparar el examen de residencias 2027. Ocho meses de cursada, martes de 18 a 22 hs. Informes e inscripción: cursosapba@gmail.com.",
      noindex: false,
    },
  },
  {
    slug: "practica-salud-mental-sistema-penal",
    title: "La Práctica en Salud Mental y el Sistema Penal hoy",
    description:
      "Curso a distancia de APBA sobre la práctica en salud mental y su articulación con el sistema penal en la actualidad.",
    image: {
      url: "/images/cursos/curso-salud-mental-sistema-penal-1200.jpg",
      alt: "Curso: La Práctica en Salud Mental y el Sistema Penal hoy — APBA",
      width: 1200,
      height: 675,
    },
    modality: "virtual",
    startDate: "2026-08-25",
    schedule: "Martes 18 hs.",
    duration: "6 clases",
    instructors: [
      "Pablo Catalán",
      "Julieta Porcel",
      "Rosario Gauna Alsina",
      "Mariano Poblet Machado",
      "Gabriela Tozoroni",
      "Facundo Labriola",
      "Simón Cluigt",
      "Docentes invitadxs",
    ],
    isFree: false,
    price: "Aranceles institucionales — consultá por nuestros descuentos",
    registrationUrl: "mailto:cursosapba@gmail.com",
    status: "ongoing",
    seo: {
      title: "La Práctica en Salud Mental y el Sistema Penal hoy — Cursos APBA",
      description:
        "Curso a distancia de APBA sobre la práctica en salud mental y el sistema penal. Martes 18 hs., 6 clases. Informes: cursosapba@gmail.com.",
      noindex: false,
    },
  },
  {
    slug: "subjetividad-y-comunidad",
    title: "Subjetividad y Comunidad",
    subtitle: "Desafíos actuales de su interrelación",
    description:
      "Curso a distancia de APBA sobre subjetividad y comunidad: los desafíos actuales de su interrelación.",
    image: {
      url: "/images/cursos/curso-subjetividad-y-comunidad-1200.jpg",
      alt: "Curso: Subjetividad y Comunidad. Desafíos actuales de su interrelación — APBA",
      width: 1200,
      height: 675,
    },
    modality: "virtual",
    startDate: "2026-08-29",
    schedule: "Sábados de 9.30 a 12 hs.",
    duration: "4 encuentros",
    instructors: [
      "Eduardo Tissera",
      "Claudia Bonzo",
      "Sol Schneer",
      "Ana Espada",
      "Lucrecia Petit",
      "Docentes invitados",
    ],
    isFree: false,
    price: "Aranceles institucionales — consultá por nuestros descuentos",
    registrationUrl: "mailto:cursosapba@gmail.com",
    status: "ongoing",
    seo: {
      title: "Subjetividad y Comunidad — Cursos APBA",
      description:
        "Curso a distancia de APBA: Subjetividad y Comunidad, desafíos actuales de su interrelación. Sábados de 9.30 a 12 hs., 4 encuentros.",
      noindex: false,
    },
  },
  {
    slug: "ia-y-psicologia",
    title: "IA y Psicología",
    subtitle:
      "Nuevas herramientas para pensar, investigar y acompañar en la práctica profesional",
    description:
      "Curso a distancia de APBA sobre inteligencia artificial y psicología: nuevas herramientas para pensar, investigar y acompañar en la práctica profesional.",
    image: {
      url: "/images/cursos/curso-ia-y-psicologia-1200.jpg",
      alt: "Curso: IA y Psicología, nuevas herramientas para la práctica profesional — APBA",
      width: 1200,
      height: 675,
    },
    modality: "virtual",
    startDate: "2026-08-11",
    endDate: "2026-08-18",
    schedule: "11, 13 y 18 de agosto, 19 hs.",
    instructors: ["Johanna Goldwaser", "Juan Pablo Ocampo"],
    isFree: false,
    price: "Aranceles institucionales — consultá por nuestros descuentos",
    registrationUrl: "mailto:cursosapba@gmail.com",
    status: "past",
    seo: {
      title: "IA y Psicología — Cursos APBA",
      description:
        "Curso a distancia de APBA sobre IA y psicología: nuevas herramientas para pensar, investigar y acompañar en la práctica profesional.",
      noindex: false,
    },
  },
];

export async function getCourses(): Promise<Course[]> {
  return _courseData;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const all = await getCourses();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCourseSlugs(): Promise<string[]> {
  const all = await getCourses();
  return all.map((c) => c.slug);
}

// ─── CERTIFICATION ───────────────────────────────────────────────────────────

export async function getCertificationProgram(): Promise<CertificationProgram | null> {
  return null; // TODO: CMS singleton query
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export async function getEvents(_options?: {
  upcoming?: boolean;
}): Promise<Event[]> {
  return []; // TODO: CMS query
}

export async function getEventBySlug(_slug: string): Promise<Event | null> {
  return null; // TODO
}

export async function getEventSlugs(): Promise<string[]> {
  return []; // TODO
}

// ─── BENEFITS ────────────────────────────────────────────────────────────────

export async function getBenefits(): Promise<Benefit[]> {
  return []; // TODO: CMS query
}

// ─── REGULATIONS ─────────────────────────────────────────────────────────────

export async function getRegulations(): Promise<Regulation[]> {
  return []; // TODO: CMS query
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const item = _rawPages.items.find((p) => p.slug === slug);
  if (!item || item.needsManualReview || !item.body) return null;
  return _mapPage(item);
}

// ─── MEMBERSHIP ──────────────────────────────────────────────────────────────

export async function getMembershipInfo(): Promise<MembershipInfo | null> {
  return null; // TODO: CMS singleton query
}
