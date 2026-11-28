import {useEffect, useRef, useState} from "react";
import okxApiClient, {OkxAccount, withOkxSpotCurrency} from "./okxApiClient";
import {RefreshTracker, useRetry, useScopedRunner} from "../../refresh/useRefreshTracker";
import {dueForPoll, FailKind, planManual, stateOf} from "../../refresh/refreshState";
import {DEMO_REFRESH_MS} from "../../refresh/demo";
import {OKX, OKX_SPOT, OKX_SUB} from "../../refresh/scopeKeys";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import OkxCurrencyResponse from "./OkxCurrencyResponse";
import {createDemoOkxAssets} from "../../utils/DemoAssetsGenerator";

const PRICES_SCOPE = 'prices/okx';
const PAIRS_SCOPE = 'prices/okx-markets';
const USER_DATA_INTERVAL_MS = 60_000;
const PRICES_INTERVAL_MS = 15_000;

// OKX error codes worth retrying: rate limit, system busy, service unavailable, timeouts.
const RETRYABLE_OKX_CODES = new Set(['50001', '50004', '50011', '50013', '50026', '50102']);

/** Retry or give up. Network errors and throttling are retried. Any other error on the trading
 *  account means the keys don't work; on the sub-account or a single coin, that it isn't there. */
export function okxFailKind(scope: string, e: unknown): FailKind {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as any).code) : '';
    const apiError = /^\d+$/.test(code);
    if (typeof e !== 'string' && (!apiError || RETRYABLE_OKX_CODES.has(code))) return 'retry';
    return scope === OKX_SPOT ? 'fatal' : 'unavailable';
}
const message = (e: unknown) => (e as any)?.msg || (e as any)?.message || String(e);

