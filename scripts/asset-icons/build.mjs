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
//   src/core/components/redesign/assetIcons.data.ts   the code lists the app looks up
//
// Fiat currencies have no image files: they are drawn as a currency-symbol tile at runtime
// (src/core/components/redesign/fiatGlyph.ts).
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
const DATA = path.join(ROOT, 'src/core/components/redesign/assetIcons.data.ts');

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
// own exchange token where that token's logo IS the exchange's mark (WhiteBIT/WBT, MEXC/MX,
// Huobi/HT) or the exchange's chain mark (Hyperliquid/HyperEVM, HashKey).
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
  whitebit: ['tokens/background', 'WBT'],
  mexc: ['tokens/background', 'MX'],
  huobi: ['tokens/background', 'HT'],
  hyperliquid: ['networks/background', 'hyper-evm'],
  hashkey: ['networks/background', 'hashkey'],
};

// No permissively licensed Monobank mark exists (it is a registered trademark with no public
// brand kit terms), so Monobank gets a plain self-drawn "m" on its black brand colour.
const MONOBANK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="#000"/>' +
  '<path d="M6.5 16.5v-5a2.5 2.5 0 0 1 5.5 0v5m0-5a2.5 2.5 0 0 1 5.5 0v5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
  fs.writeFileSync(path.join(dir, 'monobank.svg'), MONOBANK_SVG);
  done.push('monobank');
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
