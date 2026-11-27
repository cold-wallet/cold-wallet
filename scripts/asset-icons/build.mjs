#!/usr/bin/env node
// scripts/asset-icons/build.mjs — regenerates the bundled currency/source icons.
//
// The icons are copied ONCE into public/asset-icons/ and committed, so the app never fetches
// an icon from a CDN or third-party API at runtime (Cold Wallet is local-only). This script is
// only needed to refresh or extend that set. It reads the unpacked npm tarballs (no install,
// no code from the packages is executed — SVG strings are parsed out of the files as text):
//
//   mkdir /tmp/icons && cd /tmp/icons
//   npm pack @web3icons/core@4.0.61 cryptocurrency-icons@0.18.1
//   for f in *.tgz; do mkdir "${f%.tgz}" && tar -xzf "$f" -C "${f%.tgz}"; done
//   node scripts/asset-icons/build.mjs /tmp/icons
//
// Output:
//   public/asset-icons/crypto/<code>.svg   coin logos (web3icons "background" tiles, else
//                                          cryptocurrency-icons colour icons)
//   public/asset-icons/source/<key>.svg    integration / exchange marks
//   src/core/ui/assetIcons.data.ts   the code lists the app looks up
//
// Fiat currencies have no image files: they are drawn as a currency-symbol tile at runtime
// (src/core/ui/fiatGlyph.ts).
//
// Sources and licences: public/asset-icons/LICENSES.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PKGS = process.argv[2];
if (!PKGS) {
  console.error('usage: node scripts/asset-icons/build.mjs <dir with unpacked tarballs>');
  process.exit(1);
}
const pkgDir = (prefix) => {
  const d = fs.readdirSync(PKGS).find((n) => n.startsWith(prefix) && !n.endsWith('.tgz'));
  if (!d) throw new Error(`missing unpacked ${prefix}* in ${PKGS}`);
  return path.join(PKGS, d, 'package');
};
const W3 = path.join(pkgDir('web3icons-core-'), 'dist/svgs');
const CI = pkgDir('cryptocurrency-icons-');

const OUT = path.join(ROOT, 'public/asset-icons');
const DATA = path.join(ROOT, 'src/core/ui/assetIcons.data.ts');

