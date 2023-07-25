import React from "react";

const LoadingWindow = (
    binancePricesLoaded,
    binancePrices,
    binanceCurrenciesLoaded,
    binanceCurrencies,
    monobankRates,
    monobankCurrencies,
) => {
    return (
        <div className={"startup-loading-box layer-1-themed-color"}>
            <p>{binancePricesLoaded ? `BTC/USDT: ${binancePrices["BTCUSDT"]}` : 'Loading binance prices...'}</p>
            <p>{binanceCurrenciesLoaded
                ? `binance currencies: ${Object.keys(binanceCurrencies).length}`
                : 'Loading binance currencies...'}</p>
            <p>{monobankRates
                ? `USD/UAH: ${(monobankRates[0].rateSell + monobankRates[0].rateBuy) / 2}
                ` : 'Loading monobank rates...'}</p>
            <p>{monobankCurrencies
                ? `monobank currencies: ${monobankCurrencies
                    ? Object.keys(monobankCurrencies).length
                    : monobankCurrencies}`
                : 'Loading monobank currencies...'}</p>
        </div>
    )
}

export default LoadingWindow;
