import './index.css';
import usdtIcon from "./../../../../resources/images/usdt.png";
import btcIcon from "./../../../../resources/images/btc.png";
import ethIcon from "./../../../../resources/images/eth.png";
import compareStrings from "./../../../utils/compareStrings";
import BinanceSvg from "./../../../../resources/images/binanceSvg";
import QmallSvg from "./../../../../resources/images/qmallSvg";
import MonobankSvg from "./../../../../resources/images/monobankSvg";
import React from "react";
import ModalWindow from "../../ModalWindow";

export default function NewAssetWindow(
    setNewAssetCurrency,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    monobankCurrencies,
    binanceCurrencies,
    userData,
) {

    const onNewAssetCurrencySelected = (currency) => {
        setNewAssetCurrency(currency);
        setShowCreateNewAssetWindow(false);
    }

    const onNewAssetIntegrationSelected = (integration) => {
        alert(integration)
    }

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

    const otherAssetsExist = !!(userData?.assets?.length);

    const onClose = () => {
        if (!otherAssetsExist) {
            return;
        }
        setShowCreateNewAssetWindow(false);
        setCreatingNewAsset(false);
    }

    return <ModalWindow
        onCancel={onClose}
        large={true}
        closeable={otherAssetsExist}
        title={<div className="create-new-asset-window-title text-label flex-box-centered">Create new asset</div>}
        children={
            <div className="new-asset-controls-box flex-box-centered flex-direction-row">
                <div className="new-asset-choose-box flex-box-centered flex-direction-column">
                    <div className="new-asset-choose-title text-label">Enter asset value manually</div>
                    <div className="new-asset-choose-buttons flex-box-centered">
                        {
                            currencies.map((currency, i) => (
                                <div key={i}
                                     onClick={() => onNewAssetCurrencySelected(currency.name)}
                                     className={"new-asset-choose-button button layer-3-themed-color " +
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
                    <div className={"new-asset-choose-buttons flex-box-centered flex-direction-column"}>
                        {
                            chooseIntegrations.map((integration, i) => (
                                <div key={i}
                                     onClick={() => onNewAssetIntegrationSelected(integration.name)}
                                     className={"new-asset-integration flex-box-centered" +
                                     " flex-direction-row button layer-3-themed-color"}>
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
                                onChange={e => onNewAssetIntegrationSelected(e.target.value)}>
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
        }/>
}
