/**
 * Presentation helpers for Course records.
 * Keeps label wording and the flyer srcset convention in one place so the
 * course card, the listing and the detail page always agree.
 */
import type { Course, CourseModality, CourseStatus } from "@models/models";
import { formatLongDate } from "@lib/dates";

const MODALITY_LABEL: Record<CourseModality, string> = {
  virtual: "A distancia",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

const STATUS: Record<
  CourseStatus,
  { label: string; variant: "success" | "primary" | "default" }
> = {
  upcoming: { label: "Inscripción abierta", variant: "success" },
  ongoing: { label: "En curso", variant: "primary" },
  past: { label: "Edición finalizada", variant: "default" },
};

export function modalityLabel(modality: CourseModality): string {
  return MODALITY_LABEL[modality];
}

export function statusLabel(status: CourseStatus): string {
  return STATUS[status].label;
}

export function statusVariant(
  status: CourseStatus,
): "success" | "primary" | "default" {
  return STATUS[status].variant;
}

/** Full course name, including the subtitle when there is one. */
export function fullTitle(course: Course): string {
  return course.subtitle ? `${course.title}. ${course.subtitle}` : course.title;
}

/**
 * A course only gets its own page when the editorial team supplied real copy
 * for it. The flyer-only courses render as a self-contained card instead —
 * everything the flyer says is in the card, so a detail page would add nothing.
 */
export function hasDetailPage(course: Course): boolean {
  return Boolean(course.body);
}

/** "25 de agosto de 2026" — only for dates we actually know in full. */
export function formatCourseDate(iso: string): string {
  return formatLongDate(iso);
}

/** Human label for the enrolment/contact link. */
export function registrationLabel(url: string): string {
  return url.startsWith("mailto:") ? url.slice("mailto:".length) : url;
}
