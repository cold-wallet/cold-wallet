import './index.css';
import React from "react";
import MonobankCurrencyResponse from "../../integrations/monobank/MonobankCurrencyResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";
import BinanceCurrencyResponse from "../../integrations/binance/BinanceCurrencyResponse";
import OkxCurrencyResponse from "../../integrations/okx/OkxCurrencyResponse";
import CoinGeckoPriceResponse from "../../integrations/coingecko/CoinGeckoPriceResponse";
import CoinGeckoCurrencyResponse from "../../integrations/coingecko/CoinGeckoCurrencyResponse";

export default function LoadingWindow(
    coinGeckoPrices: CoinGeckoPriceResponse | null,
    coinGeckoPricesLoaded: boolean,
    coinGeckoCurrencies: { [index: string]: CoinGeckoCurrencyResponse } | null,
    coinGeckoCurrenciesLoaded: boolean,
    binancePricesLoaded: boolean,
    binancePrices: { [index: string]: string } | null,
    binanceCurrenciesLoaded: boolean,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null,
    okxPricesLoaded: boolean,
    okxPrices: { [index: string]: string } | null,
    okxCurrenciesLoaded: boolean,
    okxCurrencies: { [index: string]: OkxCurrencyResponse } | null,
    monobankRates: MonobankCurrencyResponse[] | null,
    monobankCurrencies: { [index: string]: FiatCurrency } | null,
) {
    return (
        <div className={"startup-loading-box layer-1-themed-color flex-box-centered flex-direction-column"}>
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

            <div className={"loading-label text-label"}>{coinGeckoPrices
                ? `CoinGecko prices: ${Object.keys(coinGeckoPrices).length}`
                : <>Loading CoinGecko prices... <progress/></>}</div>
            <div className={"loading-label text-label"}>{coinGeckoPricesLoaded && coinGeckoPrices
                ? "CoinGecko prices loaded"
                : <>Loading CoinGecko prices... <progress/></>}</div>
            {coinGeckoPrices && coinGeckoPrices["usdt"] && coinGeckoPrices["usdt"]["btc"]
                ? <div className={"loading-label text-label"}>{
                    `CoinGecko BTC/USDT: ${1 / coinGeckoPrices["usdt"]["btc"]}`
                }</div>
                : null}
            <div className={"loading-label text-label"}>{coinGeckoCurrenciesLoaded && coinGeckoCurrencies
                ? `CoinGecko currencies: ${Object.keys(coinGeckoCurrencies).length}`
                : <>Loading CoinGecko currencies... <progress/></>}</div>

            <div className={"loading-label text-label"}>{monobankRates
                ? `USD/UAH: ${(monobankRates[0].rateSell + monobankRates[0].rateBuy) / 2}`
                : <>Loading monobank rates... <progress/></>}</div>
            <div className={"loading-label text-label"}>{monobankCurrencies
                ? `monobank currencies: ${Object.keys(monobankCurrencies || {}).length}`
                : <>Loading monobank currencies... <progress/></>}</div>
        </div>
    )
}
