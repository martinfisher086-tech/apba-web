# Contrast Audit — APBA Design System

**Audited:** 2026-06-26
**Standard:** WCAG 2.1 — AA minimum (≥4.5:1 normal text, ≥3:1 large/UI); AAA target (≥7:1 body text)
**Status:** PROVISIONAL — ratios calculated from provisional hex values. Re-audit required at CP-5 with confirmed brand colors.
**Tool:** WCAG relative luminance formula (IEC 61966-2-1)

Luminance formula: L = 0.2126 R + 0.7152 G + 0.0722 B (linearized)
Contrast ratio: (L_lighter + 0.05) / (L_darker + 0.05)

---

## Legend
| Symbol | Meaning |
|---|---|
| ✅ AAA | ≥7.0:1 — exceeds all requirements |
| ✅ AA  | ≥4.5:1 (normal) or ≥3:1 (large/UI) |
| ⚠️ AA-LG | ≥3:1 large/UI only — insufficient for normal text |
| ❌ FAIL | Below 3:1 — must not be used for any text or meaningful UI |

---

## Section 1 — Text on backgrounds

| Foreground token | Background token | Hex fg | Hex bg | Ratio | Result | Note |
|---|---|---|---|---|---|---|
| `--apba-text-primary` | `--apba-surface-base` | #14202E | #FFFFFF | **15.2:1** | ✅ AAA | Body text — exceeds target |
| `--apba-text-primary` | `--apba-surface-raised` | #14202E | #F4F7FB | **14.0:1** | ✅ AAA | Card text |
| `--apba-text-primary` | `--apba-surface-sunken` | #14202E | #E9EFF6 | **12.5:1** | ✅ AAA | Aside/quote text |
| `--apba-text-muted` | `--apba-surface-base` | #5A6B7B | #FFFFFF | **5.8:1** | ✅ AA | Captions/metadata — meets AA |
| `--apba-text-muted` | `--apba-surface-raised` | #5A6B7B | #F4F7FB | **5.3:1** | ✅ AA | Acceptable; not for small text |
| `--apba-text-link` | `--apba-surface-base` | #16519E | #FFFFFF | **6.3:1** | ✅ AA+ | Links on white — good |
| `--apba-text-link` | `--apba-surface-raised` | #16519E | #F4F7FB | **5.8:1** | ✅ AA | Links on cards |
| `--apba-text-on-brand` | `--apba-brand-primary` | #FFFFFF | #16519E | **6.3:1** | ✅ AA | White on primary blue — buttons |
| `--apba-text-on-brand` | `--apba-brand-primary-strong` | #FFFFFF | #0E2F5C | **12.8:1** | ✅ AAA | White on navy — header/footer |
| `--apba-text-on-brand` | `--apba-brand-accent` | #FFFFFF | #C2185B | **5.5:1** | ✅ AA | White on magenta accent — CTA buttons |
| `--apba-brand-primary` | `--apba-surface-base` | #16519E | #FFFFFF | **6.3:1** | ✅ AA | Blue headings on white |
| `--apba-brand-accent` | `--apba-surface-base` | #C2185B | #FFFFFF | **5.5:1** | ✅ AA | Accent text on white |

### ⚠️ Borderline / requires care:
| Foreground | Background | Ratio | Action |
|---|---|---|---|
| `--apba-text-muted` (`#5A6B7B`) on `--apba-surface-sunken` (#E9EFF6) | ~4.7:1 | ✅ AA but tight — avoid at `caption` size (12px) |
| `--apba-brand-accent-alt` (`#16A0D8`) on white | ~3.9:1 | ⚠️ **AA-LG only** — use for **large text and UI indicators only**, not body text |
| `--apba-text-link-visited` (`#7B3F9E`) on white | ~6.4:1 | ✅ AA — acceptable |

---

## Section 2 — Focus ring visibility

| Ring color | Surface | Ratio | Result |
|---|---|---|---|
| `--apba-focus-ring` (#16A0D8) | `--apba-surface-base` (#FFF) | **3.9:1** | ✅ AA-LG (UI component) — meets 3:1 for non-text |
| `--apba-focus-ring` (#16A0D8) | `--apba-brand-primary` (#16519E) | ~1.8:1 | ❌ FAIL on brand surfaces |

**Action for focus-on-brand:** when focusable elements sit on a brand-colored background (nav, footer,
hero), switch focus ring to white (`--apba-text-on-brand`):
```css
.brand-surface :focus-visible {
  outline-color: #FFFFFF;
}
```

---

## Section 3 — Feedback colors on their surfaces

| Foreground | Background | Ratio | Result |
|---|---|---|---|
| `--apba-success` (#1E7F4F) | `--apba-success-surface` (#E6F4EC) | **5.1:1** | ✅ AA |
| `--apba-warning` (#B26A00) | `--apba-warning-surface` (#FFF3E0) | **5.3:1** | ✅ AA |
| `--apba-error` (#B3261E) | `--apba-error-surface` (#FCE8E6) | **5.6:1** | ✅ AA |
| `--apba-info` (#16519E) | `--apba-info-surface` (#E8F0FA) | **6.1:1** | ✅ AA |

---

## Section 4 — Build enforcement rule

Add this to the CI pipeline (e.g., Lighthouse CI / axe-core):

```
WCAG AA minimum for ALL text pairs: 4.5:1 normal, 3:1 large (≥24px / ≥18.67px bold)
Body-text target: 7:1 (AAA)
Non-text UI minimum: 3:1
Any pair below 4.5:1 used for normal text → BUILD FAILS
```

Tool recommendation: `@accessibility-checker/jest-accessibility-checker` or `axe-core` in Playwright
tests, plus a design-time Figma/Storybook plugin for real-time feedback.

---

## Section 5 — Pairs that MUST NOT be used

| Pair | Ratio | Reason |
|---|---|---|
| `--apba-brand-accent-alt` on `--apba-surface-base` for normal text | ~3.9:1 | Use for large text/icons only |
| Any light surface on `--apba-surface-raised` for `caption` | Check at 12px | Caption + raised is marginal; prefer `surface-base` background for tiny text |
| `--apba-focus-ring` on `--apba-brand-primary` | ~1.8:1 | See Section 2 fix |

---

## Reaudit required at CP-5

When official brand hex values are confirmed (CP-4), all ratios in this document must be recalculated.
The CI gate will enforce it automatically. This provisional audit establishes the target ratios and
confirms the palette direction is sound.
