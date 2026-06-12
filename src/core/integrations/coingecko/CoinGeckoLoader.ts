import {useEffect, useMemo, useRef, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import apiClient from "./apiClient";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";

const name = "coingecko"
const subCurrencies = ["btc", "eur", "uah", "usd", "xag", "xau", "xdr"]

// CoinGecko's keyless API allows only a handful of requests per minute, and its 429
// responses carry no CORS headers (browsers report them as CORS errors). So instead of
// sweeping all ~13k coins in 500-id batches every 5s, send ONE request per tick:
// the prices we actually display (held assets + picker favourites — always fresh) plus a
// slice of the full list, so the long tail still gets pre-warmed into the persisted cache
// and a newly added coin almost always has a price instantly.
const POPULAR_SYMBOLS = ["USDT", "BTC", "ETH"];
const TICK_MS = 30_000;
const SWEEP_BATCH = 500;
const SWEEP_COOLDOWN_MS = 30 * 60_000; // pause between full sweeps
const FAILURE_PAUSE_MS = 60_000;       // back off after any failure (rate limit etc.)
const CURRENCIES_TTL_MS = 7 * 24 * 3_600_000;

export default function CoinGeckoLoader(
    storageFactory: StorageFactory,
    neededSymbols: string[],
) {
    const [
        coinGeckoCurrencies,
        setCoinGeckoCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: CoinGeckoCurrencyResponse }>("coinGeckoCurrencies");
    const [
        coinGeckoCurrenciesFetchedAt,
        setCoinGeckoCurrenciesFetchedAt
    ] = storageFactory.createStorage<number>("coinGeckoCurrenciesFetchedAt", () => 0);

    let loadCoinGeckoCurrencies = () => {
        // the 13k-coin directory rarely changes — refetch at most weekly
        if (coinGeckoCurrencies && Object.keys(coinGeckoCurrencies).length
            && (Date.now() - coinGeckoCurrenciesFetchedAt) < CURRENCIES_TTL_MS) {
            return
        }
        apiClient.fetchCurrencies()
            .then((response: ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>) => {
                if (response.success) {
                    setCoinGeckoCurrencies(response.result);
                    setCoinGeckoCurrenciesFetchedAt(Date.now());
                } else {
                    console.warn(`Error fetching currencies from ${name}:`, response.error);
                }
            });
    };
    useEffect(loadCoinGeckoCurrencies, []);

    const [
        coinGeckoPrices,
        setCoinGeckoPrices
    ] = storageFactory.createStorage<CoinGeckoPriceResponse>("coinGeckoPrices", () => {
        return {} as CoinGeckoPriceResponse
    });
    const [coinGeckoPricesLoaded, setCoinGeckoPricesLoaded] = useState(false);

    const [sweepIndex, setSweepIndex] = useState(0);
    const pauseUntil = useRef(0);
    const sweepCooldownUntil = useRef(0);

    const neededSet = useMemo(() => {
        const set = new Set<string>(POPULAR_SYMBOLS);
        neededSymbols.forEach(s => set.add(s.toUpperCase()));
        return set;
    }, [neededSymbols.join(',')]);

    // One request: prices for `symbols`, optionally advancing the background sweep cursor.
    const fetchPrices = (symbols: Set<string>, advanceSweep: boolean) => {
        if (!coinGeckoCurrencies || Date.now() < pauseUntil.current) {
            return
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
            return
        }
        apiClient.fetchPrices(toLoad, subCurrencies)
            .then((response: ApiResponse<CoinGeckoPriceResponse | any>) => {
                if (response.success) {
                    setCoinGeckoPrices({
                        ...coinGeckoPrices,
                        ...(response.result),
                    })
                    setCoinGeckoPricesLoaded(true)
                    if (advanceSweep) {
                        setSweepIndex(nextIndex)
                        const total = Object.keys(coinGeckoCurrencies).length;
                        const at = nextIndex || total;
                        console.log(`coingecko sweep at ${at} of ${total} (${(at * 100 / total).toFixed(1)}%)`)
                    }
                } else {
                    // most likely a 429 (rate limit) — give the API a breather
                    pauseUntil.current = Date.now() + FAILURE_PAUSE_MS;
                    console.warn(`Error fetching prices from ${name}, pausing for ${FAILURE_PAUSE_MS / 1000}s:`, response.error);
                }
            })
    };

    // held/picker symbols: refresh immediately when the set changes (new asset added), …
    useEffect(() => {
        fetchPrices(neededSet, false)
    }, [neededSet, coinGeckoCurrencies]);
    // …and one combined needed+sweep request per tick
    useInterval(() => fetchPrices(neededSet, true), TICK_MS);

    /** Fetch one symbol's price ahead of time (e.g. as soon as it's picked in the add-asset dialog). */
    const prefetchCoinGeckoPrice = (symbol: string) => {
        fetchPrices(new Set([symbol.toUpperCase()]), false)
    };

    return {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoCurrencies,
        coinGeckoCurrenciesLoaded: !!coinGeckoCurrencies,
        prefetchCoinGeckoPrice,
    }
}
