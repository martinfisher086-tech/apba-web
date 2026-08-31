/**
 * Responsive image sets for editorial artwork (course flyers, news heroes).
 *
 * scripts/optimize-image.mjs publishes each picture as `<base>-<width>.jpg`
 * plus a WebP sibling at every width in RESPONSIVE_WIDTHS, and content records
 * point their `image.url` at the 1200px JPEG. Legacy artwork extracted from
 * WordPress does not follow that convention, so `responsiveSources` returns
 * undefined for it and callers fall back to a plain single-file <img>.
 */

/** Keep in sync with WIDTHS in scripts/optimize-image.mjs. */
export const RESPONSIVE_WIDTHS = [640, 960, 1200];

export interface ResponsiveSources {
  webp: string;
  jpeg: string;
}

export function responsiveSources(url: string): ResponsiveSources | undefined {
  const base = url.match(/^(.*)-1200\.jpg$/)?.[1];
  if (!base) return undefined;
  const srcset = (ext: string): string =>
    RESPONSIVE_WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");
  return { webp: srcset("webp"), jpeg: srcset("jpg") };
}
