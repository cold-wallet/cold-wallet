import './index.css';
import React from "react";
import MonobankCurrencyResponse from "../../integrations/monobank/MonobankCurrencyResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";
import BinanceCurrencyResponse from "../../integrations/binance/BinanceCurrencyResponse";
import OkxCurrencyResponse from "../../integrations/okx/OkxCurrencyResponse";

export default function LoadingWindow(
    binancePricesLoaded: boolean,
    binancePrices: { [index: string]: string } | null,
    binanceCurrenciesLoaded: boolean,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null,
    okxPricesLoaded: boolean, okxPrices: { [index: string]: string } | null,
    okxCurrenciesLoaded: boolean, okxCurrencies: { [index: string]: OkxCurrencyResponse } | null,
    monobankRates: MonobankCurrencyResponse[] | null,
    monobankCurrencies: { [index: string]: FiatCurrency } | null,
) {
    return (
        <div className={"startup-loading-box layer-1-themed-color"}>
            <div className={"loading-label text-label"}>{binancePricesLoaded && binancePrices
                ? `Binance BTC/USDT: ${binancePrices["BTCUSDT"]}`
                : <>Loading binance prices... <progress/></>}</div>
            <div className={"loading-label text-label"}>{binanceCurrenciesLoaded && binanceCurrencies
                ? `binance currencies: ${Object.keys(binanceCurrencies).length}`
                : <>Loading binance currencies... <progress/></>}</div>
            <div className={"loading-label text-label"}>{okxPricesLoaded && okxPrices
                ? `OKX BTC/USDT: ${okxPrices["BTC-USDT"]}`
                : <>Loading OKX prices... <progress/></>}</div>
            <div className={"loading-label text-label"}>{okxCurrenciesLoaded && okxCurrencies
                ? `OKX currencies: ${Object.keys(okxCurrencies).length}`
                : <>Loading OKX currencies... <progress/></>}</div>
            <div className={"loading-label text-label"}>{monobankRates
                ? `USD/UAH: ${(monobankRates[0].rateSell + monobankRates[0].rateBuy) / 2}`
                : <>Loading monobank rates... <progress/></>}</div>
            <div className={"loading-label text-label"}>{monobankCurrencies
                ? `monobank currencies: ${Object.keys(monobankCurrencies || {}).length}`
                : <>Loading monobank currencies... <progress/></>}</div>
        </div>
    )
}
