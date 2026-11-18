/**
 * Geometry helpers for the signature pad.
 *
 * These live outside the component so the resize behaviour can be tested directly. The bug
 * they exist to prevent: the pad used to rebuild its canvas on every window resize and throw
 * away the stored strokes. On mobile, window.resize fires whenever the on-screen keyboard
 * opens or closes and whenever the browser address bar collapses on scroll - both of which
 * change height only. Visitors signed, tapped the next field, and their signature silently
 * vanished, which blocked submission at the final step of the trial form.
 */

/** A stroke, stored flat as [x0, y0, x1, y1, ...] in CSS pixels. */
export type SignaturePath = number[];

/**
 * Whether a resize should rebuild the canvas. Only a width change should: the canvas is
 * fixed-height in CSS, so a height-only resize event carries no new layout for the pad and
 * rebuilding would discard the signature for nothing.
 */
export function shouldRebuildCanvas(previousWidth: number, nextWidth: number): boolean {
  return nextWidth !== previousWidth;
}

/**
 * Horizontal scale to apply to stored strokes when the pad's width changes, so a signature
 * drawn before an orientation change still lines up afterwards. The first measurement has no
 * previous width and needs no scaling.
 */
export function rescaleFactor(previousWidth: number, nextWidth: number): number {
  if (previousWidth <= 0 || nextWidth <= 0) return 1;
  return nextWidth / previousWidth;
}

/** Apply a scale factor to every coordinate in every stroke. */
export function scalePaths(paths: SignaturePath[], scale: number): SignaturePath[] {
  if (scale === 1) return paths;
  return paths.map((path) => path.map((coordinate) => coordinate * scale));
}

/** Strokes worth keeping: a single tap is not a signature. */
export function drawablePaths(paths: SignaturePath[]): SignaturePath[] {
  return paths.filter((path) => path.length >= 4);
}
