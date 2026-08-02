# APBA Web — Architecture & Conventions

**Site:** psicologos.org.ar  
**Project:** APBA (Asociación de Psicólogas y Psicólogos de Buenos Aires) website rebuild  
**Stack:** Astro 4 · TypeScript · Headless CMS (Sanity, TBD at CP-6) · Edge hosting

---

## 1. Repository structure

```
apba-web/
├── public/                   # Static assets served verbatim
│   ├── fonts/                # Self-hosted Inter Variable + Fraunces subsets
│   ├── icons/                # SVG sprite + PWA icons
│   ├── robots.txt
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── atoms/            # Smallest reusable units (no business logic)
│   │   │   ├── Avatar.astro
│   │   │   ├── Badge.astro
│   │   │   ├── Button.astro
│   │   │   ├── Icon.astro
│   │   │   ├── Spinner.astro
│   │   │   └── Tag.astro
│   │   ├── molecules/        # Composed atoms (card, form field, nav item…)
│   │   │   ├── AccordionItem.astro
│   │   │   ├── Alert.astro
│   │   │   ├── Breadcrumb.astro
│   │   │   ├── CourseCard.astro
│   │   │   ├── DownloadButton.astro
│   │   │   ├── EventCard.astro
│   │   │   ├── FormField.astro
│   │   │   ├── JournalIssueCard.astro
│   │   │   ├── NewsCard.astro
│   │   │   ├── Pagination.astro
│   │   │   ├── SearchBar.astro
│   │   │   └── SocialLinks.astro
│   │   └── organisms/        # Full sections (header, footer, hero, grids)
│   │       ├── Header.astro
│   │       └── Footer.astro
│   ├── layouts/
│   │   └── BaseLayout.astro  # HTML shell: lang, meta, fonts, skip link
│   ├── lib/
│   │   └── cms.ts            # All CMS data-fetching functions (typed stubs)
│   ├── pages/                # File-based routing (Astro)
│   │   ├── index.astro
│   │   ├── asociate.astro
│   │   ├── asistencia.astro
│   │   ├── buscar.astro
│   │   ├── contacto.astro
│   │   ├── newsletter.astro
│   │   ├── privacidad.astro
│   │   ├── terminos.astro
│   │   ├── 404.astro
│   │   ├── agenda/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── beneficios/
│   │   │   └── index.astro
│   │   ├── cursos/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── institucional/
│   │   │   ├── index.astro
│   │   │   ├── que-es-apba.astro
│   │   │   ├── comision-directiva.astro
│   │   │   ├── departamentos.astro
│   │   │   ├── representacion-gremial.astro
│   │   │   ├── docencia-e-investigacion.astro
│   │   │   └── publicaciones.astro
│   │   ├── normativa/
│   │   │   └── index.astro
│   │   ├── novedades/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── revistas/
│   │       ├── index.astro
│   │       └── [slug].astro
│   ├── styles/
│   │   ├── tokens.json       # W3C Design Tokens (source of truth)
│   │   └── theme.css         # CSS custom properties (--apba-*) + base reset
│   └── types/
│       └── models.ts         # TypeScript interfaces for all 13 content models
├── scripts/
│   ├── verify-redirects.mjs  # CI: checks redirect-candidates.csv ↔ config
│   └── verify-routes.mjs     # CI: checks ia-tree.json ↔ dist/
├── .github/
│   └── workflows/
│       └── ci.yml            # check → build → routes + redirects + a11y + LHCI
├── lighthouserc.json         # LHCI thresholds (mobile, Perf≥90, A11y≥95, SEO≥95)
├── astro.config.mjs
├── tsconfig.json
└── .env.example
```

---

## 2. Content flow

```
CMS (Sanity)                     Build time                     Browser
────────────                     ──────────                     ───────
  GROQ query        →    src/lib/cms.ts (getNews, etc.)    →   HTML page
  (typed response)       called from getStaticPaths()           (zero JS by default)
```

All CMS functions are in `src/lib/cms.ts`. During the scaffold phase every function
returns placeholder data so routes build without a live CMS. Replace stub
implementations once CP-6 (stack/CMS choice) is resolved and Sanity is provisioned.

**Never call the CMS directly from a `.astro` page.** Always go through `src/lib/cms.ts`
so the data layer can be swapped without touching every page.

---

## 3. Path aliases

Defined in `tsconfig.json` and `astro.config.mjs`:

| Alias           | Resolves to        |
| --------------- | ------------------ |
| `@components/*` | `src/components/*` |
| `@layouts/*`    | `src/layouts/*`    |
| `@lib/*`        | `src/lib/*`        |
| `@styles/*`     | `src/styles/*`     |
| `@types/*`      | `src/types/*`      |

---

## 4. Design tokens

Source of truth: `src/styles/tokens.json` (W3C Design Tokens format).  
Consumed as: `src/styles/theme.css` — every token exposed as a `--apba-*` CSS custom property.

