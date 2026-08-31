/**
 * Date formatting for editorial content.
 *
 * Publish dates are stored date-only ("2026-08-31"). `new Date()` reads those
 * as UTC midnight, so rendering them in any timezone west of UTC — Argentina
 * included — shows the previous day. Anchoring at local noon keeps the calendar
 * date the editor entered.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toLocalDate(iso: string): Date {
  return new Date(DATE_ONLY.test(iso) ? `${iso}T12:00:00` : iso);
}

/** "31 de agosto de 2026" */
export function formatLongDate(iso: string): string {
  return toLocalDate(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "31 ago 2026" — compact, for sidebars and lists. */
export function formatShortDate(iso: string): string {
  return toLocalDate(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "agosto de 2026" — for issues dated to a month. */
export function formatMonthYear(iso: string): string {
  return toLocalDate(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  });
}
