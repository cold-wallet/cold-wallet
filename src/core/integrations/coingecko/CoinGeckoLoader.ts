import {useEffect, useMemo, useRef, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import apiClient from "./apiClient";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";
import {RefreshTracker, useRetry} from "../../refresh/useRefreshTracker";
import {planManual} from "../../refresh/refreshState";
import {COINGECKO_FAILURE_PAUSE_MS} from "../../refresh/scopeKeys";

const PRICES_SCOPE = 'prices/coingecko';
// The held coins can change several times while a wallet opens (manual holdings first, then each
// integration's balances). Wait this long for them to settle, so opening sends one request, not a
// burst that the keyless API answers with 429s.
const NEEDED_SETTLE_MS = 500;
// a request for coins added while another one was on its way follows it after this gap
const FOLLOW_UP_GAP_MS = 1_000;
const LIST_SCOPE = 'prices/coingecko-list';

/** Progress of the background price catalogue (prices of every listed coin, for the coin picker). */
export interface CatalogueProgress {
    done: number;
    total: number;
}

const name = "coingecko"
const subCurrencies = ["btc", "eur", "uah", "usd", "xag", "xau", "xdr"]

// CoinGecko's keyless API allows only a handful of requests per minute, and its 429
// responses carry no CORS headers (browsers report them as CORS errors). So instead of
// sweeping all ~13k coins in 500-id batches every 5s, send ONE request per tick:
// the prices we actually display (held assets + picker favourites — always fresh) plus a
// slice of the full list, so the long tail gets pre-warmed in memory for the session.
// Only the held/needed prices are persisted (the full map is ~2MB → localStorage quota).
const POPULAR_SYMBOLS = ["USDT", "BTC", "ETH"];
const TICK_MS = 30_000;
const SWEEP_BATCH = 500;
const SWEEP_COOLDOWN_MS = 30 * 60_000; // pause between full sweeps
const FAILURE_PAUSE_MS = COINGECKO_FAILURE_PAUSE_MS; // back off after any failure (rate limit etc.)
const CURRENCIES_TTL_MS = 7 * 24 * 3_600_000;
const FAILURES_BEFORE_GIVING_UP = 3;

export default function CoinGeckoLoader(
    storageFactory: StorageFactory,
    neededSymbols: string[],
    tracker: RefreshTracker,
) {
    const [
        coinGeckoCurrencies,
        setCoinGeckoCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: CoinGeckoCurrencyResponse }>("coinGeckoCurrencies");
    const [
        coinGeckoCurrenciesFetchedAt,
        setCoinGeckoCurrenciesFetchedAt
    ] = storageFactory.createStorage<number>("coinGeckoCurrenciesFetchedAt", () => 0);

    // the directory request failed (it isn't retried this session): no CoinGecko price is coming
    const [currenciesFailed, setCurrenciesFailed] = useState(false);

    let loadCoinGeckoCurrencies = () => {
        // Sentinel: the corrected map resolves BTC to "bitcoin", and now carries per-chain
        // `platforms` (added for the MetaMask token scan). Check platforms on USDT, not BTC —
        // Bitcoin has no EVM contract so its `platforms` is legitimately absent. A cached map
        // missing either marker is an older schema → refetch even within the weekly TTL.
        const corrected = coinGeckoCurrencies
            && coinGeckoCurrencies["BTC"]?.id === "bitcoin"
            && !!coinGeckoCurrencies["USDT"]?.platforms;
        // the 13k-coin directory rarely changes — refetch at most weekly
        if (corrected && Object.keys(coinGeckoCurrencies!).length
            && (Date.now() - coinGeckoCurrenciesFetchedAt) < CURRENCIES_TTL_MS) {
            return
        }
        const ticket = tracker.begin([LIST_SCOPE], false);
        apiClient.fetchCurrencies()
            .then((response: ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>) => {
                if (response.success) {
                    setCoinGeckoCurrencies(response.result);
                    setCoinGeckoCurrenciesFetchedAt(Date.now());
                    tracker.succeed(ticket, LIST_SCOPE);
                } else {
                    setCurrenciesFailed(true);
                    // not retried this session (see currenciesFailed): nothing to wait for
                    tracker.fail(ticket, LIST_SCOPE, response.error || 'Coin list did not load', 'unavailable');
                    console.warn(`Error fetching currencies from ${name}:`, response.error);
                }
            });
    };
    useEffect(loadCoinGeckoCurrencies, []);

    // Persist ONLY the held/needed prices (small). The full sweep is ~2MB and blew the
    // localStorage quota, yet PriceService only ever looks up held-asset + cross-rate symbols.
    const [
        persistedPrices,
        setPersistedPrices
    ] = storageFactory.createStorage<CoinGeckoPriceResponse>("coinGeckoPrices", () => {
        return {} as CoinGeckoPriceResponse
    });
    // The full price map lives in memory for the session (so the picker / charts see swept
    // long-tail prices too); held prices are seeded from the small persisted cache on reload.
    const [coinGeckoPrices, setCoinGeckoPrices] = useState<CoinGeckoPriceResponse>(() => persistedPrices);
    const [coinGeckoPricesLoaded, setCoinGeckoPricesLoaded] = useState(false);

    // Which coins a price may still come for: CoinGecko hasn't answered a request that included
    // them yet. A coin it answered without a price, or one it doesn't list, has no price coming;
    // after FAILURES_BEFORE_GIVING_UP failed requests in a row it stops claiming one is on the way.
    const [answered, setAnswered] = useState<Set<string>>(() => new Set());
    const [failuresInRow, setFailuresInRow] = useState(0);

    const [sweepIndex, setSweepIndex] = useState(0);
    const pauseUntil = useRef(0);
    const sweepCooldownUntil = useRef(0);

    const neededSet = useMemo(() => {
        const set = new Set<string>(POPULAR_SYMBOLS);
        neededSymbols.forEach(s => set.add(s.toUpperCase()));
        return set;
    }, [neededSymbols.join(',')]);

    // The subset of prices worth persisting — held assets + cross-rate favourites. Prices are
    // keyed by lowercase symbol; neededSet is uppercase.
    const pickNeeded = (full: CoinGeckoPriceResponse): CoinGeckoPriceResponse => {
        const subset = {} as CoinGeckoPriceResponse;
        neededSet.forEach(sym => {
            const k = sym.toLowerCase();
            if (full[k]) subset[k] = full[k];
        });
        return subset;
    };

    // the latest values, for a follow-up request or a retry that runs after a later render
    const neededRef = useRef(neededSet);
    neededRef.current = neededSet;
    const pricesRef = useRef(coinGeckoPrices);
    pricesRef.current = coinGeckoPrices;
    // One request for the held coins at a time: another one asked for meanwhile follows it.
    const inFlight = useRef(false);
    const followUp = useRef(false);
    const followUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // no follow-up after the dashboard is gone
    useEffect(() => () => { if (followUpTimer.current) clearTimeout(followUpTimer.current); }, []);

    // One request: prices for `symbols`, optionally advancing the background sweep cursor.
    // `track`: it carries the held coins' prices, so the refresh buttons show it (a single coin
    // prefetched for the add-asset dialog doesn't count); only one such request runs at a time.
    // `queue`: if one is already on its way, send this one after it (new coins to price) instead
    // of dropping it (a polling tick, a click: the request on its way already covers them).
    const fetchPrices = (symbols: Set<string>, {sweep: advanceSweep = false, track = false, manual = false, queue = false} = {}): Promise<void> => {
        if (!coinGeckoCurrencies || Date.now() < pauseUntil.current) {
            return Promise.resolve()
        }
        if (track && inFlight.current) {
            if (queue) followUp.current = true;
            return Promise.resolve()
        }
        const toLoad = {} as { [index: string]: CoinGeckoCurrencyResponse };
        Object.entries(coinGeckoCurrencies).forEach(([ticker, currency]) => {
            if (symbols.has(ticker)) {
                toLoad[ticker] = currency
            }
        });

        let nextIndex = sweepIndex;
        if (advanceSweep && Date.now() >= sweepCooldownUntil.current) {
            const entries = Object.entries(coinGeckoCurrencies);
            const slice = entries.slice(sweepIndex, sweepIndex + SWEEP_BATCH);
            slice.forEach(([ticker, currency]) => toLoad[ticker] = currency);
            nextIndex = sweepIndex + slice.length;
            if (nextIndex >= entries.length) {
                nextIndex = 0;
                sweepCooldownUntil.current = Date.now() + SWEEP_COOLDOWN_MS;
            }
        }

        if (!Object.keys(toLoad).length) {
            return Promise.resolve()
        }
        const ticket = track ? tracker.begin([PRICES_SCOPE], manual) : 0;
        if (track) inFlight.current = true;
        return apiClient.fetchPrices(toLoad, subCurrencies)
            .then((response: ApiResponse<CoinGeckoPriceResponse | any>) => {
                if (response.success) {
                    if (track) tracker.succeed(ticket, PRICES_SCOPE);
                    setFailuresInRow(0);
                    setAnswered((prev) => {
                        const next = new Set(prev);
                        Object.keys(toLoad).forEach((ticker) => next.add(ticker));
                        return next;
                    });
                    const merged = {...pricesRef.current, ...(response.result)};
                    pricesRef.current = merged;
                    setCoinGeckoPrices(merged)             // full map, in memory only
                    setPersistedPrices(pickNeeded(merged)) // small held subset, persisted
                    setCoinGeckoPricesLoaded(true)
                    if (advanceSweep) {
                        setSweepIndex(nextIndex)
                        const total = Object.keys(coinGeckoCurrencies).length;
                        const at = nextIndex || total;
                        console.log(`coingecko sweep at ${at} of ${total} (${(at * 100 / total).toFixed(1)}%)`)
                    }
                } else {
                    if (track) {
                        // after a few failures in a row the buttons stop waiting for it (polling goes on)
                        tracker.fail(ticket, PRICES_SCOPE, response.error || 'Prices did not load',
                            failuresInRow + 1 >= FAILURES_BEFORE_GIVING_UP ? 'unavailable' : 'retry');
                    }
                    setFailuresInRow((n) => n + 1);
                    // most likely a 429 (rate limit) — give the API a breather
                    pauseUntil.current = Date.now() + FAILURE_PAUSE_MS;
                    console.warn(`Error fetching prices from ${name}, pausing for ${FAILURE_PAUSE_MS / 1000}s:`, response.error);
                }
            })
            .catch((e: unknown) => {
                if (track) tracker.fail(ticket, PRICES_SCOPE, String(e), 'retry');
            })
            .finally(() => {
                if (!track) return;
                inFlight.current = false;
                if (followUp.current) {
                    followUp.current = false;
                    if (followUpTimer.current) clearTimeout(followUpTimer.current);
                    followUpTimer.current = setTimeout(() => {
                        followUpTimer.current = null;
                        void fetchRef.current(neededRef.current, {track: true, queue: true});
                    }, FOLLOW_UP_GAP_MS);
                }
            })
    };
    const fetchRef = useRef(fetchPrices);
    fetchRef.current = fetchPrices;

    // held/picker symbols: refresh as soon as the set settles after a change (new asset added), …
    useEffect(() => {
        const t = setTimeout(() => void fetchRef.current(neededRef.current, {track: true, queue: true}), NEEDED_SETTLE_MS);
        return () => clearTimeout(t);
    }, [neededSet, coinGeckoCurrencies]);
    // …and one combined needed+sweep request per tick
    useInterval(() => void fetchPrices(neededSet, {sweep: true, track: true}), TICK_MS);
    // after a failure: once the pause is over (the polling tick would come up to 30 s later)
    useRetry(tracker, PRICES_SCOPE, () => void fetchRef.current(neededRef.current, {track: true}),
        () => FAILURE_PAUSE_MS);

    /** Manual refresh of the held coins' prices (answered at once when they loaded seconds ago). */
    const refreshCoinGeckoPrices = (): Promise<void> => {
        const plan = planManual(tracker.current(), [PRICES_SCOPE], Date.now());
        tracker.pulse(plan.fresh);
        return plan.fetch.length ? fetchPrices(neededSet, {track: true, manual: true}) : Promise.resolve();
    };

    // the background catalogue: null while it rests between passes or has nothing to go through
    const catalogueTotal = coinGeckoCurrencies ? Object.keys(coinGeckoCurrencies).length : 0;
    const coinGeckoCatalogue: CatalogueProgress | null =
        catalogueTotal && Date.now() >= sweepCooldownUntil.current
            ? {done: Math.min(sweepIndex, catalogueTotal), total: catalogueTotal}
            : null;

    /** Fetch one symbol's price ahead of time (e.g. as soon as it's picked in the add-asset dialog). */
    const prefetchCoinGeckoPrice = (symbol: string) => {
        void fetchPrices(new Set([symbol.toUpperCase()]))
    };

    /** a CoinGecko price for `symbol` may still arrive (see `answered` above) */
    const coinGeckoPricePending = (symbol: string): boolean => {
        const ticker = symbol.toUpperCase();
        if (coinGeckoPrices[ticker.toLowerCase()]) return false;
        if (failuresInRow >= FAILURES_BEFORE_GIVING_UP) return false;
        if (!coinGeckoCurrencies) return !currenciesFailed; // the directory is still loading
        return !!coinGeckoCurrencies[ticker] && !answered.has(ticker);
    };

    return {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoPricePending,
        coinGeckoCurrencies,
        coinGeckoCurrenciesLoaded: !!coinGeckoCurrencies,
        prefetchCoinGeckoPrice,
        refreshCoinGeckoPrices,
        coinGeckoCatalogue,
    }
}
