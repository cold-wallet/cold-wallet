import {useEffect, useState} from "react";
import binanceApiClient from "../../../core/integrations/binance/binanceApiClient";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";

const BinanceLoader = (
    storageFactory: StorageFactory,
) => {
    const [
        binancePrices,
        setBinancePrices
    ] = storageFactory.createStorageNullable<{ [p: string]: string }>("binancePrices");

    const [binancePricesLoaded, setBinancePricesLoaded] = useState(false);
    let loadBinancePrices = () => {
        binanceApiClient.fetchBinancePrices().then((response: ApiResponse<{ [p: string]: string } | any>) => {
            if (response.success) {
                setBinancePrices(response.result);
                setBinancePricesLoaded(true);
            } else {
                console.warn('Error fetching prices from binance:', response);
            }
        })
    };
    useEffect(loadBinancePrices, []);
    useInterval(loadBinancePrices, 5000);

    const [
        binanceCurrencies,
        setBinanceCurrencies
    ] = storageFactory.createStorageNullable<string[]>("binanceCurrencies");

    const [binanceCurrenciesLoaded, setBinanceCurrenciesLoaded] = useState(false);
    let loadBinanceCurrencies = () => {
        binanceApiClient.fetchBinanceCurrencies().then((response: ApiResponse<string[] | any>) => {
            if (response.success) {
                setBinanceCurrencies(response.result);
                setBinanceCurrenciesLoaded(true);
            } else {
                console.warn('Error fetching currencies from binance:', response.error);
            }
        });
    };
    useEffect(loadBinanceCurrencies, []);

    return {
        binancePrices,
        binancePricesLoaded,
        binanceCurrencies,
        binanceCurrenciesLoaded,
    }
}

export default BinanceLoader;
