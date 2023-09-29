import {useEffect, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import apiClient from "./apiClient";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";

const name = "coingecko"
const subCurrencies = ["btc", "eur", "uah", "usd", "xag", "xau", "xdr"]

export default function CoinGeckoLoader(
    storageFactory: StorageFactory,
) {
    const [
        coinGeckoCurrencies,
        setCoinGeckoCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: CoinGeckoCurrencyResponse }>("coinGeckoCurrencies");

    let loadCoinGeckoCurrencies = () => {
        apiClient.fetchCurrencies()
            .then((response: ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>) => {
                if (response.success) {
                    setCoinGeckoCurrencies(response.result);
                } else {
                    console.warn(`Error fetching currencies from ${name}:`, response.error);
                }
            });
    };
    useEffect(loadCoinGeckoCurrencies, []);

    const [
        coinGeckoSubCurrencies,
        //setCoinGeckoSubCurrencies
    ] = storageFactory.createStorage<string[]>("coinGeckoSubCurrencies", () => subCurrencies);

    // let loadCoinGeckoSubCurrencies = () => {
    //     apiClient.fetchSubCurrencies()
    //         .then((response: ApiResponse<string[] | any>) => {
    //             if (response.success) {
    //                 setCoinGeckoSubCurrencies(response.result);
    //             } else {
    //                 console.warn(`Error fetching sub-currencies from ${name}:`, response.error);
    //             }
    //         });
    // };
    // useEffect(loadCoinGeckoSubCurrencies, []);

    const [
        coinGeckoPrices,
        setCoinGeckoPrices
    ] = storageFactory.createStorage<CoinGeckoPriceResponse>("coinGeckoPrices", () => {
        return {} as CoinGeckoPriceResponse
    });
    const [coinGeckoPricesLoaded, setCoinGeckoPricesLoaded]
        = useState(false);
    const [coinGeckoPricesAlreadyLoaded, setCoinGeckoPricesAlreadyLoaded]
        = useState<CoinGeckoPriceResponse>({} as CoinGeckoPriceResponse);
    const [coinGeckoAllPricesLoaded, setCoinGeckoAllPricesLoaded]
        = useState(false);

    const loadPrices = () => {
        if (!coinGeckoCurrencies || !coinGeckoSubCurrencies || coinGeckoAllPricesLoaded) {
            return
        }
        const startIndex = Object.keys(coinGeckoPricesAlreadyLoaded).length
        const currencies = Object.keys(coinGeckoCurrencies);
        const delta = 515;
        const endIndex = Math.min(startIndex + delta, currencies.length)

        const currenciesToLoadPrice = Object.entries(coinGeckoCurrencies)
            .slice(startIndex, endIndex)
            .reduce((merged, [ticker, currency]) => {
                merged[ticker] = currency
                return merged
            }, {} as { [index: string]: CoinGeckoCurrencyResponse })

        apiClient.fetchPrices(currenciesToLoadPrice, coinGeckoSubCurrencies)
            .then((response: ApiResponse<CoinGeckoPriceResponse | any>) => {
                if (response.success) {
                    const allNewPrices = {
                        ...coinGeckoPricesAlreadyLoaded,
                        ...(response.result),
                    }
                    const refreshed = Object.keys(allNewPrices).length;
                    const percentage = Number((refreshed * 100 / currencies.length).toFixed(2));
                    console.log(`refreshed ${refreshed} of ${currencies.length} coingecko prices, ${percentage}%`)
                    setCoinGeckoPricesAlreadyLoaded(allNewPrices)
                    const allPrices = {
                        ...coinGeckoPrices,
                        ...allNewPrices,
                    }
                    setCoinGeckoPrices(allPrices)
                    if (endIndex === currencies.length) {
                        setCoinGeckoAllPricesLoaded(true);
                        setCoinGeckoPricesLoaded(true)
                    }
                } else {
                    console.warn(`Error fetching prices from ${name}:`, response);
                }
            })
    };
    useEffect(loadPrices, []);
    useInterval(loadPrices, 5_000)

    useInterval(() => {
        setCoinGeckoPricesAlreadyLoaded({} as CoinGeckoPriceResponse)
        setCoinGeckoAllPricesLoaded(false)
    }, coinGeckoAllPricesLoaded ? 30_000 : null)

    return {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoCurrencies,
        coinGeckoCurrenciesLoaded: !!coinGeckoCurrencies,
    }
}
