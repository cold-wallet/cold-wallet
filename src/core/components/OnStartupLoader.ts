// OnStartupLoader — when the market-data screen may give way to the dashboard, and how fresh the
// prices are. Prices come from Binance, OKX and Monobank (FX rates for fiat), plus CoinGecko for
// coins the exchanges don't list. The full-screen "Syncing market data" view is only for a
// dashboard that opens with holdings it can't price yet (a first launch, an import): prices saved
// on an earlier visit price holdings at once and are refreshed quietly, and the screen never stays
// longer than SYNC_SCREEN_MAX, so a slow, rate-limited or blocked source can't lock anyone out of
// their wallet. Once the dashboard has been shown the screen doesn't come back (not for the first
// asset added either); holdings without a price show that one is loading.
// `syncing`: not every source has answered yet, for at most SYNC_GIVE_UP after the dashboard
// opened. `stale`: past that, some source still hasn't answered, so values may rest on prices saved
// on an earlier visit.
import {useEffect, useState} from "react";

export const SYNC_SCREEN_MAX = 8_000;
export const SYNC_GIVE_UP = 60_000;

export interface MarketSources {
    binancePricesLoaded: boolean,
    binanceCurrenciesLoaded: boolean,
    okxPricesLoaded: boolean,
    okxCurrenciesLoaded: boolean,
    /** Monobank keeps its last rates on the device, so having them doesn't mean they are fresh */
    monobankRatesFresh: boolean,
    /** some holding has no price yet */
    pricesMissing: boolean,
    /** the dashboard is what the app shows (unlocked or demo, no PIN to set first) */
    dashboardOpen: boolean,
}

export default function OnStartupLoader(s: MarketSources) {
    const synced = s.binancePricesLoaded && s.binanceCurrenciesLoaded
        && s.okxPricesLoaded && s.okxCurrenciesLoaded
        && s.monobankRatesFresh;
    const waiting = s.dashboardOpen && s.pricesMissing && !synced;

    // the dashboard has been shown: the screen is done for good
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (shown || !s.dashboardOpen) return;
        if (!waiting) { setShown(true); return; }
        const t = setTimeout(() => setShown(true), SYNC_SCREEN_MAX);
        return () => clearTimeout(t);
    }, [shown, s.dashboardOpen, waiting]);

    const [gaveUp, setGaveUp] = useState(false);
    useEffect(() => {
        if (!s.dashboardOpen || gaveUp) return;
        const t = setTimeout(() => setGaveUp(true), SYNC_GIVE_UP);
        return () => clearTimeout(t);
    }, [s.dashboardOpen, gaveUp]);

    return {
        loaded: shown || !waiting,
        syncing: !synced && !gaveUp,
        stale: !synced && gaveUp,
    }
}
