import './index.css';
import React from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import BalancePerType from "./BalancePerType";
import BalancePerCurrency from "./BalancePerCurrency";
import TotalPicture from "./TotalPicture";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
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
    // "#245741",
    "#2d6a4f",
    // "#357a5b",
    "#41926d",
    // "#5bac85",
    "#6ab791",
    // "#78c19c",
    "#98d3b2",
    // "#b7e4c7",
    // "#d8f3dc",
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

function addCommas(toMe: string | number) {
    return noExponents(toMe)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}

function stringifyAmount(amount: string | number) {
    return noExponents(addCommas(amount))
}

function buildHighChartsTitle(asset: { amount: string | number, currency: string }) {
    return `${stringifyAmount(asset.amount)} ${asset.currency}`
}

export default function PieChart(
    {props}: {
        props: {
            userData: UserData,
            monobankUserData: MonobankUserData,
            binanceUserData: AccountInfo,
            rates: CurrencyRates,
            firstPageChartType: string,
            setFirstPageChartType: React.Dispatch<React.SetStateAction<string>>,
        },
    }
) {
    const pieControls = [{
        name: 'total',
        imagePath: "./TotalPicture.svg",
        image: <TotalPicture/>,
        text: "Total",
        onClick: () => props.setFirstPageChartType('total'),
    }, {
        name: 'per-currency',
        imagePath: "./BalancePerCurrency.svg",
        image: <BalancePerCurrency/>,
        text: "Per currency",
        onClick: () => props.setFirstPageChartType('per-currency'),
    }, {
        name: 'per-type',
        imagePath: "./BalancePerType.svg",
        image: <BalancePerType/>,
        text: "Per type",
        onClick: () => props.setFirstPageChartType('per-type'),
    },];

    const assets: AssetDTO[] = [...props.userData.assets]
        .concat(MonobankUserData.getAllAssets(props.monobankUserData))
        .concat(AccountInfo.getAllAssets(props.binanceUserData))

    interface Point {
        name: string,
        currency: string,
        prefix?: string,
        type: AssetType,
        y: number, // point's value
    }

    let preparedAssets: Point[] = []
    let amountPerTypeChartData: Point[] = []

    switch (props.firstPageChartType) {
        default:
        case "total": {
            const preparedAssetsData = assets
                .map(asset => ({
                    name: buildHighChartsTitle(asset),
                    prefix: buildHighChartsTitle(asset),
                    currency: "USD",
                    y: props.rates.transform(asset.currency, +asset.amount, "USD"),
                } as Point))
                .sort((a, b) => b.y - a.y)

            const totalInUSD = preparedAssetsData.reduce((total, asset) => total + asset.y, 0)
            const onePercentOfTotal = totalInUSD / 100

            const tooSmallAssets: Point[] = [];
            const normalAssets: Point[] = [];
            preparedAssetsData.forEach(asset => (asset.y < onePercentOfTotal
                ? tooSmallAssets : normalAssets).push(asset))

            let unitedSmallAsset = tooSmallAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "Other",
                    currency: "USD",
                    y: merged.y + current.y,
                } as Point))

            unitedSmallAsset && normalAssets.push(unitedSmallAsset);
            preparedAssets = normalAssets;
            break
        }
        case "per-currency": {
            preparedAssets = Object.values(assets
                .reduce((merged: { [index: string]: Point }, current: AssetDTO) => {
                    const thisCurrency = merged[current.currency]
                    if (thisCurrency) {
                        thisCurrency.y += +current.amount
                        thisCurrency.name = `${thisCurrency.name}<br>${stringifyAmount(current.amount)} ${current.name}`;
                    } else {
                        merged[current.currency] = {
                            name: `${stringifyAmount(current.amount)} ${current.name}`,
                            currency: current.currency,
                            y: +current.amount,
                        } as Point
                    }
                    return merged
                }, {}))
                .map(point => {
                    point.prefix = `<b>${point.y} ${point.currency}</b><br/>`
                    point.y = props.rates.transform(point.currency, point.y, "USD")
                    return point
                })
                .sort((a, b) => b.y - a.y)
            break
        }
        case "per-type": {
            const preparedAssetsData = assets
                .map(asset => ({
                    name: buildHighChartsTitle(asset),
                    prefix: buildHighChartsTitle(asset),
                    currency: "USD",
                    type: asset.type,
                    y: props.rates.transform(asset.currency, +asset.amount, "USD"),
                } as Point))
                .sort((a, b) => b.y - a.y)

            const fiatAssets = preparedAssetsData.filter(asset => asset.type === AssetType.fiat);
            const cryptoAssets = preparedAssetsData.filter(asset => asset.type === AssetType.crypto);

            fiatAssets.length && amountPerTypeChartData.push(fiatAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "FIAT",
                    type: merged.type,
                    currency: "USD",
                    y: merged.y + current.y,
                })))

            cryptoAssets.length && amountPerTypeChartData.push(cryptoAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "CRYPTO",
                    type: merged.type,
                    currency: "USD",
                    y: merged.y + current.y,
                })))

            const totalInUSD = preparedAssetsData.reduce((total, asset) => total + asset.y, 0)
            const onePercentOfTotal = totalInUSD / 100

            const tooSmallFiatAssets: Point[] = [];
            const normalFiatAssets: Point[] = [];
            fiatAssets.forEach(asset => (asset.y < onePercentOfTotal
                ? tooSmallFiatAssets : normalFiatAssets).push(asset))

            let unitedSmallFiatAsset = tooSmallFiatAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "Other",
                    currency: "USD",
                    y: merged.y + current.y,
                } as Point))

            unitedSmallFiatAsset && normalFiatAssets.push(unitedSmallFiatAsset);

            const tooSmallCryptoAssets: Point[] = [];
            const normalCryptoAssets: Point[] = [];
            cryptoAssets.forEach(asset => (asset.y < onePercentOfTotal
                ? tooSmallCryptoAssets : normalCryptoAssets).push(asset))

            let unitedSmallCryptoAsset = tooSmallCryptoAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "Other",
                    currency: "USD",
                    y: merged.y + current.y,
                } as Point))

            unitedSmallCryptoAsset && normalCryptoAssets.push(unitedSmallCryptoAsset);

            preparedAssets = normalFiatAssets.concat(normalCryptoAssets);
            break
        }
    }

    const series = [{
        allowPointSelect: true,
        name: 'TOTAL',
        innerSize: (props.firstPageChartType === "per-type") ? '55%' : 0,
        size: '80%',
        accessibility: {
            announceNewData: {
                enabled: true
            },
        },
        dataLabels: {
            distance: 20,
            filter: {
                property: 'percentage',
                operator: '>',
                value: 1
            }
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
    if (props.firstPageChartType === "per-type") {
        series.push({
            name: 'TOTAL',
            innerSize: 0,
            size: '40%',
            accessibility: {
                announceNewData: {
                    enabled: true
                },
            },
            dataLabels: {
                distance: -20,
                filter: {
                    property: 'percentage',
                    operator: '>',
                    value: 0
                }
            },
            allowPointSelect: false,
            data: amountPerTypeChartData,
        });
        chartOptions.options3d.enabled = false;
    }
    const options = {
        chart: chartOptions,
        title: {
            text: '',
        },
        tooltip: {
            pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                          ${props.firstPageChartType === "per-currency" ? '{point.prefix}' : ''}
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
                    format: '<b>{point.prefix}</b>&nbsp;<br>{point.percentage:.2f} %',
                    distance: 20,
                    filter: {
                        property: 'percentage',
                        operator: '>',
                        value: 1
                    }
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
                     className={"chart-total-pie-control"
                         + (props.firstPageChartType === control.name ? " chart-total-pie-control--active" : "")
                         + " flex-box-centered flex-direction-column pad layer-1-themed-color"}
                     onClick={control.onClick}>
                    <div className="chart-total-pie-control-image">{control.image}</div>
                    <div className="chart-total-pie-control-label clickable">{control.text}</div>
                </div>
            ))
        }</div>
    </div>
}
