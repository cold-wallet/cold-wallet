// ui/fiatGlyph.ts — the currency SYMBOL (₴ € £ $ zł …) and tile colours for fiat chips.
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
// Palette: every tile sits in the same OKLCH band (dark tiles L 0.60→0.43, light tiles
// L 0.80→0.66, chroma ≈ 0.095–0.11), muted to match the dark green-grey UI so no fiat tile
// out-shouts the emerald accent or the coins' brand colours. Reds are spread into distinct
// warm hues (rose, terracotta, brick, raspberry, copper) so none reads as the --danger red.
// White ink on dark tiles ≥ 3.8:1, dark ink on light tiles ≥ 5.6:1 (symbols are large + bold).
const T = (from: string, to: string, ink = '#fff'): FiatTint => ({ from, to, ink });
const INK_DARK = '#1a1710';
const FIAT_TINTS: Record<string, FiatTint> = {
  USD: T('#49916a', '#0d5f3b'), // green, in family with the accent (h 158)
  EUR: T('#637fb9', '#354e84'), // blue, the app's --fiat hue (h 264)
  GBP: T('#8973b1', '#58427c'), // violet (h 300)
  UAH: T('#d7bc66', '#aa9039', INK_DARK), // muted gold (h 92)
  JPY: T('#ad6783', '#773752'), // rose (h 355)
  CNY: T('#b26a5e', '#7c392f'), // terracotta (h 30)
  CHF: T('#b2686e', '#7b373f'), // brick (h 15)
  PLN: T('#a66992', '#713960'), // raspberry (h 340)
  TRY: T('#af6d4f', '#793c1f'), // copper (h 45)
  INR: T('#ebb16c', '#bd853f', INK_DARK), // saffron (h 70)
  XAU: T('#d9ba70', '#ac8e44', INK_DARK), // gold
  XAG: T('#b8bec5', '#8d9399', INK_DARK), // silver
};
const DEFAULT_TINT = T('#6e8393', '#3e5361'); // slate (h 240)

export function fiatTint(code: string): FiatTint {
  return FIAT_TINTS[code.toUpperCase()] || DEFAULT_TINT;
}