/** Pull the SVG markup out of a web3icons `var X = '<svg …>'` module without executing it. */
function w3svg(file) {
  if (!fs.existsSync(file)) return null;
  const m = fs.readFileSync(file, 'utf8').match(/=\s*'((?:[^'\\]|\\.)*)'/s);
  if (!m) return null;
  return m[1].replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c));
}
const readSvg = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
/** Light minify: drop XML prolog/comments and whitespace between tags. */
const minify = (svg) =>
  svg.replace(/<\?xml[^>]*>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

function resetDir(d) {
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
}
const fileCode = (code) => code.toLowerCase();
const isSafeCode = (code) => /^[A-Z0-9]{1,12}$/.test(code);

// ---------------------------------------------------------------- crypto
// Every coin in cryptocurrency-icons' curated manifest, plus newer / commonly held ones it lacks.
const EXTRA_CRYPTO = `
  TON XAUT PAXG ARB OP SUI APT PEPE WLD TIA SEI INJ JUP BONK WIF FDUSD PYUSD TUSD USDE ENA STRK
  IMX RENDER RNDR FET NEAR ATOM AVAX POL MATIC SHIB LINK UNI LTC BCH ETC TRX HBAR ICP FIL VET ALGO
  EGLD XTZ EOS AAVE MKR LDO CRV GRT SAND MANA AXS CHZ KAS OKB CRO KCS GT LEO WBT MX HT BGB NOT DOGS
  TRUMP ONDO JTO PYTH W ZRO EIGEN ETHFI PENDLE GMX DYDX RUNE STX FLOKI WLFI USD1 RLUSD EURC EURT
  WBTC WETH STETH WSTETH RETH CBBTC TBTC USDS SUSDE FRAX LUSD GHO CAKE OM QNT FLR MNT BERA S
  XDC IOTA NEO KAIA ROSE THETA FTM SONIC ZEC DASH XMR DOGE ADA SOL DOT XRP XLM BNB BTC ETH USDT USDC DAI
`.split(/\s+/).filter(Boolean);
// Coins whose web3icons mark lives under networks/ rather than tokens/.
const CRYPTO_FROM_NETWORK = { TON: 'ton', S: 'sonic', SONIC: 'sonic', KAIA: 'kaia', BERA: 'berachain', MNT: 'mantle' };

function buildCrypto() {
  const dir = path.join(OUT, 'crypto');
  resetDir(dir);
  const manifest = JSON.parse(fs.readFileSync(path.join(CI, 'manifest.json'), 'utf8'));
  const codes = [...new Set([...manifest.map((m) => m.symbol.toUpperCase()), ...EXTRA_CRYPTO])].filter(isSafeCode);
  const done = [];
  const round = []; // cryptocurrency-icons are circles with transparent corners
  const from = { web3icons: 0, 'cryptocurrency-icons': 0 };
  for (const code of codes.sort()) {
    let svg = w3svg(path.join(W3, 'tokens/background', code + '.svg.js'));
    let src = 'web3icons';
    if (!svg && CRYPTO_FROM_NETWORK[code]) svg = w3svg(path.join(W3, 'networks/background', CRYPTO_FROM_NETWORK[code] + '.svg.js'));
    if (!svg) {
      svg = readSvg(path.join(CI, 'svg/color', code.toLowerCase() + '.svg'));
      src = 'cryptocurrency-icons';
    }
    if (!svg) continue;
    fs.writeFileSync(path.join(dir, fileCode(code) + '.svg'), minify(svg));
    from[src]++;
    done.push(code);
    if (src === 'cryptocurrency-icons') round.push(code);
  }
  console.log(`crypto: ${done.length} icons`, from);
  return { done, round };
}

// ---------------------------------------------------------------- sources
// key → [web3icons folder, file]. Exchanges without an exchange mark in web3icons use their
// own exchange token where that token's logo IS the exchange's mark (MEXC/MX, Huobi/HT) or the
// exchange's chain mark (Hyperliquid/HyperEVM, HashKey). WhiteBIT and Monobank are below.
const SOURCES = {
  binance: ['exchanges/background', 'binance'],
  okx: ['exchanges/background', 'okx'],
  metamask: ['wallets/background', 'metamask'],
  bitget: ['exchanges/background', 'bitget'],
  bithumb: ['exchanges/background', 'bithumb'],
  bitstamp: ['exchanges/background', 'bitstamp'],
  btcturk: ['exchanges/background', 'btcturk'],
  bybit: ['exchanges/background', 'bybit'],
  coinbase: ['exchanges/background', 'coinbase'],
  coinex: ['exchanges/background', 'coinex'],
  cryptocom: ['exchanges/background', 'crypto-com'],
  gate: ['exchanges/background', 'gate-io'],
  gemini: ['exchanges/background', 'gemini'],
  kraken: ['exchanges/background', 'kraken'],
  kucoin: ['exchanges/background', 'kucoin'],
  paradex: ['exchanges/background', 'paradex'],
  upbit: ['exchanges/background', 'upbit'],
  mexc: ['tokens/background', 'MX'],
  huobi: ['tokens/background', 'HT'],
  hyperliquid: ['networks/background', 'hyper-evm'],
  hashkey: ['networks/background', 'hashkey'],
};

// Marks web3icons doesn't have, taken from the companies' own websites (the logo in the site
// header) and placed on a 24×24 tile: WhiteBIT's mark in black on white, as in its favicon;
// Monobank's "mono" wordmark in white on the dark tile of its app icon.
const WHITEBIT_MARK =
  'M11.937 5.266h6.379C18.316 2.36 20.68 0 23.599 0h6.415l-5.2 5.266V24H15.1c-5.284.012-9.57-4.243-9.57-9.503v-3.965H.203c0-2.911 2.365-5.266 5.284-5.266h.036C5.523 2.36 7.888 0 10.806 0h6.415zm6.166 5.817a2 2 0 0 0 0 2.833c.784.78 2.061.78 2.846 0z' +
  'M.2 10.635c0-2.986 2.425-5.4 5.418-5.4l.044 5.4z';
const MONO_WORDMARK =
  'M21.82 20.08V9.58c0-2.99-1.59-4.4-4.26-4.4a6.15 6.15 0 0 0-4.98 2.65c-.54-1.66-1.9-2.65-4.03-2.65a6.34 6.34 0 0 0-4.74 2.25v-1.9H0v14.55h3.81v-9.79c.57-.8 1.68-1.71 3-1.71 1.56 0 2.16.96 2.16 2.32v9.18h3.85v-9.82a3.85 3.85 0 0 1 3-1.68c1.56 0 2.16.96 2.16 2.32v9.18h3.84Zm10.46.36c4.8 0 7.69-3.5 7.69-7.65 0-4.12-2.88-7.61-7.69-7.61-4.77 0-7.65 3.49-7.65 7.61 0 4.16 2.88 7.65 7.65 7.65Zm0-3.4c-2.37 0-3.69-1.96-3.69-4.25 0-2.25 1.32-4.21 3.7-4.21 2.37 0 3.72 1.96 3.72 4.21 0 2.29-1.35 4.25-3.73 4.25Zm24.12 3.04V9.8c0-2.83-1.54-4.63-4.72-4.63a6.63 6.63 0 0 0-5.07 2.25v-1.9H42.8v14.55h3.8v-9.79a4.13 4.13 0 0 1 3.31-1.71c1.62 0 2.67.7 2.67 2.7v8.8h3.81Zm10.5.36c4.8 0 7.69-3.5 7.69-7.65 0-4.12-2.88-7.61-7.69-7.61-4.77 0-7.65 3.49-7.65 7.61 0 4.16 2.88 7.65 7.65 7.65Zm0-3.4c-2.37 0-3.69-1.96-3.69-4.25 0-2.25 1.32-4.21 3.7-4.21 2.36 0 3.71 1.96 3.71 4.21 0 2.29-1.35 4.25-3.72 4.25Z';
const OWN_SOURCES = {
  whitebit:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/>' +
    `<path fill="#000" transform="translate(4.9 6.36) scale(.47)" d="${WHITEBIT_MARK}"/></svg>`,
  monobank:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><defs><linearGradient id="mono__bg" x1="0" x2="0" y1="0" y2="1">' +
    '<stop offset="0" stop-color="#30333f"/><stop offset="1" stop-color="#1b1c22"/></linearGradient></defs><rect width="24" height="24" fill="url(#mono__bg)"/>' +
    `<path fill="#fff" transform="translate(3.5 9.08) scale(.228)" d="${MONO_WORDMARK}"/></svg>`,
};

function buildSources() {
  const dir = path.join(OUT, 'source');
  resetDir(dir);
  const done = [];
  for (const [key, [folder, file]] of Object.entries(SOURCES)) {
    const svg = w3svg(path.join(W3, folder, file + '.svg.js'));
    if (!svg) throw new Error(`source icon missing: ${key} (${folder}/${file})`);
    fs.writeFileSync(path.join(dir, key + '.svg'), minify(svg));
    done.push(key);
  }
  for (const [key, svg] of Object.entries(OWN_SOURCES)) {
    fs.writeFileSync(path.join(dir, key + '.svg'), svg);
    done.push(key);
  }
  console.log(`sources: ${done.length} icons`);
  return done.sort();
}

const { done: crypto, round: roundCrypto } = buildCrypto();
const sources = buildSources();

const list = (arr) => {
  const lines = [];
  let line = '';
  for (const c of arr) {
    const tok = `'${c}',`;
    if ((line + ' ' + tok).length > 98) { lines.push(line); line = tok; } else line = line ? line + ' ' + tok : tok;
  }
  if (line) lines.push(line);
  return lines.map((l) => '  ' + l).join('\n');
};
fs.writeFileSync(
  DATA,
  `// GENERATED by scripts/asset-icons/build.mjs — do not edit by hand.
// Codes that have a bundled SVG under public/asset-icons/ (licences: public/asset-icons/LICENSES.md).
// Kept as plain code lists so the main chunk carries a few KB of strings, not the SVGs themselves;
// each icon is a separate same-origin file the browser fetches only when a row shows it.

/** Crypto tickers with an icon at asset-icons/crypto/<code>.svg (lower-case file name). */
export const CRYPTO_ICON_CODES: readonly string[] = [
${list(crypto)}
];

/** Source keys with a mark at asset-icons/source/<key>.svg. */
export const SOURCE_ICON_KEYS: readonly string[] = [
${list(sources)}
];

/** Crypto icons drawn as a circle with transparent corners (cryptocurrency-icons); the chip
 *  scales them up so the circle fills its rounded-square tile like the web3icons tiles do. */
export const ROUND_CRYPTO_ICON_CODES: readonly string[] = [
${list(roundCrypto)}
];
`,
);
console.log('wrote', path.relative(ROOT, DATA));
