# Design System Usage Guide

**Project:** APBA — psicologos.org.ar
**Stack:** Astro + TypeScript + CSS Custom Properties
**System:** tokens.json → theme.css → components

---

## Core rule

> Every visual value in a component MUST come from a `--apba-*` CSS custom property.
> **No raw hex values. No magic numbers.** This is enforced in code review and by the
> design-token lint CI step.

---

## File structure

```
src/
  styles/
    theme.css          ← this is what components import (custom properties)
    tokens.json        ← source of truth (W3C Design Tokens format)
  components/          ← each has its own .css or Astro-scoped styles
public/
  fonts/               ← self-hosted woff2 subsets (see Font Loading below)
contrast-audit.md      ← WCAG audit; re-run at CP-5
design-system-usage.md ← this file
```

---

## How to use tokens in a component

### Astro component (`.astro`)
```astro
---
// ButtonPrimary.astro — no business logic
---
<button class="btn-primary" {...Astro.props}>
  <slot />
</button>

<style>
  .btn-primary {
    /* Use tokens — never raw values */
    background-color: var(--apba-brand-accent);
    color:            var(--apba-text-on-brand);
    font-family:      var(--apba-font-sans);
    font-size:        var(--apba-text-body);
    font-weight:      var(--apba-weight-semibold);
    padding:          var(--apba-space-3) var(--apba-space-6);
    border-radius:    var(--apba-radius-md);
    border:           none;
    cursor:           pointer;
    transition:       background-color var(--apba-duration-fast) var(--apba-ease-out),
                      box-shadow       var(--apba-duration-fast) var(--apba-ease-out);
    min-height:       44px;   /* touch target minimum */
    min-width:        44px;
  }

  .btn-primary:hover {
    background-color: #9C0E49; /* derived from accent — darken 15%; update via token when CP-5 confirms */
    box-shadow: var(--apba-shadow-2);
  }

  .btn-primary:focus-visible {
    outline: 3px solid var(--apba-focus-ring);
    outline-offset: 2px;
  }

  .btn-primary:disabled,
  .btn-primary[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

### Global import in `BaseLayout.astro`
```astro
---
import "../styles/theme.css";
---
```

---

## Typography patterns

```css
/* Display / Hero */
.hero-headline {
  font-family: var(--apba-font-display);
  font-size:   var(--apba-text-display);
  font-weight: var(--apba-weight-bold);
  line-height: var(--apba-leading-tight);
  letter-spacing: var(--apba-tracking-tight);
  color: var(--apba-text-on-brand); /* white on hero dark background */
}

/* Long-form article body */
.article-body {
  font-family: var(--apba-font-sans);
  font-size:   var(--apba-text-body);
  line-height: var(--apba-leading-loose);
  max-width:   var(--apba-reading-width);
  color:       var(--apba-text-primary);
}

/* Overline / eyebrow label */
.section-eyebrow {
  font-size:      var(--apba-text-overline);
  font-weight:    var(--apba-weight-semibold);
  letter-spacing: var(--apba-tracking-wider);
  text-transform: uppercase;
  color:          var(--apba-text-muted);
}
```

---

## Color usage rules

| Token | Use | Do NOT use for |
|---|---|---|
| `--apba-brand-primary` | Links, body-text blue headings, secondary buttons | Large background washes |
| `--apba-brand-primary-strong` | Header bg, footer bg, hero overlay | Body text on light |
| `--apba-brand-accent` | **Primary CTA only** (ASOCIATE button, enroll button) | Decorative use; max 1 per section |
| `--apba-brand-accent-alt` | Section tags, active states, icon accents | Normal-weight body text (3.9:1 — AA-LG only) |
| `--apba-text-muted` | Dates, categories, captions | Headings |
| `--apba-surface-raised` | Card backgrounds | Full-page backgrounds |
| `--apba-focus-ring` | Focus outlines only | Anything else |

---

## Spacing usage

```css
/* Consistent card padding */
.card {
  padding: var(--apba-space-6); /* 24px */
  gap:     var(--apba-space-4); /* 16px between card elements */
  border-radius: var(--apba-radius-lg); /* 8px */
  background: var(--apba-surface-raised);
  box-shadow: var(--apba-shadow-1);
  transition: box-shadow var(--apba-duration-fast) var(--apba-ease-out);
}
.card:hover {
  box-shadow: var(--apba-shadow-2);
}
```

---

## Responsive breakpoints

Always write mobile-first (min-width):

```css
.grid {
  display: grid;
  grid-template-columns: 1fr; /* mobile: single column */
  gap: var(--apba-space-4);
}

@media (min-width: 768px) {   /* --apba-breakpoint-md */
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {  /* --apba-breakpoint-lg */
  .grid { grid-template-columns: repeat(3, 1fr); gap: var(--apba-space-6); }
}
```

---

## Font loading

Self-hosted fonts live in `/public/fonts/`. The `@font-face` declarations in `theme.css` reference
them by relative URL. The build pipeline (Brief 5 Asset Pipeline) subsets the woff2 files to the
characters needed for `es-AR` + UI.

Before deploying:
1. Download `Inter Variable` from `rsms.me/inter/` or `fontsource.org/fonts/inter-variable`
2. Subset with `pyftsubset` to `U+0000-024F` + dashes + quotes + guillemets
3. Place `inter-variable-latin-ext.woff2` in `/public/fonts/`
4. Same process for `Fraunces Variable` (if CP-5 confirms Option A serif pairing)

`<link rel="preload">` for the primary font goes in `BaseLayout.astro`:
```astro
<link rel="preload" href="/fonts/inter-variable-latin-ext.woff2"
      as="font" type="font/woff2" crossorigin />
```

---

## Motion

```css
/* Standard transition — use on interactive elements */
.interactive {
  transition:
    background-color var(--apba-duration-fast) var(--apba-ease-out),
    color            var(--apba-duration-fast) var(--apba-ease-out),
    box-shadow       var(--apba-duration-fast) var(--apba-ease-out);
}
/* prefers-reduced-motion handled globally in theme.css — no per-component override needed */
```

---

## Accessibility checklist (per component)

- [ ] Every `<input>`, `<textarea>`, `<select>` has an associated `<label>`
- [ ] Every `<img>` has a non-empty `alt` (or `alt=""` if decorative)
- [ ] Touch targets ≥ 44×44px
- [ ] Focus state visible via `var(--apba-focus-ring)` — never `outline: none`
- [ ] Color is never the sole means of conveying information
- [ ] Text contrast verified against `contrast-audit.md`
- [ ] Interactive elements have `role`, `aria-label`, or `aria-labelledby` where needed
- [ ] Dropdown menus have `aria-expanded`, arrow-key nav, and Esc-to-close
