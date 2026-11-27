// OnStartupLoader — when the market-data screen may give way to the dashboard, and whether prices
// are still being fetched. USD values need prices from Binance, OKX and Monobank's FX rates (every
// USD figure goes through them). The full-screen "Syncing market data" view is only for a wallet
// that opens with holdings on a device that has no prices yet (a first launch, an import): prices
// saved on an earlier visit are shown at once and refreshed quietly, an empty wallet has nothing to
// wait for, and the screen never stays longer than SYNC_SCREEN_MAX, so a slow, rate-limited or
// blocked source can't lock anyone out of their wallet. Once the wallet has been shown the screen
// doesn't come back (not for the first asset added either); holdings without a price say so.
// `syncing` (the "syncing…" label, "price loading…" on such holdings) lasts until every source has
// answered, but no longer than SYNC_GIVE_UP after the wallet opened: then a missing price is missing.
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
    /** prices from an earlier visit for each source (Binance, OKX, Monobank) */
    savedPricesAvailable: boolean,
    /** the wallet holds something a price is needed for */
    anyAssetExist: boolean,
    /** the wallet is open (unlocked, or the demo): the dashboard is what would be shown */
    walletOpen: boolean,
}

export default function OnStartupLoader(s: MarketSources) {
    const synced = s.binancePricesLoaded && s.binanceCurrenciesLoaded
        && s.okxPricesLoaded && s.okxCurrenciesLoaded
        && s.monobankRatesFresh;
    const waiting = s.walletOpen && s.anyAssetExist && !synced && !s.savedPricesAvailable;

    // the dashboard has been shown: the screen is done for good
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (shown || !s.walletOpen) return;
        if (!waiting) { setShown(true); return; }
        const t = setTimeout(() => setShown(true), SYNC_SCREEN_MAX);
        return () => clearTimeout(t);
    }, [shown, s.walletOpen, waiting]);

    const [gaveUp, setGaveUp] = useState(false);
    useEffect(() => {
        if (!s.walletOpen || gaveUp) return;
        const t = setTimeout(() => setGaveUp(true), SYNC_GIVE_UP);
        return () => clearTimeout(t);
    }, [s.walletOpen, gaveUp]);

    return {
        loaded: shown || !waiting,
        syncing: !synced && !gaveUp,
    }
}
