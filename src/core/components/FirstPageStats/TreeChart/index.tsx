import './index.css';
import React, {useMemo} from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
import noExponents from "../../../utils/noExponents";
import CurrencyRates from "../../../currencyRates/CurrencyRates";
import Highcharts from "highcharts";
import HighchartsData from "highcharts/modules/data";
import Accessibility from "highcharts/modules/accessibility";
import HighchartsHeatmap from "highcharts/modules/heatmap";
import HighchartsTreeChart from "highcharts/modules/treemap";
import HighchartsReact from "highcharts-react-official";

// initialize Highcharts modules
HighchartsData(Highcharts);
Accessibility(Highcharts);
HighchartsHeatmap(Highcharts);
HighchartsTreeChart(Highcharts);

const treemapColors = [
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
        description?: string,
        type: AssetType,
        id?: string,
        parent?: string,
        value: number,
        percentage: number,
        color?: string,
        children?: Point[],
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.55)
    const chartWidth = isPortrait ? (window.innerWidth * 0.8) : (window.innerWidth * 0.55)

    const createChartOptions = (assets: AssetDTO[]) => {
        let preparedAssets: Point[] = []

        const preparedAssetsData = assets
            .map(asset => ({
                name: buildHighChartsTitle(asset),
                description: buildHighChartsTitle(asset),
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
                    description: `${merged.description}<br>${current.description}`,
                    name: "Other " + AssetType[current.type],
                    currency: "Other",
                    id: "Other" + AssetType[current.type],
                    type: current.type,
                    value: merged.value + current.value,
                    percentage: merged.percentage + current.percentage,
                    children: ([] as Point[]).concat(merged.children || []).concat(current.children || []),
                } as Point))
                normalAssets.push(unitedSmallAsset);
            }
            return normalAssets;
        }

        function buildUnifiedAssetByType(assets: Point[]) {
            const unifiedAsset = assets.reduce((merged, current) => ({
                description: `${merged.description ? (merged.description + "<br>") : ""}${current.description}`,
                name: AssetType[current.type].toUpperCase(),
                id: AssetType[current.type],
                value: (merged.value || 0) + current.value,
            } as Point), {} as Point)
            console.log("uni", unifiedAsset)
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
                preparedAssets = Object.values(assets
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
                        point.name = `<b>${point.value} ${point.currency}</b><br/>`
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
                            thisCurrency.description = `${thisCurrency.description}<br>${current.description}`;
                            thisCurrency.children?.push(current)
                        } else {
                            merged[current.currency] = {
                                id: current.currency,
                                description: current.name,
                                name: "Total " + current.currency,
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

                const extractAssets = (assetsByCurrency: Point[], i: number) => {
                    assetsByCurrency = separateTooSmallAssets(assetsByCurrency)
                    const resultAssets: Point[] = []
                    if (assetsByCurrency.length) {
                        const unifiedAsset = buildUnifiedAssetByType(assetsByCurrency)
                        unifiedAsset.color = treemapColors[(i % treemapColors.length)];
                        resultAssets.push(unifiedAsset)

                        unifiedAsset.children?.forEach((assetByCurrency, i) => {
                            assetByCurrency.parent = unifiedAsset.id
                            assetByCurrency.color = treemapColors[(i % treemapColors.length)];
                            resultAssets.push(assetByCurrency)

                            assetByCurrency.children?.forEach((point, i) => {
                                point.parent = assetByCurrency.id
                                point.color = treemapColors[(i % treemapColors.length)];
                                resultAssets.push(point)
                            })
                        })
                    }
                    return resultAssets
                }
                preparedAssets = ([] as Point[]).concat(extractAssets(fiatAssetsByCurrency, 1))
                    .concat(extractAssets(cryptoAssetsByCurrency, 2));
                break
            }
        }
        return {
            title: false,
            subtitle: false,
            credits: false,
            series: [{
                type: "treemap",
                name: 'Assets',
                layoutAlgorithm: 'squarified',
                alternateStartingDirection: true,
                data: preparedAssets.map((point, i) => {
                    if (props.firstPageChartType !== "per-type") {
                        point.color = treemapColors[(i % treemapColors.length)];
                    }
                    point.percentage = point.value / onePercentOfTotal
                    return point
                }),
                // size: '80%',
                allowDrillToNode: true,
                clip: true,
                animation: false,
                dataLabels: {
                    enabled: true
                },
                levels: [{
                    level: 1,
                    layoutAlgorithm: 'squarified',
                    dataLabels: {
                        enabled: true,
                        align: 'left',
                        verticalAlign: 'top',
                    },
                    borderWidth: 3,
                    levelIsConstant: false,
                }],
            }],
            chart: {
                backgroundColor: {},
                type: 'treemap',
                height: chartHeight,
                width: chartWidth,
            },
            tooltip: {
                pointFormat: `{point.description}<br/>
                          <tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                          <b>{point.value:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
                backgroundColor: '#98d3b2',
            },
            plotOptions: {
                treemap: {
                    colors: treemapColors,
                    dataLabels: {
                        fontSize: '2rem',
                        format: '<b>{point.name}</b> <br>{point.percentage:.2f} %',
                    }
                }
            },
        }
    }

    const options = useMemo(() => createChartOptions(props.assets), [props.assets]);

    return <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
}
