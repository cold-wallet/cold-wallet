// redesign/portfolio.ts — pure selectors deriving the new dashboard's view models from
// the real AssetDTO[] + PriceService (USD via priceService.transform). No mechanics here.
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import PriceService from '../../services/PriceService';
import { assetColor, assetSource, assetSym, isManual, type SourceMeta } from './visual';
import { applyAssetPalette, classPalette, type PaletteKey } from './palette';

const PALETTE: PaletteKey = 'emerald';

export interface Valued {
  asset: AssetDTO;
  id: string;
  code: string;
  kind: 'fiat' | 'crypto';
  usd: number;
  source: SourceMeta;
  manual: boolean;
  color: string;
  sym: string;
  scale: number;
  unitUsd: number;
}

export interface ClassSlice { key: 'fiat' | 'crypto'; label: string; usd: number; pct: number; color: string; }
export interface AssetSlice { key: string; label: string; kind: string; usd: number; pct: number; color: string; }
export interface ArcSeg {
  a0: number; a1: number; usd: number; pct: number; color: string; label: string; key: string;
  [k: string]: unknown;
}
export interface ChartData { leafSegs: ArcSeg[]; curSegs: ArcSeg[]; typeSegs: ArcSeg[]; }
export interface SidebarGroup { k: string; label: string; mark: string; tint: string; items: Valued[]; sum: number; }
export interface SourceBar { key: string; usd: number; pct: number; label: string; mark: string; tint: string; }

function usdOf(ps: PriceService, a: AssetDTO): number {
  const v = ps.transform(a.currency, +a.amount, 'USD');
  return isFinite(v) ? v : 0;
}

// Per-currency display precision. Show only as many decimals as carry weight: the smallest
// shown unit must be worth at least SIGNIFICANCE_USD (1¢), so a $1 stablecoin gets 2 decimals,
// pricier coins more, BTC ~7. Fiat keeps its own scale; unknown-price coins fall back too.
const SIGNIFICANCE_USD = 0.01;
const MIN_CRYPTO_SCALE = 2;
const MAX_CRYPTO_SCALE = 8;

export function displayScale(asset: AssetDTO, ps: PriceService): number {
  const fallback = asset.decimalScale || (asset.type === AssetType.fiat ? 2 : 8);
  if (asset.type === AssetType.fiat) return fallback;
  const unit = ps.transform(asset.currency, 1, 'USD'); // USD per 1 unit
  if (!isFinite(unit) || unit <= 0) return fallback;
  const d = Math.floor(Math.log10(unit / SIGNIFICANCE_USD));
  return Math.min(MAX_CRYPTO_SCALE, Math.max(MIN_CRYPTO_SCALE, d));
}

/** USD per 1 unit — 0 for fiat or unknown price. Gates the "<0.01 TICKER" dust floor: a token
 *  whose 0.01-unit step is worth < 1¢ collapses its dust digits, but fiat never does. */
export function unitUsdOf(asset: AssetDTO, ps: PriceService): number {
  if (asset.type === AssetType.fiat) return 0;
  const u = ps.transform(asset.currency, 1, 'USD');
  return isFinite(u) && u > 0 ? u : 0;
}

/** Attach USD value + source + visual metadata to every asset. When `hideMetaMaskDust` is on,
 *  drop MetaMask holdings worth < $0.01 (dust / price-less scam tokens) — filtering here, the one
 *  point where USD is known, hides them consistently across totals, charts, legend and by-source. */
export function valueAssets(assets: AssetDTO[], ps: PriceService, hideMetaMaskDust = false): Valued[] {
  const valued: Valued[] = assets.map((a) => ({
    asset: a,
    id: a.id,
    code: a.currency,
    kind: a.type === AssetType.fiat ? 'fiat' : 'crypto',
    usd: usdOf(ps, a),
    source: assetSource(a),
    manual: isManual(a),
    color: assetColor(a.currency),
    sym: assetSym(a.currency),
    scale: displayScale(a, ps),
    unitUsd: unitUsdOf(a, ps),
  }));
  return hideMetaMaskDust
    ? valued.filter((v) => !(v.asset.isMetaMaskAsset && v.usd < 0.01))
    : valued;
}

export function totalUsd(v: Valued[]): number {
  return v.reduce((s, h) => s + h.usd, 0);
}

/** Fiat vs Crypto split for the two stat cards + donut inner ring. */
export function classSlices(v: Valued[], total: number): ClassSlice[] {
  const cy = v.filter((h) => h.kind === 'crypto').reduce((s, h) => s + h.usd, 0);
  const fi = total - cy;
  const cc = classPalette(PALETTE);
  return [
    { key: 'fiat', label: 'Fiat', usd: fi, pct: total ? (fi / total) * 100 : 0, color: cc.fiat },
    { key: 'crypto', label: 'Crypto', usd: cy, pct: total ? (cy / total) * 100 : 0, color: cc.crypto },
  ];
}

