# Bundled asset icons: sources and licences

Every icon here ships with the app and is served from the app's own origin. Nothing is
hot-linked from a CDN or third-party API at runtime. `scripts/asset-icons/build.mjs` regenerates
the folder from the exact package versions below.

| Folder | What | Source | Licence |
|---|---|---|---|
| `crypto/` | Coin logos ("background" tile variant), 260 files | [`@web3icons/core`](https://github.com/0xa3k5/web3icons) 4.0.61 | MIT, © 2024 0xa3k5 |
| `crypto/` | Coin logos (colour variant), 274 files, used where web3icons has no tile | [`cryptocurrency-icons`](https://github.com/spothq/cryptocurrency-icons) 0.18.1 | CC0 1.0 (public domain) |
| `source/` | Exchange / wallet marks (Binance, OKX, MetaMask, Kraken, Coinbase, Bybit, KuCoin, Gate, Bitget, Bitstamp, Bithumb, BtcTurk, CoinEx, Crypto.com, Gemini, Paradex, Upbit), plus WhiteBIT (WBT), MEXC (MX), Huobi/HTX (HT), Hyperliquid (HyperEVM) and HashKey from the token/network sets | `@web3icons/core` 4.0.61 | MIT, © 2024 0xa3k5 |
| `source/monobank.svg` | Plain "m" on black, drawn for this project | Cold Wallet | Same as this repository |

**Fiat currencies have no image files.** They are drawn at runtime as a tile with the currency
symbol (₴ € £ $ zł …), taken from the browser's built-in `Intl` data. See
`src/core/ui/fiatGlyph.ts`.

## Trademarks

Coin, exchange and wallet logos are trademarks of their owners. They are used here only to
identify which currency or integration a holding belongs to (nominative use). Using them does
not imply endorsement or affiliation. Monobank publishes no brand kit with usable terms, so its
badge is a self-drawn lettermark, not the official logo.

## MIT licence text (@web3icons/core)

```
MIT License

Copyright (c) 2024 0xa3k5

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
