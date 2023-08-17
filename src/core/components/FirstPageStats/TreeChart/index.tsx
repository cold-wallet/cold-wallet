import './index.css';
import React from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
import './../../../utils/highChartTheme'
import noExponents from "../../../utils/noExponents";
import CurrencyRates from "../../../currencyRates/CurrencyRates";
import Highcharts from "highcharts";
import HighchartsData from "highcharts/modules/data";
import HighchartsHeatmap from "highcharts/modules/heatmap";
import HighchartsTreeChart from "highcharts/modules/treemap";
import HighchartsReact from "highcharts-react-official";

// initialize Highcharts modules
HighchartsData(Highcharts);
HighchartsHeatmap(Highcharts);
HighchartsTreeChart(Highcharts);

const treemapColors = [
    "#103b34",
    "#245741",
    "#2d6a4f",
    "#357a5b",
    "#41926d",
    "#5bac85",
    "#6ab791",
    "#78c19c",
    "#98d3b2",
    // "#b7e4c7",
    // "#d8f3dc",
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

export default function TreeChart(
    {props}: {
        props: {
            assets: AssetDTO[],
            rates: CurrencyRates,
            firstPageChartType: string,
        },
    }
) {

    interface Point {
        name: string,
        currency: string,
        prefix?: string,
        type: AssetType,
        id?: string,
        parent?: string,
        value: number,
        percentage: number,
        color?: string,
        children?: Point[],
    }

    let preparedAssets: Point[] = []

    const preparedAssetsData = props.assets
        .map(asset => ({
            name: buildHighChartsTitle(asset),
            prefix: buildHighChartsTitle(asset),
            type: asset.type,
            currency: asset.currency,
            value: props.rates.transform(asset.currency, +asset.amount, "USD"),
        } as Point))
        .sort((a, b) => b.value - a.value)

    const totalInUSD = preparedAssetsData.reduce((total, asset) => total + asset.value, 0)
    const onePercentOfTotal = totalInUSD / 100

    function separateTooSmallAssets(preparedAssetsData: Point[]) {
        const tooSmallAssets: Point[] = [];
        const normalAssets: Point[] = [];
        for (const point of preparedAssetsData) {
            (point.value < onePercentOfTotal
                ? tooSmallAssets : normalAssets).push(point);
        }

        if (tooSmallAssets.length) {
            let unitedSmallAsset = tooSmallAssets.reduce((merged, current) => ({
                name: `${merged.name}<br>${current.name}`,
                prefix: "Other",
                currency: "Other",
                id: "Other" + +AssetType[current.type],
                type: current.type,
                value: merged.value + current.value,
                percentage: merged.percentage + current.percentage,
                children: ([] as Point[]).concat(merged.children || []).concat(current.children || []),
            } as Point))
            // unitedSmallAsset.children = unitedSmallAsset.children?.map(point => {
            //     point.parent = "Other" + + AssetType[point.type];
            //     return point
            // })
            normalAssets.push(unitedSmallAsset);
        }
        return normalAssets;
    }

    function buildUnifiedAssetByType(assets: Point[]) {
        const unifiedAsset = assets.reduce((merged, current) => ({
            name: `${merged.name}<br>${current.name}`,
            prefix: AssetType[current.type].toUpperCase(),
            id: AssetType[current.type],
            value: merged.value + current.value,
        } as Point))
        // const resultAssets = assets.map(point => {
        //     point.parent = point.currency + AssetType[point.type]
        //     return point
        // });
        unifiedAsset.children = assets
        return unifiedAsset
    }

    switch (props.firstPageChartType) {
        default:
        case "total": {
            preparedAssets = separateTooSmallAssets(preparedAssetsData)
            break
        }
        case "per-currency": {
            preparedAssets = Object.values(props.assets
                .reduce((merged: { [index: string]: Point }, current: AssetDTO) => {
                    const thisCurrency = merged[current.currency]
                    if (thisCurrency) {
                        thisCurrency.value += +current.amount
                        thisCurrency.name = `${thisCurrency.name}<br>${stringifyAmount(current.amount)} ${current.name}`;
                    } else {
                        merged[current.currency] = {
                            name: `${stringifyAmount(current.amount)} ${current.name}`,
                            currency: current.currency,
                            value: +current.amount,
                        } as Point
                    }
                    return merged
                }, {}))
                .map(point => {
                    point.prefix = `<b>${point.value} ${point.currency}</b><br/>`
                    point.value = props.rates.transform(point.currency, point.value, "USD")
                    return point
                })
                .sort((a, b) => b.value - a.value)

            preparedAssets = separateTooSmallAssets(preparedAssets);
            break
        }
        case "per-type": {
            const assetsByCurrency = Object.values(preparedAssetsData
                .reduce((merged: { [index: string]: Point }, current: Point) => {
                    const thisCurrency = merged[current.currency]
                    if (thisCurrency) {
                        thisCurrency.value += +current.value
                        thisCurrency.name = `${thisCurrency.name}<br>${current.name}`;
                        thisCurrency.prefix = `<b>${thisCurrency.name}</b>`
                        thisCurrency.children?.push(current)
                    } else {
                        merged[current.currency] = {
                            id: current.currency,
                            name: current.name,
                            currency: current.currency,
                            type: current.type,
                            value: +current.value,
                            children: [current],
                        } as Point
                    }
                    return merged
                }, {}))
                .sort((a, b) => b.value - a.value)
            const fiatAssetsByCurrency = assetsByCurrency.filter(asset => asset.type === AssetType.fiat)
            const cryptoAssetsByCurrency = assetsByCurrency.filter(asset => asset.type === AssetType.crypto)

            const extractAssets = (assetsByCurrency: Point[]) => {
                assetsByCurrency = separateTooSmallAssets(assetsByCurrency)
                const resultAssets: Point[] = []
                if (assetsByCurrency.length) {
                    const unifiedAsset = buildUnifiedAssetByType(assetsByCurrency)
                    resultAssets.push(unifiedAsset)

                    unifiedAsset.children?.forEach((assetByCurrency, i) => {
                        assetByCurrency.parent = unifiedAsset.id
                        assetByCurrency.color = treemapColors[(i % treemapColors.length)];
                        resultAssets.push(assetByCurrency)

                        assetByCurrency.children?.forEach(asset => {
                            asset.parent = assetByCurrency.id
                            resultAssets.push(asset)
                        })
                    })
                }
                return resultAssets
            }
            preparedAssets = ([] as Point[]).concat(extractAssets(fiatAssetsByCurrency))
                .concat(extractAssets(cryptoAssetsByCurrency));
            break
        }
    }

    const series: any[] = [{
        type: "treemap",
        layoutAlgorithm: 'squarified',
        data: preparedAssets.map((point, i) => {
            if (props.firstPageChartType !== "per-type") {
                point.color = treemapColors[(i % treemapColors.length)];
            }
            point.percentage = point.value / onePercentOfTotal
            return point
        }),
        size: '80%',
        allowDrillToNode: true,
        //clip: false,
        animation: false,
        dataLabels: {
            enabled: true
        },
        levelIsConstant: false,
        levels: [
            {
                level: 1,
                dataLabels: {
                    enabled: true
                },
                borderWidth: 2
            }
        ],
    }];
    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.55)
    const chartWidth = isPortrait ? (window.innerWidth * 0.8) : (window.innerWidth * 0.55)

    const options = {
        title: false,
        credits: false,
        series: series,
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'treemap',
            height: chartHeight,
            width: chartWidth,
        },
        subtitle: false,
        tooltip: {
            pointFormat: `{point.name}<br/>
                          <tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                          <b>{point.value:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
        },
        plotOptions: {
            treemap: {
                colors: treemapColors,
                dataLabels: {
                    fontSize: '2rem',
                    format: '<b>{point.prefix}</b> <br>{point.percentage:.2f} %',
                    // filter: {
                    //     property: 'percentage',
                    //     operator: '>',
                    //     value: 1
                    // }
                }
            }
        },
    };

    return <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
}
