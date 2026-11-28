import {useEffect, useRef, useState} from "react";
import binanceApiClient, {AccountInfo, BinanceSection, CORE_SECTIONS, HEAVY_SECTIONS, SpotAccount} from "../../../core/integrations/binance/binanceApiClient";
import {isRetryable} from "./proxyThrottle";
import {RefreshTracker, useRetry, useScopedRunner} from "../../refresh/useRefreshTracker";
import {dueForPoll, FailKind, planManual, stateOf} from "../../refresh/refreshState";
import {BINANCE, binanceLimits, binanceScope, binanceSectionOfScope} from "../../refresh/scopeKeys";
import {DEMO_REFRESH_MS} from "../../refresh/demo";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import {createDemoBinanceAssets} from "../../utils/DemoAssetsGenerator";

// Heavy (staking / simple-earn) sections change slowly and 429 the most — refresh them at most
// this often, while core balances refresh every 60s tick. Cuts heavy-endpoint proxy load ~5x.
const HEAVY_INTERVAL_MS = 5 * 60_000;
const CORE_INTERVAL_MS = 60_000;
const PRICES_INTERVAL_MS = 15_000;

const PRICES_SCOPE = 'prices/binance';
const PAIRS_SCOPE = 'prices/binance-markets';
const sectionOfScope = binanceSectionOfScope;
const isHeavy = (section: BinanceSection) => HEAVY_SECTIONS.includes(section);
const ALL: BinanceSection[] = [...CORE_SECTIONS, ...HEAVY_SECTIONS];

/** Retry or give up: a throttle or network error is retried. Any other error on the spot account
 *  means the keys don't work; on another section, that the key or account doesn't offer it. */
export function binanceFailKind(section: BinanceSection, e: unknown): FailKind {
    if (isRetryable(e)) return 'retry';
    return section === 'spot' ? 'fatal' : 'unavailable';
}

const message = (e: unknown) => (e as any)?.message || String(e);

