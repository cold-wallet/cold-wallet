// redesign/palette.ts — allocation color logic. Default 'emerald' single-hue ramp.
export type PaletteKey = 'token' | 'emerald' | string;

const GRAD: Record<string, string[]> = {
  emerald: ['#d7f2e3', '#3fb985', '#0e4a38'],
};

function hexToRgb(h: string): number[] {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
function rgbToHex(r: number[]): string {
  return '#' + r.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}
/** Sample a multi-stop gradient at t in 0..1. */
export function lerpGrad(stops: string[], t: number): string {
  t = Math.max(0, Math.min(1, t));
  const seg = stops.length - 1;
  const x = t * seg;
  const i = Math.min(seg - 1, Math.floor(x));
  const f = x - i;
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  return rgbToHex(a.map((c, k) => c + (b[k] - c) * f));
}

/** Colors for the two top-level class wedges (Fiat / Crypto). */
export function classPalette(palette: PaletteKey): { fiat: string; crypto: string } {
  if (GRAD[palette]) return { fiat: lerpGrad(GRAD[palette], 1), crypto: lerpGrad(GRAD[palette], 0.5) };
  return { fiat: 'var(--fiat)', crypto: 'var(--accent)' };
}

/** Mutates each asset's `color` in place according to the chosen palette. */
export function applyAssetPalette<T extends { kind: string; usd: number; color: string }>(arr: T[], palette: PaletteKey): void {
  if (GRAD[palette]) {
    const stops = GRAD[palette];
    const n = arr.length;
    [...arr].sort((a, b) => b.usd - a.usd).forEach((a, i) => {
      a.color = lerpGrad(stops, n > 1 ? (n - 1 - i) / (n - 1) : 1);
    });
  }
  // 'token' palette keeps native colors
}
