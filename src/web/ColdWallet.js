import React, {useEffect, useRef, useState} from 'react';
import binanceApiClient from "../core/integrations/binance/binanceApiClient";
import monobankApiCLient from "../core/integrations/monobank/monobankApiClient";

function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (!delay) {
            return
        }

        function tick() {
            savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

const ColdWallet = () => {
    const [binancePrices, setBinancePrices] = useState(JSON.parse(localStorage.getItem('binancePrices')));
    const [binancePricesLoaded, setBinancePricesLoaded] = useState(false);
    const [binanceCurrencies, setBinanceCurrencies] = useState(JSON.parse(localStorage.getItem('binanceCurrencies')));
    const [binanceCurrenciesLoaded, setBinanceCurrenciesLoaded] = useState(false);
    const [monobankRates, setMonobankRates] = useState(JSON.parse(localStorage.getItem('monobankRates')));
    const [monobankCurrencies, setMonobankCurrencies] = useState(JSON.parse(localStorage.getItem('monobankCurrencies')));
    const [loaded, setLoaded] = useState(false);
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')));

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

    let loadMonobank = () => {
        monobankApiCLient.fetchMonobankRatesAndCurrencies().then(response => {
            if (response.success) {
                setMonobankRates(response.result.rates);
                setMonobankCurrencies(response.result.currencies);
            } else {
                console.warn('Error fetching rates from monobank:', response.error);
            }
        });
    };

    useEffect(loadBinancePrices, []);
    useEffect(loadBinanceCurrencies, []);
    useEffect(loadMonobank, []);
    useInterval(loadBinancePrices, 5000);
    useInterval(loadMonobank, 60000);
    useInterval(() => {
        if (!loaded && !!binancePricesLoaded && !!binanceCurrenciesLoaded
            && !!monobankRates && !!monobankCurrencies
        ) {
            setLoaded(true)
        }
    }, loaded ? null : 1500);

    useEffect(() => {
        binancePrices && localStorage.setItem('binancePrices', JSON.stringify(binancePrices));
    }, [binancePrices]);
    useEffect(() => {
        binanceCurrencies && localStorage.setItem('binanceCurrencies', JSON.stringify(binanceCurrencies));
    }, [binanceCurrencies]);
    useEffect(() => {
        monobankRates && localStorage.setItem('monobankRates', JSON.stringify(monobankRates));
    }, [monobankRates]);
    useEffect(() => {
        monobankCurrencies && localStorage.setItem('monobankCurrencies', JSON.stringify(monobankCurrencies));
    }, [monobankCurrencies]);
    useEffect(() => {
        userData && localStorage.setItem('userData', JSON.stringify(userData));
    }, [userData]);

    const loggedIn = !!userData && !userData.loginRequired;

    const buildLoading = () => {
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
                    ? `monobank currencies: ${monobankCurrencies ? Object.keys(monobankCurrencies).length : monobankCurrencies}`
                    : 'Loading monobank currencies...'}</p>
            </div>
        )
    }

    const buildOnLoggedIn = () => {
        return (
            <div className={"application-box"}>
                assets
            </div>
        );
    }

    const buildLoginWindow = () => {
        return (
            <div className={"login-box"}>
                please log in
            </div>
        );
    }

    const createWallet = () => {
        setUserData({})
    }

    const buildCreateWallet = () => {
        return (
            <button
                onClick={createWallet}
                className={"create-wallet-box layer-2-themed-color"}>
                create wallet
            </button>
        );
    }

    const buildImportWindow = () => {
        return (
            <button className={"import-wallet-box layer-2-themed-color"}>
                import
            </button>
        );
    }

    const buildOnNotLoggedIn = () => {
        return (
            <div className={"startup-login-box layer-1-themed-color"}>
                {userData
                    ? buildLoginWindow()
                    : buildCreateWallet()}
                {buildImportWindow()}
            </div>
        );
    }

    const buildOnLoaded = () => {
        return loggedIn ? buildOnLoggedIn() : buildOnNotLoggedIn()
    }

    return (
        <div className={"App background-themed-color"}>
            {loaded || !loggedIn || buildLoading()}
            {loaded && buildOnLoaded()}
        </div>
    );
};

export default ColdWallet;
