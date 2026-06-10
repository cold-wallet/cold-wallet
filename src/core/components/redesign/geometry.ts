// redesign/geometry.ts — SVG arc + squarified-treemap geometry (hand-rolled, no chart lib).

/** Point on a circle, with 0° = 12 o'clock (screen-up). */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG path `d` for a donut/ring segment between two angles (degrees). */
export function arcPath(cx: number, cy: number, rO: number, rI: number, start: number, end: number): string {
  const large = end - start > 180 ? 1 : 0;
  const [x1, y1] = polar(cx, cy, rO, start);
  const [x2, y2] = polar(cx, cy, rO, end);
  const [x3, y3] = polar(cx, cy, rI, end);
  const [x4, y4] = polar(cx, cy, rI, start);
  return `M${x1},${y1} A${rO},${rO} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rI},${rI} 0 ${large} 0 ${x4},${y4} Z`;
}

/** Lighten/darken a #rrggbb hex by amt in -1..1 (negative = darker). Returns rgb(). */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const f = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export interface SquarifyInput { value: number; [key: string]: unknown; }
export interface SquarifyCell { x: number; y: number; w: number; h: number; value: number; [key: string]: unknown; }

/** Squarified treemap layout (Bruls et al.). */
export function squarify(children: SquarifyInput[], x: number, y: number, w: number, h: number): SquarifyCell[] {
  const items = children.map((c) => ({ ...c, _a: 0 }));
  const valSum = items.reduce((s, c) => s + c.value, 0) || 1;
  const totalArea = w * h;
  items.forEach((c) => { c._a = (c.value / valSum) * totalArea; });

  const out: SquarifyCell[] = [];
  const area = { x, y, w, h };

  const worst = (row: typeof items, side: number) => {
    const s = row.reduce((a, r) => a + r._a, 0);
    const mx = Math.max(...row.map((r) => r._a));
    const mn = Math.min(...row.map((r) => r._a));
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };

  const place = (row: typeof items) => {
    const s = row.reduce((a, r) => a + r._a, 0);
    if (area.w >= area.h) {
      const colW = s / area.h;
      let cy = area.y;
      row.forEach((r) => { const rh = r._a / colW; out.push({ ...r, x: area.x, y: cy, w: colW, h: rh }); cy += rh; });
      area.x += colW; area.w -= colW;
    } else {
      const rowH = s / area.w;
      let cx = area.x;
      row.forEach((r) => { const rw = r._a / rowH; out.push({ ...r, x: cx, y: area.y, w: rw, h: rowH }); cx += rw; });
      area.y += rowH; area.h -= rowH;
    }
  };

  const remaining = items.slice();
  let row: typeof items = [];
  while (remaining.length) {
    const side = Math.min(area.w, area.h) || 1;
    const c = remaining[0];
    if (row.length === 0 || worst(row.concat([c]), side) <= worst(row, side)) {
      row.push(remaining.shift()!);
    } else {
      place(row); row = [];
    }
  }
  if (row.length) place(row);
  return out;
}
