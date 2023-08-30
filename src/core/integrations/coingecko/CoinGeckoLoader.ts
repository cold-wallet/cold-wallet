import {useEffect, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import apiClient from "./apiClient";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";

const name = "coingecko"

export default function CoinGeckoLoader(
    storageFactory: StorageFactory,
) {
    const [
        coinGeckoPrices,
        setCoinGeckoPrices
    ] = storageFactory.createStorageNullable<CoinGeckoPriceResponse>("coinGeckoPrices");

    const [coinGeckoPricesLoaded, setCoinGeckoPricesLoaded] = useState(false);
    let loadCoinGeckoPrices = () => {
        apiClient.fetchPrices().then((response: ApiResponse<CoinGeckoPriceResponse | any>) => {
            if (response.success) {
                setCoinGeckoPrices(response.result);
                setCoinGeckoPricesLoaded(true);
            } else {
                console.warn(`Error fetching prices from ${name}:`, response);
            }
        })
    };
    useEffect(loadCoinGeckoPrices, []);
    useInterval(loadCoinGeckoPrices, 60_000);

    const [
        coinGeckoCurrencies,
        setCoinGeckoCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: CoinGeckoCurrencyResponse }>("coinGeckoCurrencies");

    const [coinGeckoCurrenciesLoaded, setCoinGeckoCurrenciesLoaded] = useState(false);
    let loadCoinGeckoCurrencies = () => {
        apiClient.fetchCurrencies()
            .then((response: ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>) => {
                if (response.success) {
                    setCoinGeckoCurrencies(response.result);
                    setCoinGeckoCurrenciesLoaded(true);
                } else {
                    console.warn(`Error fetching currencies from ${name}:`, response.error);
                }
            });
    };
    useEffect(loadCoinGeckoCurrencies, []);

    return {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoCurrencies, coinGeckoCurrenciesLoaded,
    }
}
