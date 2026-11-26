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

/** Short glyph shown inside the coin chip (currency ticker, trimmed). */
export function assetSym(code: string): string {
  return code.length <= 4 ? code.toUpperCase() : code.slice(0, 3).toUpperCase();
}

/** Middle-truncate long 0x… hex addresses inside a label so they don't overflow the row. */
export function shortenAddresses(text: string): string {
  return text.replace(/0x[0-9a-fA-F]{12,}/g, (m) => m.slice(0, 8) + '…' + m.slice(-6));
}
