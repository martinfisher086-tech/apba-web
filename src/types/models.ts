/**
 * APBA — psicologos.org.ar
 * Canonical data models — derived from Phase 1 §2 schema specification.
 * These are TypeScript interfaces that Sanity schemas / Zod validators will implement.
 * No business logic here — pure type definitions.
 */

// ─── Shared ─────────────────────────────────────────────────────────────────

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: ImageAsset;
  canonical?: string;
  noindex: boolean;
  structuredDataType?: string;
}

export interface ImageAsset {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  lqip?: string; // Low-quality image placeholder (blur data URL)
}

export interface FileAsset {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
}

// ─── Organization (singleton) ────────────────────────────────────────────────

export interface Organization {
  legalName: string;             // "Asociación de Psicólogas y Psicólogos de Buenos Aires"
  shortName: string;             // "APBA"
  email: string;
  addresses: Address[];
  social: { facebook?: string; instagram?: string };
  logo: ImageAsset;
  mission?: string;              // richText as HTML string
}

export interface Address {
  street?: string;
  city: string;
  postalCode?: string;
  geo?: { lat: number; lng: number };
}

// ─── Page (static editorial) ─────────────────────────────────────────────────

export interface Page {
  slug: string;
  title: string;
  body: string;                  // sanitized HTML
  parent?: string;               // parent page slug
  menuOrder: number;
  status: "published" | "draft";
  legacyUrls: string[];
  seo: SeoMeta;
}

// ─── NewsArticle (Novedad) ───────────────────────────────────────────────────

export interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;               // plain text, ≤200 chars
  body: string;                  // sanitized HTML
  heroImage?: ImageAsset;
  category: string;              // slug
  tags: string[];                // slugs
  author: string;                // display name only
  publishDate: string;           // ISO 8601
  modifiedDate?: string;
  status: "published" | "draft" | "private";
  legacyUrls: string[];
  seo: SeoMeta;
}

// ─── JournalIssue (Gaceta Psicológica) ──────────────────────────────────────

export interface JournalIssue {
  slug: string;                  // e.g. "numero-6"
  number: number;
  title: string;                 // theme title e.g. "Consumos problemáticos"
  subtitle?: string;
  coverImage?: ImageAsset;
  pdfFile: FileAsset;
  publishDate?: string;
  articles?: JournalArticle[];
  description?: string;          // richText
  seo: SeoMeta;
}

export interface JournalArticle {
  title: string;
  authors: string[];
}

// ─── Course ─────────────────────────────────────────────────────────────────

export type CourseModality = "presencial" | "virtual" | "hibrido";
export type CourseStatus = "upcoming" | "ongoing" | "past";

export interface Course {
  slug: string;
  title: string;
  description: string;           // richText
  modality: CourseModality;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  instructors: string[];
  isFree: boolean;
  price?: string;
  registrationUrl?: string;
  status: CourseStatus;
  credits?: string;
  seo: SeoMeta;
}

// ─── CertificationProgram ────────────────────────────────────────────────────

export type ConvocatoriaStatus = "open" | "closed" | "upcoming";

export interface Convocatoria {
  name: string;
  inscriptionStart?: string;
  inscriptionEnd?: string;
  status: ConvocatoriaStatus;
}

export interface CertificationProgram {
  slug: string;
  title: string;
  description: string;           // richText
  requirements: string[];        // verbatim list
  convocatorias: Convocatoria[];
  documents: FileAsset[];
  fees?: string;
  seo: SeoMeta;
}

// ─── Event ──────────────────────────────────────────────────────────────────

export type EventAttendanceMode = "offline" | "online" | "mixed";

export interface Event {
  slug: string;
  title: string;
  startDateTime: string;         // ISO 8601
  endDateTime?: string;
  location: string;              // address string or "online"
  attendanceMode: EventAttendanceMode;
  description: string;           // richText
  type: "curso" | "jornada" | "congreso" | "institucional" | "otro";
  registrationUrl?: string;
  relatedCourseSlug?: string;
  seo: SeoMeta;
}

// ─── Benefit ────────────────────────────────────────────────────────────────

export interface Benefit {
  slug: string;
  title: string;
  description: string;           // richText
  category: string;
  provider?: string;
  howToRedeem: string;           // richText
  memberOnly: boolean;
}

// ─── Regulation (Normativa) ──────────────────────────────────────────────────

export interface Regulation {
  slug: string;
  title: string;
  category: string;
  body?: string;                 // richText — verbatim
  document?: FileAsset;
  effectiveDate?: string;
  seo: SeoMeta;
}

// ─── AssistanceService ───────────────────────────────────────────────────────

export interface AssistanceService {
  slug: string;
  title: string;
  description: string;           // richText
  audience: string;
  howToAccess: string;           // richText
  contact: { email?: string; phone?: string; hours?: string };
  referralInfo?: string;         // richText
}

// ─── MembershipInfo (singleton) ─────────────────────────────────────────────

export interface MembershipInfo {
  whoCanJoin: string;            // richText
  requirements: string[];
  benefitsSummary: string;       // richText
  fees: string;
  process: string;               // richText
  formId?: string;               // links to a form definition
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export type NavItemType = "link" | "dropdown";

export interface NavItem {
  label: string;
  type: NavItemType;
  url?: string;
  children?: NavItem[];
}

// ─── Redirect ───────────────────────────────────────────────────────────────

export interface Redirect {
  from: string;   // legacy path e.g. "/asistencia-2/"
  to: string;     // new path e.g. "/asistencia/"
  status: 301 | 302;
}