const BinanceLoader = (
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    // Store for binanceUserData — in-memory during a demo session so injected demo assets
    // never persist. Prices/currencies stay on the (always-localStorage) storageFactory.
    userDataStorageFactory: StorageFactory,
    binanceIntegrationEnabled: boolean,
    binanceIntegrationApiKey: string | null,
    binanceIntegrationApiSecret: string | null,
    tracker: RefreshTracker,
) => {
    const [
        binancePrices,
        setBinancePrices
    ] = storageFactory.createStorageNullable<{ [p: string]: string }>("binancePrices");

    const [binancePricesLoaded, setBinancePricesLoaded] = useState(false);
    const pricesRunner = useScopedRunner(tracker, false);
    const loadBinancePrices = (manual = false) => pricesRunner([PRICES_SCOPE], manual, async (_, settle) => {
        const response: ApiResponse<{ [p: string]: string } | any> = await binanceApiClient.fetchBinancePrices();
        if (response.success) {
            setBinancePrices(response.result);
            setBinancePricesLoaded(true);
            settle.ok(PRICES_SCOPE);
        } else {
            console.warn('Error fetching prices from binance:', response);
            settle.fail(PRICES_SCOPE, response.error || 'Prices did not load', 'retry');
        }
    });
    useEffect(() => { void loadBinancePrices(); }, []);
    useInterval(() => {
        if (dueForPoll(stateOf(tracker.current(), PRICES_SCOPE), Date.now(), PRICES_INTERVAL_MS)) void loadBinancePrices();
    }, PRICES_INTERVAL_MS);

    const [
        binanceCurrencies,
        setBinanceCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: BinanceCurrencyResponse }>("binanceCurrencies");

    const [binanceCurrenciesLoaded, setBinanceCurrenciesLoaded] = useState(false);
    const loadBinanceCurrencies = (manual = false) => pricesRunner([PAIRS_SCOPE], manual, async (_, settle) => {
        const response: ApiResponse<{ [index: string]: BinanceCurrencyResponse } | any> = await binanceApiClient.fetchBinanceCurrencies();
        if (response.success) {
            setBinanceCurrencies(response.result);
            setBinanceCurrenciesLoaded(true);
            settle.ok(PAIRS_SCOPE);
        } else {
            console.warn('Error fetching currencies from binance:', response.error);
            settle.fail(PAIRS_SCOPE, response.error || 'Markets did not load', 'retry');
        }
    });
    useEffect(() => { void loadBinanceCurrencies(); }, []);
    useRetry(tracker, PRICES_SCOPE, () => void loadBinancePrices());
    useRetry(tracker, PAIRS_SCOPE, () => void loadBinanceCurrencies());

    /** Manual refresh of Binance's prices (and its market list, if it never loaded). */
    const refreshBinancePrices = () => {
        const keys = binanceCurrenciesLoaded ? [PRICES_SCOPE] : [PRICES_SCOPE, PAIRS_SCOPE];
        const plan = planManual(tracker.current(), keys, Date.now());
        tracker.pulse(plan.fresh);
        return Promise.all(plan.fetch.map(k => k === PAIRS_SCOPE ? loadBinanceCurrencies(true) : loadBinancePrices(true)))
            .then(() => undefined);
    };

    const [
        binanceUserData,
        setBinanceUserData
    ] = userDataStorageFactory.createStorageNullable<AccountInfo>("binanceUserData");

    // The latest balances, also between a set and the render that shows it: a queued run starts
    // from what the previous one loaded.
    const latest = useRef(binanceUserData);
    latest.current = binanceUserData;
    const store = (info: AccountInfo) => {
        latest.current = info;
        setBinanceUserData(info);
    };

    const configured = binanceIntegrationEnabled && !!binanceIntegrationApiKey && !!binanceIntegrationApiSecret;
    const runner = useScopedRunner(tracker, true);
    // What a queued load sends with: the keys as they are when it runs, not when it was queued
    // (new keys saved meanwhile must not be followed by a request with the old ones).
    const live = useRef({configured, allowed: loadingUserDataAllowed, key: binanceIntegrationApiKey, secret: binanceIntegrationApiSecret, binanceCurrencies});
    live.current = {configured, allowed: loadingUserDataAllowed, key: binanceIntegrationApiKey, secret: binanceIntegrationApiSecret, binanceCurrencies};

    /** Load `sections` (one proxy call each, queued behind any load already running). */
    const loadSections = (sections: BinanceSection[], manual: boolean): Promise<void> => {
        if (isDemoMode) {
            // the demo holdings stay as they are: the buttons just show a refresh
            return runner(sections.map(binanceScope), manual, async (keys, settle) => {
                await new Promise(r => setTimeout(r, DEMO_REFRESH_MS));
                keys.forEach(settle.ok);
            });
        }
        if (!configured || !binanceCurrencies || !loadingUserDataAllowed || !sections.length) {
            return Promise.resolve();
        }
        return runner(sections.map(binanceScope), manual, async (keys, settle) => {
            const now = live.current;
            if (!now.configured || !now.allowed || !now.binanceCurrencies) {
                keys.forEach(settle.skip);
                return;
            }
            await binanceApiClient.getUserInfoAsync(
                now.key as string, now.secret as string, now.binanceCurrencies, latest.current,
                new Set(keys.map(sectionOfScope)),
                (section, accountInfo, error) => {
                    // the wallet was locked or replaced meanwhile: its balances must not land
                    if (!settle.live()) {
                        settle.skip(binanceScope(section));
                    } else if (error) {
                        settle.fail(binanceScope(section), message(error), binanceFailKind(section, error));
                    } else {
                        store(accountInfo);
                        settle.ok(binanceScope(section));
                    }
                },
            );
        });
    };

    // Polling: core balances every minute; heavy sections every HEAVY_INTERVAL_MS (and on the first
    // load, so the initial view is complete). Sections that loaded meanwhile (a manual refresh) wait.
    let loadBinanceUserData = () => {
        if (isDemoMode) {
            store(new AccountInfo({
                accountType: "SPOT",
                balances: createDemoBinanceAssets()
            } as SpotAccount));
            return;
        }
        const now = Date.now();
        const status = tracker.current();
        const due = ALL.filter(section => {
            const s = stateOf(status, binanceScope(section));
            return isHeavy(section)
                ? s.running === 0 && now - s.lastAttemptAt >= HEAVY_INTERVAL_MS
                : dueForPoll(s, now, CORE_INTERVAL_MS);
        });
        void loadSections(due, false);
    };
    useEffect(loadBinanceUserData, []);
    // the market list arrives after the first render on a first visit: load as soon as it's here
    useEffect(() => { if (binanceCurrencies) loadBinanceUserData(); }, [!!binanceCurrencies]);
    useInterval(loadBinanceUserData, CORE_INTERVAL_MS);
    useRetry(tracker, BINANCE, keys => void loadSections(keys.map(sectionOfScope), false), binanceLimits.minGapMs);

    // switched off or keys removed: its refresh state goes too
    useEffect(() => {
        if (!configured && !isDemoMode) tracker.forget(k => k === BINANCE || k.startsWith(BINANCE + '/'));
    }, [configured, isDemoMode]);

    /** Manual refresh of `sections` (all by default): fresh ones answer at once, rate-limited ones
     *  wait, the rest load. */
    const refreshBinance = (sections: BinanceSection[] = ALL): Promise<void> => {
        if (!isDemoMode && !configured) return Promise.resolve();
        const plan = planManual(tracker.current(), sections.map(binanceScope), Date.now(), binanceLimits);
        tracker.pulse(plan.fresh);
        return loadSections(plan.fetch.map(sectionOfScope), true);
    };

    return {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
        loadBinanceUserData,
        refreshBinance,
        refreshBinancePrices,
    }
}

export default BinanceLoader;
