import {useEffect, useState} from "react";
import binanceApiClient from "../../../core/integrations/binance/binanceApiClient";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";

const pricesKey = 'binancePrices';
const currenciesKey = 'binanceCurrencies';

const BinanceLoader = () => {
    const item = localStorage.getItem(pricesKey);
    const initialState: { [p: string]: string } | null = item ? JSON.parse(item) : null;
    const [binancePrices, setBinancePrices] = useState(initialState);
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
    useEffect(() => {
        binancePrices && localStorage.setItem(pricesKey, JSON.stringify(binancePrices));
    }, [binancePrices]);

    let readCurrencies = localStorage.getItem(currenciesKey);
    let parsedCurrencies: string[] | null = readCurrencies ? JSON.parse(readCurrencies) : null;
    const [binanceCurrencies, setBinanceCurrencies] = useState(parsedCurrencies);
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
    useEffect(() => {
        binanceCurrencies && localStorage.setItem(currenciesKey, JSON.stringify(binanceCurrencies));
    }, [binanceCurrencies]);

    return {
        binancePrices,
        binancePricesLoaded,
        binanceCurrencies,
        binanceCurrenciesLoaded,
    }
}

export default BinanceLoader;
