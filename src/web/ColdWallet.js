import React, {useEffect, useRef, useState} from 'react';
import binanceApiClient from "../core/integrations/binance/binanceApiClient";
import monobankApiCLient from "../core/integrations/monobank/monobankApiClient";
import btcIcon from "../core/resources/images/btc.png";
import ethIcon from "../core/resources/images/eth.png";
import usdtIcon from "../core/resources/images/usdt.png";
import BinanceSvg from "../core/resources/images/binanceSvg";
import QmallSvg from "../core/resources/images/qmallSvg";
import MonobankSvg from "../core/resources/images/monobankSvg";
import NumberFormat from "react-number-format";
import fiatCurrencies from "../core/fiatCurrencies";
import compareStrings from "../core/utils/compareStrings";
import Asset from "../core/domain/Asset";
import noExponents from "../core/utils/noExponents";

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
    useInterval(loadBinancePrices, 5000);
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

    const [monobankRates, setMonobankRates] = useState(JSON.parse(localStorage.getItem('monobankRates')));
    const [monobankCurrencies, setMonobankCurrencies] = useState(JSON.parse(localStorage.getItem('monobankCurrencies')));
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
    useEffect(loadMonobank, []);
    useInterval(loadMonobank, 60000);
    useEffect(() => {
        monobankRates && localStorage.setItem('monobankRates', JSON.stringify(monobankRates));
    }, [monobankRates]);
    useEffect(() => {
        monobankCurrencies && localStorage.setItem('monobankCurrencies', JSON.stringify(monobankCurrencies));
    }, [monobankCurrencies]);

    const [loaded, setLoaded] = useState(false);
    useInterval(() => {
        if (!loaded && binancePricesLoaded && binanceCurrenciesLoaded
            && !!monobankRates && !!monobankCurrencies
        ) {
            setLoaded(true)
        }
    }, loaded ? null : 1000);

    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')));
    useEffect(() => {
        userData && localStorage.setItem('userData', JSON.stringify(userData));
    }, [userData]);

    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow] = useState(!(userData?.assets?.length));
    const [creatingNewAsset, setCreatingNewAsset] = useState(!(userData?.assets?.length));
    const [newAssetCurrency, setNewAssetCurrency] = useState(null);
    const [newAssetValue, setNewAssetValue] = useState(0);
    const [newAssetName, setNewAssetName] = useState("");
    const [isNewAssetInvalid, setIsNewAssetInvalid] = useState(false);
    const [isNewAssetNameInvalid, setIsNewAssetNameInvalid] = useState(false);

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

    const onNewAssetCurrencySelected = (currency) => {
        setNewAssetCurrency(currency);
        setShowCreateNewAssetWindow(false);
    }

    const onNewAssetIntegrationSelected = (integration) => {
        alert(integration)
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
        let totalCurrencies = Object.keys(monobankCurrencies || {}).concat(binanceCurrencies || []);
        const selectCurrencies = Object.keys(totalCurrencies
            .reduce((result, value) => {
                result[value] = true;
                return result
            }, {}))
            .sort(compareStrings);
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
                                    currencies.map((currency, i) => (
                                        <div key={i}
                                             onClick={() => onNewAssetCurrencySelected(currency.name)}
                                             className={"new-asset-choose-button button layer-2-themed-color " +
                                             " flex-box-centered flex-direction-column"}>
                                            <div className="new-asset-choose-button-image">
                                                {currency.imageElement}
                                            </div>
                                            <div className="new-asset-choose-button-name">{currency.name}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="new-asset-choose-select-box">
                                <select className={"new-asset-choose-select"}
                                        onChange={e => onNewAssetCurrencySelected(e.target.value)}
                                >
                                    <option defaultValue value> -- select currency --</option>
                                    {
                                        selectCurrencies.map((currencyName, i) => (
                                            <option key={i} value={currencyName}>{currencyName}</option>
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
                                        <div key={i}
                                             onClick={() => onNewAssetIntegrationSelected(integration.name)}
                                             className={"new-asset-integration flex-box-centered" +
                                             " flex-direction-row button layer-2-themed-color"}
                                        >
                                            <div className={"new-asset-integration-logo " + integration.logoClass}
                                                 title={integration.name}>
                                                {integration.logo}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="new-asset-choose-select-box">
                                <select className={"new-asset-choose-select"}
                                        onChange={e => onNewAssetIntegrationSelected(e.target.value)}
                                >
                                    <option defaultValue value> -- select integration --</option>
                                    {
                                        chooseIntegrations.map(({name}, i) => (
                                            <option key={i} value={name}>{name}</option>
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

    const isAssetValueValid = (value) => {
        return value && !isNaN(value) && (value > 0)
    }

    const isAssetNameValid = (newAssetName) => {
        return newAssetName && newAssetName.length <= 40
    }

    const buildAcceptNewAssetButton = (afterDecimalPoint) => {
        return (
            <div key={1}
                 onClick={event => {
                     if (!isAssetValueValid(newAssetValue)) {
                         setIsNewAssetInvalid(true);
                     } else if (!isAssetNameValid(newAssetName)) {
                         setIsNewAssetNameInvalid(true);
                     } else {
                         let userDataNew = {...userData}
                         if (!userDataNew.assets) {
                             userDataNew.assets = [];
                         }
                         userDataNew.assets.unshift(new Asset(newAssetCurrency, newAssetValue, newAssetName,
                             afterDecimalPoint))
                         setUserData(userDataNew);
                         setNewAssetValue(null);
                         setNewAssetName("");
                         setNewAssetCurrency(null);
                         setShowCreateNewAssetWindow(false);
                         setIsNewAssetInvalid(false);
                         setCreatingNewAsset(false);
                     }
                 }}
                 className="asset-row-controls-button asset-row-button-accept button positive-button">✔</div>
        )
    }

    const buildCancelNewAssetButton = () => {
        return (
            <div key={2}
                 onClick={event => {
                     setNewAssetValue(null);
                     setNewAssetCurrency(null);
                     setNewAssetName("");
                     setShowCreateNewAssetWindow(true);
                 }}
                 className="asset-row-controls-button button negative-button">✖</div>
        )
    }

    const buildEditNewAssetControls = (afterDecimalPoint) => {
        return [
            buildAcceptNewAssetButton(afterDecimalPoint),
            buildCancelNewAssetButton(),
        ]
    }

    const buildEditNewAsset = () => {
        let fiatCurrency = fiatCurrencies.getByStringCode(newAssetCurrency);
        const afterDecimalPoint = fiatCurrency ? fiatCurrency.afterDecimalPoint : 8;
        return (
            <div className={"asset-row flex-box-centered flex-direction-row layer-2-themed-color"}>
                <div className={"asset-item-value" + (isNewAssetInvalid ? " asset-item-value-input--invalid" : "")}>
                    <NumberFormat
                        allowNegative={false}
                        allowLeadingZeros={false}
                        getInputRef={(input) => {
                            input && !input.value && input.focus();
                        }}
                        isNumericString={true}
                        displayType={"input"}
                        decimalScale={afterDecimalPoint}
                        thousandSeparator={true}
                        defaultValue={""}
                        onValueChange={(values) => {
                            const {value} = values;
                            // {
                            //     formattedValue: '$23,234,235.56', //value after applying formatting
                            //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                            //     // if you are setting this value to state make sure to pass isNumericString prop to true
                            //     floatValue: 23234235.56 //floating point representation. For big numbers it
                            //     // can have exponential syntax
                            // }
                            setIsNewAssetInvalid(false);
                            setNewAssetValue(value);
                        }}
                        renderText={value => <div className={
                            "asset-item-value-input" +
                            (isNewAssetInvalid ? " asset-item-value-input--invalid" : "")
                        }>{value}</div>}
                    />
                </div>
                <div className="asset-row-currency text-label">{newAssetCurrency}</div>
                <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
                    {buildEditNewAssetControls(afterDecimalPoint)}
                </div>
                <div className="asset-item-name-row flex-box-centered flex-direction-row">
                    <div className="asset-item-name-label text-label">name:&nbsp;</div>
                    <input type={"text"}
                           defaultValue={`${newAssetCurrency} amount`}
                           ref={instance => setNewAssetName(`${newAssetCurrency} amount`)}
                           onChange={event => {
                               let value = event?.target?.value;
                               value && (newAssetName !== value) && setNewAssetName(value);
                           }}
                           className={"asset-item-name-input"
                           + (isNewAssetNameInvalid ? " asset-item-name-input--invalid" : "")}/>
                </div>
            </div>
        )
    }

    const buildAssets = () => (userData.assets || []).map((asset, i) => (
        <div key={i} className={"asset-row flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"asset-item-value"}>
                <NumberFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    isNumericString={true}
                    displayType={"text"}
                    decimalScale={asset.decimalScale || 8}
                    thousandSeparator={true}
                    value={noExponents(asset.amount)}
                    renderText={value => <div className={"asset-item-value-input"}>{value}</div>}
                />
            </div>
            <div className={"asset-item-name text-label"} title={asset.name}>{asset.name}</div>
            <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
                {buildEditNewAssetControls()}
            </div>
        </div>
    ))

    const addNewAssetButtonClicked = () => {
        setShowCreateNewAssetWindow(true);
        setCreatingNewAsset(true);
    }

    const buildAddNewAssetButton = () => (
        <div className="add-new-asset-row flex-box-centered flex-direction-row">
            <div onClick={addNewAssetButtonClicked}
                 className="add-new-asset-button button positive-button layer-3-themed-color">+
            </div>
            <div className="add-new-asset-text text-label">Add new asset</div>
        </div>
    )

    const buildOnLoggedIn = () => {
        return (
            <div className={"application-box flex-box flex-direction-row"}>
                {showCreateNewAssetWindow && newAssetWindow()}
                <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                    {buildAddNewAssetButton()}
                    {!showCreateNewAssetWindow && creatingNewAsset && buildEditNewAsset()}
                    {buildAssets()}
                </div>
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
            <div
                onClick={createWallet}
                className={"startup-login-box-button layer-2-themed-color button"}>
                create new wallet
            </div>
        );
    }

    const buildImportWindow = () => {
        return (
            <div className={"startup-login-box-button layer-2-themed-color button"}>
                import
            </div>
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
            {loaded || buildLoading()}
            {loaded && buildOnLoaded()}
        </div>
    );
};

export default ColdWallet;
