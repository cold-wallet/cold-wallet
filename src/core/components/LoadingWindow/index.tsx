import './index.css';
import React from "react";
import MonobankCurrencyResponse from "../../integrations/monobank/MonobankCurrencyResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";

export default function LoadingWindow(
    binancePricesLoaded: boolean,
    binancePrices: { [index: string]: string } | null,
    binanceCurrenciesLoaded: boolean,
    binanceCurrencies: string[] | null,
    monobankRates: MonobankCurrencyResponse[] | null,
    monobankCurrencies: { [index: string]: FiatCurrency } | null,
) {
    return (
        <div className={"startup-loading-box layer-1-themed-color"}>
            <p>{binancePricesLoaded && binancePrices
                ? `BTC/USDT: ${binancePrices["BTCUSDT"]}`
                : <>Loading binance prices... <progress/></>}</p>
            <p>{binanceCurrenciesLoaded && binanceCurrencies
                ? `binance currencies: ${Object.keys(binanceCurrencies).length}`
                : <>Loading binance currencies... <progress/></>}</p>
            <p>{monobankRates
                ? `USD/UAH: ${(monobankRates[0].rateSell + monobankRates[0].rateBuy) / 2}`
                : <>Loading monobank rates... <progress/></>}</p>
            <p>{monobankCurrencies
                ? `monobank currencies: ${Object.keys(monobankCurrencies || {}).length}`
                : <>Loading monobank currencies... <progress/></>}</p>
        </div>
    )
}
