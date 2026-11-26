// ui/visual.ts — bridges the real AssetDTO to the new design's visual needs
// (source chip metadata + deterministic per-currency color/glyph). Presentational only.
import AssetDTO from '../domain/AssetDTO';
import { sourceIconUrl } from './assetIcons';

export interface SourceMeta {
  key: string;
  label: string;
  mark: string;
  tint: string;
  /** bundled brand icon URL, or null to show the tinted `mark` letter */
  icon: string | null;
}

/** Which funding source a holding came from (derived from the AssetDTO origin flags). */
export function assetSource(a: AssetDTO): SourceMeta {
  if (a.isBinanceAsset) return { key: 'binance', label: 'Binance', mark: 'B', tint: '#e0a82e', icon: sourceIconUrl('binance') };
  if (a.isOkxAsset) return { key: 'okx', label: 'OKX', mark: 'X', tint: '#c9ccd1', icon: sourceIconUrl('okx') };
  if (a.isMonobankAsset) return { key: 'monobank', label: 'Monobank', mark: 'm', tint: '#b6bcc6', icon: sourceIconUrl('monobank') };
  if (a.isMetaMaskAsset) return { key: 'metamask', label: 'MetaMask', mark: 'M', tint: '#e2761b', icon: sourceIconUrl('metamask') };
  if (a.isCcxtAsset) {
    const n = a.ccxtExchangeName || 'CCXT';
    return { key: 'ccxt:' + n, label: n, mark: (n[0] || 'C').toUpperCase(), tint: '#9aa7b8', icon: sourceIconUrl(n) };
  }
  return { key: 'manual', label: 'Cash / Manual', mark: '$', tint: '#8a94a6', icon: null };
}

/** True for hand-entered holdings (editable/deletable); integration assets are synced/locked. */
export function isManual(a: AssetDTO): boolean {
  return !a.isBinanceAsset && !a.isOkxAsset && !a.isMonobankAsset && !a.isMetaMaskAsset && !a.isCcxtAsset;
}

/** Deterministic chip color from a currency code (stable across renders). */
export function assetColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const sat = 50 + (h % 20);
  return `hsl(${hue}deg ${sat}% 62%)`;
}

/** Short glyph shown inside the coin chip (currency ticker, trimmed). Built from the ticker's
 *  letters and digits when it has any, so "1-COIN-CAN-…" → "1CO" and "DOG•GO•…" → "DOG" rather
 *  than punctuation or stray combining marks ("( ͡° ͜ʖ ͡°)"). Counts characters, not UTF-16
 *  units, so emoji / astral tickers are never cut in half. */
export function assetSym(code: string): string {
  const all = Array.from(code.toUpperCase());
  const alnum = all.filter((c) => /[\p{L}\p{N}]/u.test(c));
  const chars = alnum.length ? alnum : all.filter((c) => !/[\p{M}\s]/u.test(c));
  return chars.length <= 4 ? chars.join('') : chars.slice(0, 3).join('');
}

// Wide glyphs (CJK, Hangul, full-width forms, emoji) take ~1.6× a Latin capital's width;
// combining marks (the ͡ in "( ͡° ͜ʖ ͡°)") take none.
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u;
const COMBINING = /\p{M}/u;

/** Visual width of a chip label in "Latin capital" units, for picking its font-size step. */
export function glyphWidth(label: string): number {
  let w = 0;
  for (const ch of Array.from(label)) w += COMBINING.test(ch) ? 0 : WIDE.test(ch) ? 1.6 : 1;
  return w;
}

/** Middle-truncate long 0x… hex addresses inside a label so they don't overflow the row. */
export function shortenAddresses(text: string): string {
  return text.replace(/0x[0-9a-fA-F]{12,}/g, (m) => m.slice(0, 8) + '…' + m.slice(-6));
}