const OkxLoader = (
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    // Store for okxUserData — in-memory during a demo session so injected demo assets never
    // persist. Prices/currencies stay on the (always-localStorage) storageFactory.
    userDataStorageFactory: StorageFactory,
    okxIntegrationEnabled: boolean,
    okxIntegrationApiKey: string | null,
    okxIntegrationApiSecret: string | null,
    okxIntegrationPassPhrase: string | null,
    okxIntegrationSubAccountName: string | null,
    tracker: RefreshTracker,
) => {
    const [
        okxPrices,
        setOkxPrices
    ] = storageFactory.createStorageNullable<{ [p: string]: string }>("okxPrices");

    const [okxPricesLoaded, setOkxPricesLoaded] = useState(false);
    const pricesRunner = useScopedRunner(tracker, false);
    const loadOkxPrices = (manual = false) => pricesRunner([PRICES_SCOPE], manual, async (_, settle) => {
        const response: ApiResponse<{ [p: string]: string } | any> = await okxApiClient.fetchPrices();
        if (response.success) {
            setOkxPrices(response.result);
            setOkxPricesLoaded(true);
            settle.ok(PRICES_SCOPE);
        } else {
            console.warn('Error fetching prices from okx:', response);
            settle.fail(PRICES_SCOPE, response.error || 'Prices did not load', 'retry');
        }
    });
    useEffect(() => { void loadOkxPrices(); }, []);
    useInterval(() => {
        if (dueForPoll(stateOf(tracker.current(), PRICES_SCOPE), Date.now(), PRICES_INTERVAL_MS)) void loadOkxPrices();
    }, PRICES_INTERVAL_MS);

    const [
        okxCurrencies,
        setOkxCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: OkxCurrencyResponse }>("okxCurrencies");

    const [okxCurrenciesLoaded, setOkxCurrenciesLoaded] = useState(false);
    const loadOkxCurrencies = (manual = false) => pricesRunner([PAIRS_SCOPE], manual, async (_, settle) => {
        const response: ApiResponse<{ [index: string]: OkxCurrencyResponse } | any> = await okxApiClient.fetchCurrencies();
        if (response.success) {
            setOkxCurrencies(response.result);
            setOkxCurrenciesLoaded(true);
            settle.ok(PAIRS_SCOPE);
        } else {
            console.warn('Error fetching currencies from okx:', response.error);
            settle.fail(PAIRS_SCOPE, response.error || 'Markets did not load', 'retry');
        }
    });
    useEffect(() => { void loadOkxCurrencies(); }, []);
    useRetry(tracker, PRICES_SCOPE, () => void loadOkxPrices());
    useRetry(tracker, PAIRS_SCOPE, () => void loadOkxCurrencies());

    /** Manual refresh of OKX's prices (and its market list, if it never loaded). */
    const refreshOkxPrices = () => {
        const keys = okxCurrenciesLoaded ? [PRICES_SCOPE] : [PRICES_SCOPE, PAIRS_SCOPE];
        const plan = planManual(tracker.current(), keys, Date.now());
        tracker.pulse(plan.fresh);
        return Promise.all(plan.fetch.map(k => k === PAIRS_SCOPE ? loadOkxCurrencies(true) : loadOkxPrices(true)))
            .then(() => undefined);
    };

    const [
        okxUserData,
        setOkxUserData
    ] = userDataStorageFactory.createStorageNullable<OkxAccount>("okxUserData");

    // the latest balances, also between a set and the render that shows it
    const latest = useRef(okxUserData);
    latest.current = okxUserData;
    const store = (account: OkxAccount) => {
        latest.current = account;
        setOkxUserData(account);
    };

    const configured = okxIntegrationEnabled && !!okxIntegrationApiKey && !!okxIntegrationApiSecret
        && !!okxIntegrationPassPhrase;
    const runner = useScopedRunner(tracker, true);
    const parts = () => okxIntegrationSubAccountName ? [OKX_SPOT, OKX_SUB] : [OKX_SPOT];
    // what a queued load sends with: the settings as they are when it runs, not when it was queued
    const settingsNow = {
        configured, allowed: loadingUserDataAllowed, okxCurrencies, sub: okxIntegrationSubAccountName,
        credentials: {
            apiKey: okxIntegrationApiKey as string,
            apiSecret: okxIntegrationApiSecret as string,
            apiPass: okxIntegrationPassPhrase as string,
        },
    };
    const live = useRef(settingsNow);
    live.current = settingsNow;

    /** Load these scopes (the trading account, the sub-account, single coins), one after another. */
    const loadScopes = (keys: string[], manual: boolean): Promise<void> => {
        if (isDemoMode) {
            // the demo holdings stay as they are: the buttons just show a refresh
            return runner(keys, manual, async (todo, settle) => {
                await new Promise(r => setTimeout(r, DEMO_REFRESH_MS));
                todo.forEach(settle.ok);
            });
        }
        if (!configured || !okxCurrencies || !loadingUserDataAllowed || !keys.length) {
            return Promise.resolve();
        }
        return runner(keys, manual, async (todo, settle) => {
            const {configured: on, allowed, okxCurrencies, sub, credentials} = live.current;
            if (!on || !allowed || !okxCurrencies) {
                todo.forEach(settle.skip);
                return;
            }
            for (const key of todo) {
                try {
                    if (key === OKX_SUB && !sub) { settle.skip(key); continue; }
                    const ccy = key === OKX_SPOT || key === OKX_SUB ? undefined : key.slice(OKX_SPOT.length + 1);
                    const balances = key === OKX_SUB
                        ? await okxApiClient.fetchSubAccountBalances(credentials, sub as string, okxCurrencies)
                        : await okxApiClient.fetchSpotBalances(credentials, okxCurrencies, ccy);
                    // the wallet was locked or replaced meanwhile: its balances must not land
                    if (!settle.live()) { settle.skip(key); continue; }
                    if (key === OKX_SPOT) store({...(latest.current || new OkxAccount()), spotAccountBalances: balances});
                    else if (key === OKX_SUB) store({...(latest.current || new OkxAccount()), subAccountBalances: balances});
                    else store(withOkxSpotCurrency(latest.current, ccy as string, balances));
                    settle.ok(key);
                } catch (e) {
                    console.warn(`failed to load ${key} from OKX`, e);
                    settle.fail(key, message(e), okxFailKind(key, e));
                }
            }
        });
    };

    // polling every minute; parts that loaded meanwhile (a manual refresh) wait for the next tick
    let loadOkxUserData = () => {
        if (isDemoMode) {
            store(new OkxAccount(createDemoOkxAssets()));
            return;
        }
        const now = Date.now();
        const status = tracker.current();
        void loadScopes(parts().filter(k => dueForPoll(stateOf(status, k), now, USER_DATA_INTERVAL_MS)), false);
    };
    useEffect(loadOkxUserData, []);
    useEffect(() => { if (okxCurrencies) loadOkxUserData(); }, [!!okxCurrencies]);
    useInterval(loadOkxUserData, USER_DATA_INTERVAL_MS);
    useRetry(tracker, OKX, keys => void loadScopes(keys, false));

    useEffect(() => {
        if (!configured && !isDemoMode) tracker.forget(k => k === OKX || k.startsWith(OKX + '/'));
    }, [configured, isDemoMode]);
    useEffect(() => {
        if (!okxIntegrationSubAccountName) tracker.forget(k => k === OKX_SUB);
    }, [okxIntegrationSubAccountName]);

    /** Manual refresh of OKX scopes (default: everything); fresh ones answer at once. */
    const refreshOkx = (keys: string[] = parts()): Promise<void> => {
        if (!isDemoMode && !configured) return Promise.resolve();
        const plan = planManual(tracker.current(), keys, Date.now());
        tracker.pulse(plan.fresh);
        return loadScopes(plan.fetch, true);
    };

    return {
        okxPrices, okxPricesLoaded,
        okxCurrencies, okxCurrenciesLoaded,
        okxUserData, setOkxUserData,
        loadOkxUserData,
        refreshOkx,
        refreshOkxPrices,
    }
}

export default OkxLoader;
