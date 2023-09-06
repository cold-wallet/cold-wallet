import './index.css';
import usdtIcon from "../../../resources/images/usdt.png";
import btcIcon from "../../../resources/images/btc.png";
import ethIcon from "../../../resources/images/eth.png";
import compareStrings from "../../utils/compareStrings";
import React, {JSX} from "react";
import thirdPartyIntegrations from "../integrations/ThirdPartyIntegrations";
import binanceIntegration from "../integrations/BinanceIntegrationPad";
import okxIntegration from "../integrations/OkxIntegrationPad";
import monobankIntegration from "../integrations/MonobankIntegrationPad";
import IntegrationSettings from "../settings/IntegrationSettings";
import Props from "../Props";

export default function NewAssetWindow(props: Props) {

    const onNewAssetCurrencySelected = (currency: string | null) => {
        props.setNewAssetCurrency(currency);
        props.setShowCreateNewAssetWindow(false);
    }

    const onNewAssetIntegrationSelected = (integration: string | null) => {
        props.setIntegrationWindowNameSelected(integration)
    }

    function buildFiatCurrencyButton([name, child]) {
        return {
            name,
            type: "fiat",
            imageType: "text",
            imageElement: <div className="new-asset-choose-button-symbol flex-box-centered">
                <div className={"new-asset-choose-button-image-text"}>{child}</div>
            </div>
        }
    }

    function buildCryptoCurrencyButton([name, icon]) {
        return {
            name,
            type: "crypto",
            imageType: "image",
            imageElement: <div className="new-asset-choose-button-image flex-box-centered">
                <img src={icon} alt={name} className={"new-asset-choose-button-image-icon"}/>
            </div>
        }
    }

    const currencies = [
        ["USD", (<>&#x24;</>)],
        ["EUR", (<>&euro;</>)],
        ["UAH", (<>&#8372;</>)],
    ].map(buildFiatCurrencyButton).concat([
        ["USDT", usdtIcon],
        ["BTC", btcIcon],
        ["ETH", ethIcon],
    ].map(buildCryptoCurrencyButton));

    let totalCurrencies = Object.keys(props.monobankCurrencies || {})
        .concat(props.binanceCurrencies ? Object.keys(props.binanceCurrencies) : []);

    const selectCurrencies = Object.keys(totalCurrencies
        .reduce((result, value) => {
            result[value] = true;
            return result
        }, {}))
        .sort(compareStrings);

    const onClose = () => {
        props.stateReset()
        if (!props.anyAssetExist) {
            props.setShowCreateNewAssetWindow(true);
            props.setCreatingNewAsset(true);
        }
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
                        {integration: binanceIntegration, isEnabled: props.binanceSettingsEnabled},
                        {integration: okxIntegration, isEnabled: props.okxSettingsEnabled},
                        {integration: monobankIntegration, isEnabled: props.monobankSettingsEnabled},

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
        props.anyAssetExist,
        true,
        "Create new asset",
        onClose,
        (props.integrationWindowNameSelected !== null),
        props,
    );
}
