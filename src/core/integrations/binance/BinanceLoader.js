import {useEffect, useState} from "react";
import binanceApiClient from "./binanceApiClient";
import useInterval from "../../utils/useInterval";

const BinanceLoader = () => {
    const [binancePrices, setBinancePrices] = useState(JSON.parse(localStorage.getItem('binancePrices')));
    const [binancePricesLoaded, setBinancePricesLoaded] = useState(false);
    let loadBinancePrices = () => {
        binanceApiClient.fetchBinancePrices().then(response => {
            if (response.success) {
                setBinancePrices(response.result);
                setBinancePricesLoaded(true);
            } else {
                console.warn('Error fetching prices from binance:', response.error);
            }
        })
    };
    useEffect(loadBinancePrices, []);
    useInterval(loadBinancePrices, 1000);
    useEffect(() => {
        binancePrices && localStorage.setItem('binancePrices', JSON.stringify(binancePrices));
    }, [binancePrices]);

    const [binanceCurrencies, setBinanceCurrencies] = useState(JSON.parse(localStorage.getItem('binanceCurrencies')));
    const [binanceCurrenciesLoaded, setBinanceCurrenciesLoaded] = useState(false);
    let loadBinanceCurrencies = () => {
        binanceApiClient.fetchBinanceCurrencies().then(response => {
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
        binanceCurrencies && localStorage.setItem('binanceCurrencies', JSON.stringify(binanceCurrencies));
    }, [binanceCurrencies]);

    return {
        binancePrices,
        binancePricesLoaded,
        binanceCurrencies,
        binanceCurrenciesLoaded,
    }
}

export default BinanceLoader;
