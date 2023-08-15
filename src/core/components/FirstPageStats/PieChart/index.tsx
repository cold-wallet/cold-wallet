import './index.css';
import React from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import BalancePerType from "./BalancePerType";
import BalancePerCurrency from "./BalancePerCurrency";
import TotalPicture from "./TotalPicture";
import AssetDTO from "../../../domain/AssetDTO";
import HighchartsReact from "highcharts-react-official"
import Highcharts from 'highcharts'
import highCharts3d from 'highcharts/highcharts-3d'
import './../../../utils/highChartTheme'
import noExponents from "../../../utils/noExponents";
import CurrencyRates from "../../../currencyRates/CurrencyRates";

// -> Load Highcharts modules
highCharts3d(Highcharts);
// treemap(Highcharts);

const pieColors = [
    "#103b34",
    "#245741",
    "#2d6a4f",
    "#357a5b",
    "#41926d",
    "#5bac85",
    "#6ab791",
    "#78c19c",
    "#98d3b2",
    "#b7e4c7",
    "#d8f3dc",
];

const colorScale = [
    "#40916c",
    "#52b788",
    "#74c69d",
    "#95d5b2",
    "#a6ddbd",
    "#b7e4c7",
    "#d8f3dc",
];

function addCommas(toMe: string) {
    return noExponents(toMe)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}

function buildHighChartsTitle(asset: AssetDTO) {
    const amount = noExponents(addCommas(asset.amount));
    return `${amount} ${asset.currency}`
}

export default function PieChart(
    {
        userData, monobankUserData, binanceUserData, rates,
    }: {
        userData: UserData,
        monobankUserData: MonobankUserData,
        binanceUserData: AccountInfo,
        rates: CurrencyRates,
    }
) {
    const pieControls = [{
        imagePath: "./TotalPicture.svg",
        image: <TotalPicture/>,
        text: "Total",
        onClick: () => {
        },
    }, {
        imagePath: "./BalancePerCurrency.svg",
        image: <BalancePerCurrency/>,
        text: "Per currency",
        onClick: () => {
        },
    }, {
        imagePath: "./BalancePerType.svg",
        image: <BalancePerType/>,
        text: "Per type",
        onClick: () => {
        },
    },];

    const assets: AssetDTO[] = [...userData.assets]
        .concat(MonobankUserData.getAllAssets(monobankUserData))
        .concat(AccountInfo.getAllAssets(binanceUserData))

    interface Point {
        name: string,
        y: number,
    }

    const preparedAssetsData = assets
        .map(asset => ({
            name: buildHighChartsTitle(asset),
            y: rates.transform(asset.currency, +asset.amount, "USD"),
        } as Point))
        .sort((a, b) => b.y - a.y)

    const totalInUSD = preparedAssetsData.reduce((total, asset) => total + asset.y, 0)
    const onePercentOfTotal = totalInUSD / 100

    const tooSmallAssets: Point[] = [];
    const normalAssets: Point[] = [];
    preparedAssetsData.forEach(asset => (asset.y < onePercentOfTotal
        ? tooSmallAssets : normalAssets).push(asset))

    let unitedSmallAsset = tooSmallAssets.reduce((merged: Point | null, current: Point) => merged ? ({
        name: `${merged.name}\n${current.name}`,
        y: merged.y + current.y,
    } as Point) : current, null)

    const preparedAssets = normalAssets;
    unitedSmallAsset && preparedAssets.push(unitedSmallAsset)

    const series = [{
        allowPointSelect: true,
        name: 'TOTAL',
        innerSize: /*(pieChartType === "per-type") ? '55%' :*/ 0,
        size: '80%',
        accessibility: {
            announceNewData: {
                enabled: true
            },
        },
        dataLabels: {
            distance: 20,
            // filter: {
            //     property: 'percentage',
            //     operator: '>',
            //     value: 1
            // }
        },
        data: preparedAssets
    }];
    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.55)
    const chartWidth = isPortrait ? (window.innerWidth * 0.8) : (window.innerWidth * 0.6)

    const chartOptions = {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        options3d: {
            enabled: true,
            alpha: 35,
            beta: 0,
            frame: {
                left: {
                    size: 0,
                    visible: false
                }
            }
        },
        height: chartHeight,
        width: chartWidth,
        style: {
            width: "100%",
            height: "100%",
        },
    };

    const options = {
        chart: chartOptions,
        title: {
            text: '',
        },
        tooltip: {
            pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                          <span>{series.name}</span>: <b>{point.y:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
        },
        accessibility: {
            enabled: false,
            announceNewData: {
                enabled: true
            },
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: 35,
                colors: pieColors,
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>&nbsp;<br>{point.percentage:.2f} %',
                    distance: 20,
                    // filter: {
                    //     property: 'percentage',
                    //     operator: '>',
                    //     value: 1
                    // }
                }
            }
        },
        series: series,
    };

    return <div className={"chart-total-pie-box flex-box-centered flex-direction-column layer-0-themed-color"}>
        <div className="chart-total-pie-main flex-box-centered">
            <HighchartsReact
                key={"highChart"}
                highcharts={Highcharts}
                options={options}
            />
        </div>
        <div className="chart-total-pie-controls flex-box-centered flex-direction-row">{
            pieControls.map((control, i) => (
                <div key={i}
                     className="chart-total-pie-control flex-box-centered flex-direction-column pad layer-1-themed-color"
                     onClick={control.onClick}>
                    <div className="chart-total-pie-control-image">{control.image}</div>
                    <div className="chart-total-pie-control-label clickable">{control.text}</div>
                </div>
            ))
        }</div>
    </div>
}
