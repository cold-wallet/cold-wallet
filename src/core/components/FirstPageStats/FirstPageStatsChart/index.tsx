import './index.css';
import React, {useMemo} from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import PieChartPerType from "../PieChartPerType";
import PieChartPerCurrency from "../PieChartPerCurrency";
import PieChartTotal from "../PieChartTotal";
import SwitchToTreemapChartType from "./../SwitchToTreemapChartType";
import CurrencyRates from "../../../currencyRates/CurrencyRates";
import TreeChart from "../TreeChart";
import PieChart from "../PieChart";
import TreemapPerCurrency from "../TreemapPerCurrency";

export default function FirstPageStatsChart(
    {props}: {
        props: {
            userData: UserData,
            monobankUserData: MonobankUserData,
            binanceUserData: AccountInfo,
            rates: CurrencyRates,
            firstPageChartType: string,
            setFirstPageChartType: React.Dispatch<React.SetStateAction<string>>,
            firstPageChartView: string,
            setFirstPageChartView: React.Dispatch<React.SetStateAction<string>>,
        },
    }
) {
    const pieControls = [{
        image: props.firstPageChartView === 'tree' ? <PieChartTotal/> : <SwitchToTreemapChartType/>,
        text: "Chart type",
        onClick: () => props.setFirstPageChartView(
            (props.firstPageChartView === 'tree') ? 'pie' : 'tree'
        ),
    }, {
        name: 'total',
        image: props.firstPageChartView === 'pie' ? <PieChartTotal/> : <SwitchToTreemapChartType/>,
        text: "Total",
        onClick: () => props.setFirstPageChartType('total'),
    }, {
        name: 'per-currency',
        image: props.firstPageChartView === 'pie' ? <PieChartPerCurrency/> : <TreemapPerCurrency/>,
        text: "Per currency",
        onClick: () => props.setFirstPageChartType('per-currency'),
    }, {
        name: 'per-type',
        image: props.firstPageChartView === 'pie' ? <PieChartPerType/> : <SwitchToTreemapChartType/>,
        text: "Per type",
        onClick: () => props.setFirstPageChartType('per-type'),
    },];

    const assets = useMemo(() => [...props.userData.assets]
            .concat(MonobankUserData.getAllAssets(props.monobankUserData))
            .concat(AccountInfo.getAllAssets(props.binanceUserData)),
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
                    firstPageChartType: props.firstPageChartType,
                }}/>
                : <PieChart props={{
                    assets,
                    rates: props.rates,
                    firstPageChartType: props.firstPageChartType,
                }}/>}
        </div>
        <div className="chart-total-pie-controls flex-box-centered flex-direction-row">{
            pieControls.map((control, i) => (
                <div key={i}
                     className={"chart-total-pie-control"
                         + (props.firstPageChartType === control.name ? " chart-total-pie-control--active" : "")
                         + " flex-box-centered flex-direction-column pad layer-1-themed-color"}
                     onClick={control.onClick}>
                    <div className="chart-total-pie-control-image flex-box-centered">{control.image}</div>
                    <div className="chart-total-pie-control-label clickable">{control.text}</div>
                </div>
            ))
        }</div>
    </div>
}
