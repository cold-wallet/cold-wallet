import {useEffect, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import monobankApiClient from "../../../core/integrations/monobank/monobankApiClient";
import ApiResponse from "../../../core/domain/ApiResponse";
import MonobankPublicDataResponse from "../../../core/integrations/monobank/MonobankPublicDataResponse";
import FiatCurrency from "../../../core/fiatCurrencies/FiatCurrency";
import MonobankCurrencyResponse from "../../../core/integrations/monobank/MonobankCurrencyResponse";
import StorageFactory from "../../domain/StorageFactory";
import MonobankUserDataStorage from "./MonobankUserDataStorage";
import MonobankUserData from "./MonobankUserData";
import {createDemoMonobankAssets} from "../../utils/DemoAssetsGenerator";
import {RefreshTracker, useRetry, useScopedRunner} from "../../refresh/useRefreshTracker";
import {dueForPoll, FailKind, planManual, stateOf} from "../../refresh/refreshState";
import {DEMO_REFRESH_MS} from "../../refresh/demo";
import {MONOBANK, MONOBANK_MIN_GAP_MS, monobankLimits} from "../../refresh/scopeKeys";

const RATES_SCOPE = 'prices/monobank';
const USER_DATA_INTERVAL_MS = 5 * 60_000;
const RATES_INTERVAL_MS = 60_000;

/** A rejected token won't pass by itself; anything else (network, rate limit) is retried. */
export function monobankFailKind(code: number | undefined): FailKind {
    return code === 401 || code === 403 ? 'fatal' : 'retry';
}

const MonobankLoader = (
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    // Store for monobankUserData — in-memory during a demo session so injected demo assets
    // never persist. Rates/currencies stay on the (always-localStorage) storageFactory.
    userDataStorageFactory: StorageFactory,
    monobankIntegrationEnabled: boolean,
    monobankIntegrationToken: string | null,
    tracker: RefreshTracker,
) => {

    const [
        monobankRates,
        setMonobankRates
    ] = storageFactory.createStorageNullable<MonobankCurrencyResponse[]>("monobankRates");

    const [
        monobankCurrencies,
        setMonobankCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: FiatCurrency }>("monobankCurrencies");

    // the rates above may be the ones saved on an earlier visit; this says they were fetched now
    const [monobankRatesFresh, setMonobankRatesFresh] = useState(false);

    const ratesRunner = useScopedRunner(tracker, false);
    const loadMonobank = (manual = false) => ratesRunner([RATES_SCOPE], manual, async (_, settle) => {
        const response: ApiResponse<MonobankPublicDataResponse | any> = await monobankApiClient.fetchMonobankRatesAndCurrencies();
        if (response.success && response.result) {
            const result: MonobankPublicDataResponse = response.result;
            setMonobankRates(result.rates);
            setMonobankCurrencies(result.currencies);
            setMonobankRatesFresh(true);
            settle.ok(RATES_SCOPE);
        } else {
            console.warn('Error fetching rates from monobank:', response.error);
            settle.fail(RATES_SCOPE, response.error || 'Exchange rates did not load', 'retry');
        }
    });
    useEffect(() => { void loadMonobank(); }, []);
    useInterval(() => {
        if (dueForPoll(stateOf(tracker.current(), RATES_SCOPE), Date.now(), RATES_INTERVAL_MS)) void loadMonobank();
    }, RATES_INTERVAL_MS);
    useRetry(tracker, RATES_SCOPE, () => void loadMonobank(), () => MONOBANK_MIN_GAP_MS);

    /** Manual refresh of the exchange rates: at most once a minute, like every request. */
    const refreshMonobankRates = () => {
        const plan = planManual(tracker.current(), [RATES_SCOPE], Date.now(), monobankLimits);
        tracker.pulse(plan.fresh);
        return plan.fetch.length ? loadMonobank(true) : Promise.resolve();
    };

    const [
        monobankUserData,
        setMonobankUserData
    ] = MonobankUserDataStorage(userDataStorageFactory)

    const configured = monobankIntegrationEnabled && !!monobankIntegrationToken;
    const runner = useScopedRunner(tracker, true);
    const demoData = () => new MonobankUserData(
        "clientId",
        "name",
        "null",
        "null",
        createDemoMonobankAssets(),
        [],
    );

    const loadUserData = (manual: boolean): Promise<void> => {
        if (isDemoMode) {
            // the demo holdings stay as they are: the button just shows a refresh
            return runner([MONOBANK], manual, async (_, settle) => {
                await new Promise(r => setTimeout(r, DEMO_REFRESH_MS));
                settle.ok(MONOBANK);
            });
        }
        if (!configured || !loadingUserDataAllowed) {
            return Promise.resolve();
        }
        const token = monobankIntegrationToken as string;
        return runner([MONOBANK], manual, async (_, settle) => {
            const response: ApiResponse<MonobankUserData | any> = await monobankApiClient.getUserInfo(token);
            if (response.success && response.result) {
                setMonobankUserData(response.result);
                settle.ok(MONOBANK);
            } else {
                console.warn('Error fetching user data from monobank:', response.error);
                settle.fail(MONOBANK, response.error || 'Accounts did not load', monobankFailKind(response.code));
            }
        });
    };

    // polling every 5 minutes, never sooner than a minute after the previous request
    const loadMonobankUserData = () => {
        if (isDemoMode) {
            setMonobankUserData(demoData());
            return;
        }
        const s = stateOf(tracker.current(), MONOBANK);
        if (!dueForPoll(s, Date.now(), USER_DATA_INTERVAL_MS)
            || Date.now() - s.lastAttemptAt < MONOBANK_MIN_GAP_MS) {
            return;
        }
        void loadUserData(false);
    };
    useEffect(loadMonobankUserData, []);
    useInterval(loadMonobankUserData, USER_DATA_INTERVAL_MS);
    useRetry(tracker, MONOBANK, () => void loadUserData(false), () => MONOBANK_MIN_GAP_MS);

    useEffect(() => {
        if (!configured && !isDemoMode) tracker.forget(k => k === MONOBANK);
    }, [configured, isDemoMode]);

    /** Manual refresh: answered from data under a minute old, otherwise loaded once the minute since
     *  the previous request has passed (the button waits until then). */
    const refreshMonobank = (): Promise<void> => {
        if (!isDemoMode && !configured) return Promise.resolve();
        const plan = planManual(tracker.current(), [MONOBANK], Date.now(), monobankLimits);
        tracker.pulse(plan.fresh);
        return plan.fetch.length ? loadUserData(true) : Promise.resolve();
    };

    return {
        monobankRates,
        monobankCurrencies,
        monobankRatesFresh,
        monobankUserData,
        setMonobankUserData,
        loadMonobankUserData,
        refreshMonobank,
        refreshMonobankRates,
    }
}

export default MonobankLoader;
