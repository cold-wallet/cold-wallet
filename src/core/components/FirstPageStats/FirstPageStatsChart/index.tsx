import './index.css';
import React, {useMemo} from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import PieChartSvg from "../PieChartSvg";
import TreemapChartSvg from "../TreemapChartSvg";
import CurrencyRates from "../../../currencyRates/CurrencyRates";
import TreeChart from "../TreeChart";
import PieChart from "../PieChart";
import NextPageButtonSvg from "../../buttons/NextPageButtonSvg/NextPageButton.svg";
import {OkxAccount} from "../../../integrations/okx/okxApiClient";

export default function FirstPageStatsChart(
    {props}: {
        props: {
            userData: UserData,
            monobankUserData: MonobankUserData,
            binanceUserData: AccountInfo,
            okxUserData: OkxAccount,
            rates: CurrencyRates,
            firstPageChartView: string, setFirstPageChartView: React.Dispatch<React.SetStateAction<string>>,
        },
    }
) {
    const pieControls = [{
        image: props.firstPageChartView === 'tree' ? <PieChartSvg/> : <TreemapChartSvg/>,
        text: "Chart type",
        onClick: () => props.setFirstPageChartView(
            (props.firstPageChartView === 'tree') ? 'pie' : 'tree'
        ),
    }, {
        image: <NextPageButtonSvg/>,
        text: "Next Page",
        disabled: true,
        onClick: () => {
        },
    },];

    const assets = useMemo(() => {
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
            return assets
        },
        [
            props.userData,
            props.monobankUserData,
            props.binanceUserData,
        ]);

    return <div className={"chart-total-pie-box flex-box-centered flex-direction-column layer-0-themed-color"}>
        <div className="chart-total-pie-main flex-box-centered">
            {props.firstPageChartView === 'tree'
                ? <TreeChart props={{
                    assets,
                    rates: props.rates,
                }}/>
                : <PieChart props={{
                    assets,
                    rates: props.rates,
                }}/>}
        </div>
        <div className="chart-total-pie-controls flex-box flex-direction-row">{
            pieControls.map((control, i) => (
                <div key={i}
                     className={"chart-total-pie-control"
                         + (control.disabled ? " disabled" : "")
                         + " flex-box-centered flex-direction-column pad layer-1-themed-color"}
                     onClick={control.onClick}>
                    <div className="chart-total-pie-control-image flex-box-centered">{control.image}</div>
                    <div className="chart-total-pie-control-label clickable">{control.text}</div>
                </div>
            ))
        }</div>
    </div>
}