**Rule:** No raw hex values or magic numbers in component `<style>` blocks. Always reference a `--apba-*` token.

Key tokens:

- `--apba-brand-primary`: `#16519E` (provisional, pending CP-4 official logo)
- `--apba-brand-accent`: `#C2185B` (provisional)
- `--apba-font-sans`: Inter Variable (self-hosted, `font-display: swap`)
- `--apba-font-display`: Fraunces (self-hosted, `font-display: swap`)

WCAG 2.1 AA compliance: verified in `contrast-audit.md`. One exception: `--apba-brand-accent-alt` (#16A0D8) is AA-large only — not for body text.

---

## 5. Component conventions

### Atomic design tiers

| Tier     | Rule                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Atom     | No imports from molecules/organisms. Pure presentational.                |
| Molecule | May import atoms. No page-level state.                                   |
| Organism | May import atoms + molecules. May receive async data as props.           |
| Layout   | Shell only — no content, no business logic.                              |
| Page     | Calls CMS, assembles organisms/molecules, emits structured data JSON-LD. |

### Props interface

Every component declares a typed `interface Props` at the top of its frontmatter.  
`class` prop (aliased to `className`) is always accepted for style extension.

### Accessibility checklist (per component)

- All interactive elements have a visible focus ring (`--apba-focus-ring`, 3px offset).
- Touch targets ≥ 44×44 px (set via `min-height: 44px`).
- `aria-label` on icon-only buttons/links.
- Decorative images: `alt=""`.
- `aria-current="page"` on active nav items and breadcrumb leaf.
- `role="alert"` or `aria-live` on dynamic status messages.

---

## 6. Page conventions

### SEO meta

Every page passes a typed `seo` object to `BaseLayout`:

```ts
const seo = {
  title: "Page title — APBA",  // ≤60 chars
  description: "…",             // ≤160 chars
  noindex: false,                // true for search, thank-you, staging
  canonical?: string,            // optional override
  ogImage?: string,
};
```

### Structured data (JSON-LD)

Output inline via `<script type="application/ld+json" set:html={JSON.stringify(schema)} />` in the page frontmatter output, **not** inside BaseLayout. Each page type uses the correct Schema.org type:

| Page              | Schema type                              |
| ----------------- | ---------------------------------------- |
| Home              | Organization + WebSite                   |
| Novedades detail  | NewsArticle                              |
| Revistas detail   | PublicationIssue                         |
| Cursos detail     | Course                                   |
| Agenda detail     | Event                                    |
| Asistencia        | ProfessionalService                      |
| Institucional sub | AboutPage (que-es-apba)                  |
| All pages         | BreadcrumbList (via Breadcrumb molecule) |

### Locale

`<html lang="es-AR">` always. Date formatting: `toLocaleDateString("es-AR", …)`. Argentine voseo CTAs (`ASOCIATE`, `OBTENÉ`, `SEGUÍ`) must never be changed to tuteo or ustedeo.

---

## 7. Redirect map

All legacy WordPress URLs must redirect to their new equivalents. Source of truth:
`../extraction/redirect-candidates.csv` (relative to this directory).

Critical redirects:

- `/{slug}/` → `/novedades/{slug}/` for all 39 posts
- `/asistencia-2/` → `/asistencia/`
- `/agenda-2/` → `/agenda/`
- `/cursos-gratuitos/` → `/cursos/`

Declare redirects in `public/_redirects` (Netlify) or `vercel.json` (Vercel) once the hosting platform is chosen (CP-6). CI will fail if any candidate is missing.

---

## 8. CI pipeline

```
push / PR → check (tsc + eslint + prettier) → build → routes + redirects + a11y + LHCI (main only)
```

All jobs defined in `.github/workflows/ci.yml`.  
LHCI thresholds: `lighthouserc.json`.  
Accessibility: axe-core via Playwright, zero critical/serious violations allowed.

---

## 9. Environment variables

See `.env.example` for required keys. Never commit `.env` or real credentials.  
CI uses stub values for `SANITY_PROJECT_ID` so the build succeeds without a live CMS.

---

## 10. Open checkpoints (human action required)

| CP   | Blocker                                 | Impact                                |
| ---- | --------------------------------------- | ------------------------------------- |
| CP-0 | WordPress admin / DB access             | Draft posts, CF7 forms, calendar data |
| CP-3 | Editorial content audit                 | All `[PLACEHOLDER]` notices in pages  |
| CP-4 | Official logo SVG + confirmed brand hex | `--apba-brand-primary` may change     |
| CP-5 | Design system approval                  | Fraunces display font, token values   |
| CP-6 | Stack/CMS choice (Sanity vs Strapi)     | Replace stubs in `src/lib/cms.ts`     |

See `../blueprint/05-phase-5-quality-gates-checkpoints.md` for full DoD per checkpoint.
