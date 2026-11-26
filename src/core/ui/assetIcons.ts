// ui/assetIcons.ts — currency / source → bundled icon URL lookup.
// Icons live in public/asset-icons/ (same origin, never a CDN — see LICENSES.md there) and are
// fetched by <img> only when shown. A null result means "no icon": callers keep the coloured
// text chip / letter mark, so unknown currencies and exchanges render exactly as before.
import { CRYPTO_ICON_CODES, ROUND_CRYPTO_ICON_CODES, SOURCE_ICON_KEYS } from './assetIcons.data';

const BASE = (import.meta.env.BASE_URL || '/') + 'asset-icons/';
const CRYPTO = new Set(CRYPTO_ICON_CODES);
const ROUND = new Set(ROUND_CRYPTO_ICON_CODES);
const SOURCES = new Set(SOURCE_ICON_KEYS);

/** True when the coin's logo is a circle (transparent corners) rather than a full square tile. */
export function isRoundCryptoIcon(code: string | null | undefined): boolean {
  return ROUND.has((code || '').trim().toUpperCase());
}

/** Coin logo for a crypto ticker. (Fiat has no image: it is drawn as a symbol tile — fiatGlyph.ts.) */
export function cryptoIconUrl(code: string | null | undefined): string | null {
  const c = (code || '').trim().toUpperCase();
  return c && CRYPTO.has(c) ? BASE + 'crypto/' + c.toLowerCase() + '.svg' : null;
}

// CCXT exchange ids that share one brand mark (futures / regional / legacy ids).
const SOURCE_ALIASES: Record<string, string> = {
  binancecoinm: 'binance',
  binanceus: 'binance',
  binanceusdm: 'binance',
  coinbaseadvanced: 'coinbase',
  coinbaseexchange: 'coinbase',
  coinbaseinternational: 'coinbase',
  gateio: 'gate',
  krakenfutures: 'kraken',
  kucoinfutures: 'kucoin',
  myokx: 'okx',
  okxus: 'okx',
  htx: 'huobi',
};

/** Icon for an integration: 'binance' | 'okx' | 'monobank' | 'metamask' or a CCXT exchange id. */
export function sourceIconUrl(key: string | null | undefined): string | null {
  const k = (key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const resolved = SOURCE_ALIASES[k] || k;
  return SOURCES.has(resolved) ? BASE + 'source/' + resolved + '.svg' : null;
}
