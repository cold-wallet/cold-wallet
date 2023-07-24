import React, {useEffect, useRef, useState} from 'react';
import binanceApiClient from "../core/integrations/binance/binanceApiClient";
import monobankApiCLient from "../core/integrations/monobank/monobankApiClient";
import btcIcon from "../core/resources/images/btc.png";
import ethIcon from "../core/resources/images/eth.png";
import usdtIcon from "../core/resources/images/usdt.png";
import BinanceSvg from "../core/resources/images/binanceSvg";
import QmallSvg from "../core/resources/images/qmallSvg";
import MonobankSvg from "../core/resources/images/monobankSvg";

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
    }, loaded ? null : 1000);

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
                    ? `monobank currencies: ${monobankCurrencies
                        ? Object.keys(monobankCurrencies).length
                        : monobankCurrencies}`
                    : 'Loading monobank currencies...'}</p>
            </div>
        )
    }

    const newAssetWindow = () => {
        const currencies = [
            {
                name: "USD",
                type: "fiat",
                imageType: "text",
                imageElement: <span className={"new-asset-choose-button-image-text"}>&#x24;</span>,
            },
            {
                name: "EUR",
                type: "fiat",
                imageType: "text",
                imageElement: <span className={"new-asset-choose-button-image-text"}>&euro;</span>,
            },
            {
                name: "UAH",
                type: "fiat",
                imageType: "text",
                imageElement: <span className={"new-asset-choose-button-image-text"}>&#8372;</span>,
            },
            {
                name: "USDT",
                type: "crypto",
                imageType: "image",
                imageElement: <img src={usdtIcon}
                                   alt="USDT"
                                   className={"new-asset-choose-button-image-icon"}/>,
            },
            {
                name: "BTC",
                type: "crypto",
                imageType: "image",
                imageElement: <img src={btcIcon}
                                   alt="BTC"
                                   className={"new-asset-choose-button-image-icon"}/>,
            },
            {
                name: "ETH",
                type: "crypto",
                imageType: "image",
                imageElement: <img src={ethIcon}
                                   alt="ETH"
                                   className={"new-asset-choose-button-image-icon"}/>,
            },
        ];
        const selectCurrencies = [
            {
                name: "USD",
            },
            {
                name: "EUR",
            },
            {
                name: "UAH",
            },
            {
                name: "USDT",
            },
            {
                name: "BTC",
            },
            {
                name: "ETH",
            },
        ];
        const chooseIntegrations = [
            {
                name: "binance",
                logo: <BinanceSvg/>,
                logoClass: "new-asset-integration-logo--binance",
            },
            {
                name: "qmall",
                logo: <QmallSvg/>,
                logoClass: "new-asset-integration-logo--qmall",
            },
            {
                name: "monobank",
                logo: <MonobankSvg/>,
                logoClass: "new-asset-integration-logo--monobank",
            },
        ];
        return (
            <div className="modal-window-box">
                <div className="modal-window-shadow"/>
                <div className={"new-asset-window modal-window flex-box-centered" +
                " flex-direction-column layer-3-themed-color"}>
                    <div className="new-asset-title">Create new asset</div>
                    <div className="new-asset-controls-box flex-box-centered flex-direction-row">
                        <div className="new-asset-choose-box flex-box-centered flex-direction-column">
                            <div className="new-asset-choose-title">Enter asset value manually</div>
                            <div className="new-asset-choose-buttons flex-box-centered">
                                {
                                    currencies.map((data, i) => (
                                        <div key={i} className={"new-asset-choose-button button layer-2-themed-color " +
                                        " flex-box-centered flex-direction-column"}>
                                            <div className="new-asset-choose-button-image">
                                                {data.imageElement}
                                            </div>
                                            <div className="new-asset-choose-button-name">{data.name}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="new-asset-choose-select-box">
                                <select className={"new-asset-choose-select"}>
                                    <option defaultValue value> -- select currency --</option>
                                    {
                                        selectCurrencies.map((currency, i) => (
                                            <option key={i} value={currency.name}>{currency.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="new-asset-choose-box flex-box-centered flex-direction-column">
                            <div className="new-asset-choose-title">Choose your integration</div>
                            <div className={"new-asset-choose-buttons flex-box-centered flex-direction-column"}>
                                {
                                    chooseIntegrations.map((integration, i) => (
                                        <div key={i} className={"new-asset-integration flex-box-centered" +
                                        " flex-direction-row button layer-2-themed-color"}>
                                            <div className={"new-asset-integration-logo " + integration.logoClass}>
                                                {integration.logo}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="new-asset-choose-select-box">
                                <select className={"new-asset-choose-select"}>
                                    <option defaultValue value> -- select integration --</option>
                                    {
                                        chooseIntegrations.map((integration, i) => (
                                            <option key={i} value={integration.name}>{integration.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const buildOnLoggedIn = () => {
        let assets = userData.assets?.length || 0;
        return (
            <div className={"application-box"}>
                assets: {assets}
                {assets || newAssetWindow()}
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
