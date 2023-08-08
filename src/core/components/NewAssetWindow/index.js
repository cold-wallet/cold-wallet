import './index.css';
import usdtIcon from "../../../resources/images/usdt.png";
import btcIcon from "../../../resources/images/btc.png";
import ethIcon from "../../../resources/images/eth.png";
import compareStrings from "../../utils/compareStrings";
import React from "react";
import thirdPartyIntegrations from "../integrations/ThirdPartyIntegrations";
import binanceIntegration from "../integrations/BinanceIntegrationPad";
import qmallIntegration from "../integrations/QmallIntegrationPad";
import monobankIntegration from "../integrations/MonobankIntegrationPad";
import IntegrationSettings from "../settings/IntegrationSettings";

export default function NewAssetWindow(
    setNewAssetCurrency,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    monobankCurrencies,
    stateReset,
    anyAssetExist,
    userData, setUserData,
    monobankSettingsEnabled, setMonobankSettingsEnabled,
    monobankApiTokenInput, setMonobankApiTokenInput,
    monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
    monobankUserData, setMonobankUserData,
    monobankUserDataLoading, setMonobankUserDataLoading,
    integrationWindowNameSelected, setIntegrationWindowNameSelected,
    binanceCurrencies,
    binanceSettingsEnabled, setBinanceSettingsEnabled,
    binanceApiKeyInput, setBinanceApiKeyInput,
    binanceApiSecretInput, setBinanceApiSecretInput,
    binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
    binanceUserData, setBinanceUserData,
    binanceUserDataLoading, setBinanceUserDataLoading,
) {

    const onNewAssetCurrencySelected = (currency) => {
        setNewAssetCurrency(currency);
        setShowCreateNewAssetWindow(false);
    }

    const onNewAssetIntegrationSelected = (integration) => {
        setIntegrationWindowNameSelected(integration)
    }

    const currencies = [
        {
            name: "USD",
            type: "fiat",
            imageType: "text",
            imageElement: (
                <div className="new-asset-choose-button-symbol">
                    <div className={"new-asset-choose-button-image-text"}>&#x24;</div>
                </div>
            ),
        },
        {
            name: "EUR",
            type: "fiat",
            imageType: "text",
            imageElement: (
                <div className="new-asset-choose-button-symbol">
                    <div className={"new-asset-choose-button-image-text"}>&euro;</div>
                </div>
            ),
        },
        {
            name: "UAH",
            type: "fiat",
            imageType: "text",
            imageElement: (
                <div className="new-asset-choose-button-symbol">
                    <div className={"new-asset-choose-button-image-text"}>&#8372;</div>
                </div>
            ),
        },
        {
            name: "USDT",
            type: "crypto",
            imageType: "image",
            imageElement: (
                <div className="new-asset-choose-button-image">
                    <img src={usdtIcon}
                         alt="USDT"
                         className={"new-asset-choose-button-image-icon"}/>
                </div>
            ),
        },
        {
            name: "BTC",
            type: "crypto",
            imageType: "image",
            imageElement: (
                <div className="new-asset-choose-button-image">
                    <img src={btcIcon}
                         alt="BTC"
                         className={"new-asset-choose-button-image-icon"}/>
                </div>
            ),
        },
        {
            name: "ETH",
            type: "crypto",
            imageType: "image",
            imageElement: (
                <div className="new-asset-choose-button-image">
                    <img src={ethIcon}
                         alt="ETH"
                         className={"new-asset-choose-button-image-icon"}/>
                </div>
            ),
        },
    ];
    let totalCurrencies = Object.keys(monobankCurrencies || {})
        .concat(Object.keys(binanceCurrencies) || []);
    const selectCurrencies = Object.keys(totalCurrencies
        .reduce((result, value) => {
            result[value] = true;
            return result
        }, {}))
        .sort(compareStrings);

    const onClose = () => {
        stateReset()
        if (!anyAssetExist) {
            setShowCreateNewAssetWindow(true);
            setCreatingNewAsset(true);
        }
        // setIntegrationWindowNameSelected(null)
        // setMonobankApiTokenInputInvalid(false)
        // setBinanceApiKeysInputInvalid(false)
        // if (!anyAssetExist) {
        //     return;
        // }
        // setShowCreateNewAssetWindow(false);
        // setCreatingNewAsset(false);
    }

    function defaultView() {
        return (<div className="new-asset-controls-box flex-box-centered flex-direction-row">
            <div className="new-asset-choose-box flex-box-centered flex-direction-column">
                <div className="new-asset-choose-title text-label">Enter asset value manually</div>
                <div className="new-asset-choose-buttons flex-box-centered">
                    {
                        currencies.map((currency, i) => (
                            <div key={i}
                                 onClick={() => onNewAssetCurrencySelected(currency.name)}
                                 className={"new-asset-choose-button pad layer-3-themed-color " +
                                     " flex-box-centered flex-direction-column"}>
                                {currency.imageElement}
                                <div className="new-asset-choose-button-name">{currency.name}</div>
                            </div>
                        ))
                    }
                </div>
                <div className="new-asset-choose-select-box">
                    <select className={"new-asset-choose-select"}
                            onChange={e => onNewAssetCurrencySelected(e.target.value)}>
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
                <div className="new-asset-choose-title text-label">Choose your integration</div>
                <div className={"new-asset-choose-buttons flex-box-centered flex-direction-column"}>{
                    [
                        {integration: binanceIntegration, isEnabled: binanceSettingsEnabled},
                        {integration: qmallIntegration, isEnabled: false},
                        {integration: monobankIntegration, isEnabled: monobankSettingsEnabled},

                    ].map(({integration, isEnabled}) => integration.element(
                        () => onNewAssetIntegrationSelected(integration.name), isEnabled)
                    )
                }</div>
                <div className="new-asset-choose-select-box">
                    <select className={"new-asset-choose-select"}
                            onChange={e => onNewAssetIntegrationSelected(e.target.value)}>
                        <option defaultValue value> -- select integration --</option>
                        {
                            thirdPartyIntegrations.map(({name}, i) => (
                                <option key={i} value={name}>{name}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
        </div>)
    }

    return IntegrationSettings(
        defaultView,
        anyAssetExist,
        true,
        "Create new asset",
        onClose,
        (integrationWindowNameSelected !== null),
        stateReset,
        userData, setUserData,
        monobankSettingsEnabled, setMonobankSettingsEnabled,
        monobankApiTokenInput, setMonobankApiTokenInput,
        monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
        monobankUserData, setMonobankUserData,
        monobankUserDataLoading, setMonobankUserDataLoading,
        integrationWindowNameSelected, setIntegrationWindowNameSelected,
        binanceCurrencies,
        binanceSettingsEnabled, setBinanceSettingsEnabled,
        binanceApiKeyInput, setBinanceApiKeyInput,
        binanceApiSecretInput, setBinanceApiSecretInput,
        binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
        binanceUserData, setBinanceUserData,
        binanceUserDataLoading, setBinanceUserDataLoading,
    );
}
