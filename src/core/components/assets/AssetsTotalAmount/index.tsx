import React, {useMemo} from "react";
import './index.css';
import Props from "../../Props";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import {OkxAccount} from "../../../integrations/okx/okxApiClient";
import noExponents from "../../../utils/noExponents";
import {NumericFormat} from "react-number-format";

export default function AssetsTotalAmount({props}: { props: Props }) {
    const assetsTotal = useMemo(() => {
            let assets = [...props.userData.assets];
            if (props.userData.settings.binanceIntegrationEnabled) {
                assets = assets.concat(AccountInfo.getAllAssets(props.binanceUserData))
            }
            if (props.userData.settings.monobankIntegrationEnabled) {
                assets = assets.concat(MonobankUserData.getAllAssets(props.monobankUserData))
            }
            if (props.userData.settings.okxIntegrationEnabled) {
                assets = assets.concat(OkxAccount.getAllAssets(props.okxUserData))
            }
            if (props.metaMaskSettingsEnabled && props.metaMaskAssets) {
                assets = assets.concat((props.metaMaskAssets))
            }
            return Object.values(props.ccxtUserData)
                .reduce((merged, current) => {
                    return merged.concat(current)
                }, assets)
                .map(asset => {
                    if (!asset.currency.replaceAll(" ", "")) {
                        console.warn("no currency", asset)
                    }
                    return props.priceService.transform(asset.currency, +asset.amount, "USD")
                })
                .reduce((a, b) => +(a || 0) + +(b || 0))
        },
        [
            props.userData,
            props.monobankUserData,
            props.binanceUserData,
            props.okxUserData,
        ]);

    return (<div className={"assets-total-amount"}>
        <div>Total: $<NumericFormat
            allowLeadingZeros={false}
            allowNegative={false}
            isNumericString={true}
            displayType={"text"}
            decimalScale={2}
            thousandSeparator={true}
            value={noExponents(assetsTotal)}
            //renderText={value => (
            //    <div className={"assets-total-amount--text"}>{value}</div>
            //)}
        /></div>
    </div>)
}
