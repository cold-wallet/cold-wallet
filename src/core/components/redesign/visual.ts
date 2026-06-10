// redesign/visual.ts — bridges the real AssetDTO to the new design's visual needs
// (source chip metadata + deterministic per-currency color/glyph). Presentational only.
import AssetDTO from '../../domain/AssetDTO';

export interface SourceMeta {
  key: string;
  label: string;
  mark: string;
  tint: string;
}

/** Which funding source a holding came from (derived from the AssetDTO origin flags). */
export function assetSource(a: AssetDTO): SourceMeta {
  if (a.isBinanceAsset) return { key: 'binance', label: 'Binance', mark: 'B', tint: '#e0a82e' };
  if (a.isOkxAsset) return { key: 'okx', label: 'OKX', mark: 'X', tint: '#c9ccd1' };
  if (a.isMonobankAsset) return { key: 'monobank', label: 'Monobank', mark: 'm', tint: '#b6bcc6' };
  if (a.isMetaMaskAsset) return { key: 'metamask', label: 'MetaMask', mark: 'M', tint: '#e2761b' };
  if (a.isCcxtAsset) {
    const n = a.ccxtExchangeName || 'CCXT';
    return { key: 'ccxt:' + n, label: n, mark: (n[0] || 'C').toUpperCase(), tint: '#9aa7b8' };
  }
  return { key: 'manual', label: 'Cash / Manual', mark: '$', tint: '#8a94a6' };
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
