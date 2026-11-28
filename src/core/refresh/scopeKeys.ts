// scopeKeys.ts — the refresh scope keys of each source and their rate limits (see refreshState.ts).
// Kept apart from the loaders so the UI and tests can use them without loading any integration.
import {BinanceSection, HEAVY_SECTIONS} from "../integrations/binance/binanceApiClient";
import {FRESH_MS} from "./refreshState";

export const BINANCE = 'binance';
export const binanceScope = (section: BinanceSection) => `${BINANCE}/${section}`;
export const binanceSectionOfScope = (key: string) => key.slice(BINANCE.length + 1) as BinanceSection;
const isHeavyScope = (key: string) => HEAVY_SECTIONS.includes(binanceSectionOfScope(key));
/** A manual refresh of a heavy (staking / Simple Earn) section is allowed once a minute. */
export const BINANCE_HEAVY_MANUAL_GAP_MS = 60_000;
export const binanceLimits = {
    freshMs: (key: string) => isHeavyScope(key) ? BINANCE_HEAVY_MANUAL_GAP_MS : FRESH_MS,
    minGapMs: (key: string) => isHeavyScope(key) ? BINANCE_HEAVY_MANUAL_GAP_MS : 0,
};

export const OKX = 'okx';
export const OKX_SPOT = `${OKX}/spot`;
export const OKX_SUB = `${OKX}/sub`;
export const okxCoinScope = (ccy: string) => `${OKX_SPOT}/${ccy}`;

export const MONOBANK = 'monobank';
// Monobank's personal API answers one request per 60 s (client-info); its public rates are cached
// for minutes on their side. Both are asked at most once a minute, a manual refresh included.
export const MONOBANK_MIN_GAP_MS = 60_000;
export const monobankLimits = {freshMs: () => MONOBANK_MIN_GAP_MS, minGapMs: () => MONOBANK_MIN_GAP_MS};

export const METAMASK = 'metamask';
/** A MetaMask holding's refresh scope (one token on one chain for one address). */
export const metaMaskScope = (assetId: string) => `${METAMASK}/${assetId}`;

/** An exchange's refresh scope: the same key as its source on the dashboard. */
export const ccxtScope = (exchange: string) => `ccxt:${exchange}`;

/** CoinGecko's keyless API rate-limits hard: after a failed request it is left alone this long. */
export const COINGECKO_FAILURE_PAUSE_MS = 60_000;
