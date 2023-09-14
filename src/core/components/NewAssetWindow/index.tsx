import './index.css';
import usdtIcon from "../../../resources/images/usdt.png";
import btcIcon from "../../../resources/images/btc.png";
import ethIcon from "../../../resources/images/eth.png";
import React, {JSX} from "react";
import binanceIntegration from "../integrations/BinanceIntegrationPad";
import okxIntegration from "../integrations/OkxIntegrationPad";
import monobankIntegration from "../integrations/MonobankIntegrationPad";
import IntegrationSettings from "../settings/IntegrationSettings";
import Props from "../Props";
import SelectIntegration from "../integrations/SelectIntegration";
import Select from "react-select";

export default function NewAssetWindow(props: Props) {

    const onNewAssetCurrencySelected = (currency: string | null) => {
        props.setNewAssetCurrency(currency);
        props.setShowCreateNewAssetWindow(false);
    }

    const buildFiatCurrencyButton = ({symbol, child}: {
        symbol: string,
        child: JSX.Element
    }) => {
        return {
            symbol,
            type: "fiat",
            imageType: "text",
            imageElement: <div className="new-asset-choose-button-symbol flex-box-centered">
                <div className={"new-asset-choose-button-image-text"}>{child}</div>
            </div>
        }
    }

    const buildCryptoCurrencyButton = ({symbol, icon}: {
        symbol: string,
        icon: string
    }) => {
        return {
            symbol,
            type: "crypto",
            imageType: "image",
            imageElement: <div className="new-asset-choose-button-image flex-box-centered">
                <img src={icon} alt={symbol} className={"new-asset-choose-button-image-icon"}/>
            </div>
        }
    }

    const currencies = [
        {symbol: "USD", child: (<>&#x24;</>)},
        {symbol: "EUR", child: (<>&euro;</>)},
        {symbol: "UAH", child: (<>&#8372;</>)},
    ].map(buildFiatCurrencyButton).concat([
        {symbol: "USDT", icon: usdtIcon},
        {symbol: "BTC", icon: btcIcon},
        {symbol: "ETH", icon: ethIcon},
    ].map(buildCryptoCurrencyButton));

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
                <div className="new-asset-choose-select-box">
                    <Select
                        classNames={{
                            container: () => "new-asset-choose-select",
                            menu: () => "new-asset-choose-select--menu",
                            menuList: () => "new-asset-choose-select--menu-list",
                        }}
                        defaultValue={null}
                        onChange={e => onNewAssetCurrencySelected(e?.value || null)}
                        options={props.currencyOptions}
                    />
                </div>
                <div className="new-asset-choose-buttons flex-box-centered">
                    {
                        currencies.map((currency, i) => (
                            <div key={i}
                                 onClick={() => onNewAssetCurrencySelected(currency.symbol)}
                                 className={"new-asset-choose-button pad layer-3-themed-color " +
                                     " flex-box-centered flex-direction-column"}>
                                {currency.imageElement}
                                <div className="new-asset-choose-button-name">{currency.symbol}</div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="new-asset-choose-box flex-box-centered flex-direction-column">
                <div className="new-asset-choose-title text-label">Choose your integration</div>
                <SelectIntegration onSelect={props.setIntegrationWindowNameSelected}/>
                <div className={"new-asset-choose-buttons flex-box-centered flex-direction-column"}>{
                    [
                        {integration: binanceIntegration, isEnabled: props.binanceSettingsEnabled},
                        {integration: okxIntegration, isEnabled: props.okxSettingsEnabled},
                        {integration: monobankIntegration, isEnabled: props.monobankSettingsEnabled},

                    ].map(({integration, isEnabled}) => integration.element(
                        () => props.setIntegrationWindowNameSelected(integration.name), isEnabled)
                    )
                }</div>
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
