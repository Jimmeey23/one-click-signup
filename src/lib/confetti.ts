export type ConfettiBurst = {
  particleCount: number;
  spread: number;
  angle: number;
  origin: { x: number; y: number };
  delayMs: number;
};

export function buildDualSideConfettiBursts(): ConfettiBurst[] {
  return [
    { particleCount: 70, spread: 70, angle: 60, origin: { x: 0, y: 0.6 }, delayMs: 0 },
    { particleCount: 70, spread: 70, angle: 120, origin: { x: 1, y: 0.6 }, delayMs: 150 },
  ];
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function fireDualSideConfetti(confettiFn: (opts: Record<string, unknown>) => void): void {
  if (prefersReducedMotion()) return;
  for (const burst of buildDualSideConfettiBursts()) {
    const { delayMs, ...opts } = burst;
    if (delayMs === 0) {
      confettiFn(opts);
    } else {
      setTimeout(() => confettiFn(opts), delayMs);
    }
  }
}
