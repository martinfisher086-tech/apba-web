/**
 * CMS data layer — reads from extraction JSON during static build.
 * Replace with Sanity/Strapi API calls after CP-6.
 *
 * Import pattern:
 *   import { getNewsArticles, getNewsArticleBySlug } from "@lib/cms";
 *
 * All functions return typed data per src/types/models.ts.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
} from "@types/models";

// ─── PLACEHOLDER HELPERS ─────────────────────────────────────────────────────

const PLACEHOLDER_IMAGE = {
  url: "/images/placeholder-1200x630.webp",
  alt: "",
  width: 1200,
  height: 630,
};

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

// Load at build time — path is relative to this file (src/lib/ → ../../ = project root)
const __libDir = dirname(fileURLToPath(import.meta.url));
const _rawNews: _RawNewsFeed = JSON.parse(
  readFileSync(resolve(__libDir, "../../extraction/news-clean.json"), "utf-8")
) as _RawNewsFeed;

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

const _rawPages: _RawPagesFeed = JSON.parse(
  readFileSync(resolve(__libDir, "../../extraction/pages-clean.json"), "utf-8")
) as _RawPagesFeed;

function _mapPage(item: _RawPage): Page {
  return {
    slug: item.slug,
    title: item.title,
    body: item.body,
    parent: item.parent ?? undefined,
    menuOrder: item.menuOrder,
    status: item.status as "published" | "draft",
    legacyUrls: [item.legacyUrl],
    seo: {
      title: `${item.title} — APBA`,
      description: "",
      noindex: false,
    },
  };
}

function _mapNewsItem(item: _RawNewsItem): NewsArticle {
  const raw = item.heroImage;
  let heroImage: ImageAsset | undefined;
  if (raw.status === "downloaded" && raw.url) {
    heroImage = { url: raw.url, alt: raw.alt ?? "" };
  }
  // pending_download → leave heroImage undefined so components render their own branded placeholder

  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    body: item.body,
    heroImage,
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
}

// ─── ORGANIZATION ────────────────────────────────────────────────────────────

export async function getOrganization(): Promise<Organization> {
  // TODO: replace with CMS query
  return {
    legalName: "Asociación de Psicólogas y Psicólogos de Buenos Aires",
    shortName: "APBA",
    email: "apba@psicologos.org.ar",
    addresses: [{ city: "Buenos Aires", postalCode: undefined }],
    social: {
      facebook: "https://www.facebook.com/APBAarg/",
      instagram: "https://www.instagram.com/apbaarg/",
    },
    logo: {
      url: "/images/apba-logo.svg",
      alt: "APBA — Asociación de Psicólogas y Psicólogos de Buenos Aires",
    },
    mission: undefined,
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
  slug: string
): Promise<NewsArticle | null> {
  const all = await getNewsArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function getNewsArticleSlugs(): Promise<string[]> {
  const all = await getNewsArticles();
  return all.map((a) => a.slug);
}

// ─── JOURNAL ─────────────────────────────────────────────────────────────────

const _WP_UPLOADS =
  "https://psicologos.org.ar/wp-content/uploads";

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
  slug: string
): Promise<JournalIssue | null> {
  const all = await getJournalIssues();
  return all.find((j) => j.slug === slug) ?? null;
}

export async function getJournalIssueByNumber(
  number: number
): Promise<JournalIssue | null> {
  const all = await getJournalIssues();
  return all.find((j) => j.number === number) ?? null;
}

export async function getJournalIssueSlugs(): Promise<string[]> {
  const all = await getJournalIssues();
  return all.map((j) => j.slug);
}

// ─── COURSES ─────────────────────────────────────────────────────────────────

export async function getCourses(): Promise<Course[]> {
  return []; // TODO: CMS query
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const all = await getCourses();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCourseSlugs(): Promise<string[]> {
  return []; // TODO
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