/** Per-currency aggregates, fiat-first then by value, colored by palette. */
export function assetSlices(v: Valued[], total: number): AssetSlice[] {
  const map: Record<string, AssetSlice> = {};
  v.forEach((h) => {
    if (!map[h.code]) map[h.code] = { key: h.code, label: h.code, kind: h.kind, usd: 0, pct: 0, color: h.color };
    map[h.code].usd += h.usd;
  });
  const arr = Object.values(map).map((a) => ({ ...a, pct: total ? (a.usd / total) * 100 : 0 }));
  const rank: Record<string, number> = { fiat: 0, crypto: 1 };
  arr.sort((a, b) => (rank[a.kind] - rank[b.kind]) || (b.usd - a.usd));
  applyAssetPalette(arr, PALETTE);
  return arr;
}

/** 3-level donut data: Type → Currency → Holding. */
export function chartData(v: Valued[], assets: AssetSlice[], classes: ClassSlice[], total: number): ChartData {
  const classColor = Object.fromEntries(classes.map((c) => [c.key, c.color]));
  const curColor = Object.fromEntries(assets.map((a) => [a.key, a.color]));
  const curOrder = assets.map((a) => a.key);

  const byCur: Record<string, Valued[]> = {};
  v.forEach((h) => { (byCur[h.code] ||= []).push(h); });

  const ordered: Valued[] = [];
  curOrder.forEach((cur) => (byCur[cur] || []).slice().sort((a, b) => b.usd - a.usd).forEach((h) => ordered.push(h)));

  let acc = 0;
  const leafSegs: ArcSeg[] = ordered.map((h) => {
    const a0 = acc;
    acc += (total ? h.usd / total : 0) * 360;
    const a1 = acc;
    return {
      a0, a1, usd: h.usd, pct: total ? (h.usd / total) * 100 : 0, color: curColor[h.code] || '#888',
      label: h.code, key: 'hold:' + h.id, id: h.id, code: h.code, kind: h.kind, srcLabel: h.source.label,
      amount: h.asset.amount, scale: h.scale, name: h.asset.normalizedName,
    };
  });

  const group = (keyFn: (l: ArcSeg) => string, mk: (l: ArcSeg) => Partial<ArcSeg>): ArcSeg[] => {
    const segs: (ArcSeg & { _k: string })[] = [];
    let cur: (ArcSeg & { _k: string }) | null = null;
    leafSegs.forEach((l) => {
      const k = keyFn(l);
      if (!cur || cur._k !== k) {
        cur = { _k: k, a0: l.a0, a1: l.a1, usd: 0, pct: 0, color: '#888', label: '', key: '', ...mk(l) } as ArcSeg & { _k: string };
        segs.push(cur);
      }
      const c = cur as ArcSeg & { _k: string };
      c.a1 = l.a1;
      c.usd += l.usd;
    });
    return segs.map((s) => ({ ...s, pct: total ? (s.usd / total) * 100 : 0 }));
  };

  const curSegs = group((l) => l.code as string, (l) => ({ key: 'cur:' + l.code, label: l.code as string, color: curColor[l.code as string] || '#888' }));
  const typeSegs = group((l) => l.kind as string, (l) => ({ key: 'type:' + l.kind, label: l.kind === 'crypto' ? 'Crypto' : 'Fiat', color: classColor[l.kind as string] }));
  return { leafSegs, curSegs, typeSegs };
}

/** Sidebar list grouped by source, filtered by the search query. */
export function sidebarGroups(v: Valued[], query: string): SidebarGroup[] {
  const filtered = v.filter((h) => {
    if (!query) return true;
    return (h.code + ' ' + h.source.label).toLowerCase().includes(query.toLowerCase());
  });
  const by: Record<string, Valued[]> = {};
  filtered.forEach((h) => { (by[h.source.key] ||= []).push(h); });
  const out: SidebarGroup[] = Object.entries(by).map(([k, items]) => {
    items.sort((a, b) => b.usd - a.usd);
    const sum = items.reduce((s, h) => s + h.usd, 0);
    const s = items[0].source;
    return { k, label: s.label, mark: s.mark, tint: s.tint, items, sum };
  });
  out.sort((a, b) => b.sum - a.sum);
  return out;
}

/** "By source" overview bars. */
export function sourceBreakdown(v: Valued[], total: number): SourceBar[] {
  const by: Record<string, { usd: number; s: SourceMeta }> = {};
  v.forEach((h) => {
    if (!by[h.source.key]) by[h.source.key] = { usd: 0, s: h.source };
    by[h.source.key].usd += h.usd;
  });
  return Object.entries(by)
    .map(([key, { usd, s }]) => ({ key, usd, pct: total ? (usd / total) * 100 : 0, label: s.label, mark: s.mark, tint: s.tint }))
    .sort((a, b) => b.usd - a.usd);
}
