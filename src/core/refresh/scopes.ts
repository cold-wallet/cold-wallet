// scopes.ts — which refresh scope a holding belongs to, what each scope is called, and the rate
// limits the buttons respect. Only sources whose API can load part of an account get a per-holding
// button: Binance (a section), OKX (one coin of the trading account, or the sub-account) and
// MetaMask (one token). Monobank and the ccxt exchanges load everything in one request.
import AssetDTO from "../domain/AssetDTO";
import {AccountInfo, BINANCE_SECTION_LABELS, BinanceSection, binanceSectionOf} from "../integrations/binance/binanceApiClient";
import {okxAssetPart} from "../integrations/okx/okxApiClient";
import {
    BINANCE, binanceLimits, binanceScope, METAMASK, metaMaskScope, MONOBANK, MONOBANK_MIN_GAP_MS,
    OKX, OKX_SPOT, OKX_SUB, okxCoinScope,
} from "./scopeKeys";
import {isUnder} from "./refreshState";

/** The scope a holding's own refresh button loads (null: its source has no per-holding refresh). */
export function assetRefreshScope(asset: AssetDTO, binanceUserData: AccountInfo | null): string | null {
    if (asset.isBinanceAsset) {
        const section = binanceSectionOf(binanceUserData, asset.id);
        return section ? binanceScope(section) : null;
    }
    if (asset.isOkxAsset) {
        const part = okxAssetPart(asset.id);
        if (!part) return null;
        return part.part === 'spot' ? okxCoinScope(part.ccy) : OKX_SUB;
    }
    if (asset.isMetaMaskAsset) return metaMaskScope(asset.id);
    return null;
}

/** At most one request per this many ms (0: no limit). */
export function refreshMinGap(key: string): number {
    if (isUnder(key, MONOBANK) || key === 'prices/monobank') return MONOBANK_MIN_GAP_MS;
    if (isUnder(key, BINANCE)) return binanceLimits.minGapMs(key);
    return 0;
}

const SOURCE_LABELS: Record<string, string> = {
    [BINANCE]: 'Binance', [OKX]: 'OKX', [MONOBANK]: 'Monobank', [METAMASK]: 'MetaMask', prices: 'Prices',
};

/** The source a scope belongs to, as the dashboard names it. */
export function sourceLabelOf(key: string): string {
    if (key.startsWith('ccxt:')) {
        const name = key.slice(5);
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return SOURCE_LABELS[key.split('/')[0]] || key;
}

const PRICE_LABELS: Record<string, string> = {
    'prices/binance': 'Binance prices',
    'prices/binance-markets': 'Binance market list',
    'prices/okx': 'OKX prices',
    'prices/okx-markets': 'OKX market list',
    'prices/monobank': 'Monobank exchange rates',
    'prices/coingecko': 'CoinGecko prices',
    'prices/coingecko-list': 'CoinGecko coin list',
};

/** What a scope is called in a tooltip ("USDⓈ-M futures", "Sub-account", "BTC"). */
export function scopeLabel(key: string): string {
    if (PRICE_LABELS[key]) return PRICE_LABELS[key];
    if (key.startsWith(BINANCE + '/')) {
        return BINANCE_SECTION_LABELS[key.slice(BINANCE.length + 1) as BinanceSection] || key;
    }
    if (key === OKX_SPOT) return 'Trading account';
    if (key === OKX_SUB) return 'Sub-account';
    if (key.startsWith(OKX_SPOT + '/')) return key.slice(OKX_SPOT.length + 1);
    if (key.startsWith(METAMASK + '/')) {
        // "metamask <SYMBOL> <chain> <address>"
        const [, symbol, chain] = key.slice(METAMASK.length + 1).split(' ');
        return symbol && chain ? `${symbol} on ${chain}` : sourceLabelOf(key);
    }
    return sourceLabelOf(key);
}
