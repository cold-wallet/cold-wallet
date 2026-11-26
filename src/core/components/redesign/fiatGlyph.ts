// redesign/fiatGlyph.ts — the currency SYMBOL (₴ € £ $ zł …) and tile colours for fiat chips.
// Fiat is drawn, not imaged: free icon sets carry only a handful of currency-symbol images, so
// every fiat code gets the same tile (gradient + symbol) and nothing is fetched. Symbols come
// from the browser's built-in Intl data (offline).

// Symbols shared by several currencies: for those, prefer the disambiguated form Intl knows
// (A$, CA$, HK$, CN¥, E£) when it is short enough for a chip.
const SHARED = new Set(['$', '£', '¥', 'kr', 'Rs', 'L', 'Bs', 'R', 'K', 'P']);

const OVERRIDES: Record<string, string | null> = {
  // precious metals (ISO "X" codes) read better as their element symbols
  XAU: 'Au', XAG: 'Ag', XPT: 'Pt', XPD: 'Pd',
  // the new som sign (U+20C0, 2021) is missing from most system fonts
  KGS: null,
};

function intlSymbol(code: string, display: 'symbol' | 'narrowSymbol'): string | null {
  try {
    const part = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: display })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    const v = part ? part.value.trim() : '';
    return v && v !== code ? v : null;
  } catch {
    return null;
  }
}

const cache = new Map<string, string | null>();

/** Display symbol for a fiat code, or null when it has none (the code is shown instead). */
export function fiatSymbol(code: string): string | null {
  const c = code.toUpperCase();
  if (cache.has(c)) return cache.get(c)!;
  let sym: string | null;
  if (c in OVERRIDES) sym = OVERRIDES[c];
  else {
    const narrow = intlSymbol(c, 'narrowSymbol');
    const full = intlSymbol(c, 'symbol');
    sym = narrow && SHARED.has(narrow) && full && full.length <= 3 ? full : narrow || full;
  }
  cache.set(c, sym);
  return sym;
}

export interface FiatTint { from: string; to: string; ink: string; }

// Major currencies get a colour people associate with them; everything else shares one calm
// slate tile so the list stays even and the symbol does the identifying.
const T = (from: string, to: string, ink = '#fff'): FiatTint => ({ from, to, ink });
const FIAT_TINTS: Record<string, FiatTint> = {
  USD: T('#3fae74', '#1d6b45'),
  EUR: T('#5583f2', '#2a4db5'),
  GBP: T('#9364dc', '#5a349e'),
  UAH: T('#ffd84d', '#e6a700', '#1d1a10'),
  JPY: T('#e6596a', '#a82638'),
  CNY: T('#ea5a43', '#a92b19'),
  CHF: T('#ea4f55', '#ae2329'),
  PLN: T('#e2546d', '#a5223b'),
  TRY: T('#f05656', '#b52424'),
  INR: T('#f7a04a', '#c2660d'),
  XAU: T('#f3d36b', '#c79a1e', '#2a2108'),
  XAG: T('#e3e7ec', '#9aa3ae', '#1b1f24'),
};
const DEFAULT_TINT = T('#62788f', '#384859');

export function fiatTint(code: string): FiatTint {
  return FIAT_TINTS[code.toUpperCase()] || DEFAULT_TINT;
}
