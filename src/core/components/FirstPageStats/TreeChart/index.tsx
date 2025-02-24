import './index.css';
import React, {useMemo} from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
import noExponents from "../../../utils/noExponents";
import PriceService from "../../../services/PriceService";
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
            rates: PriceService,
        },
    }
) {

    interface Point {
        name: string,
        currency: string,
        description?: string,
        fullName?: string,
        type: AssetType,
        id?: string,
        parent?: string,
        value: number,
        percentage: number,
        color?: string,
        children?: Point[],
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.75)
    const chartWidth = isPortrait ? (window.innerWidth * 0.9) : (window.innerWidth * 0.55)

    function createChartOptions(assets: AssetDTO[]) {
        const preparedAssetsData = assets
            .map(asset => {
                if (!asset.currency.replaceAll(" ", "")) {
                    console.warn("no currency", asset)
                }
                return ({
                    name: buildHighChartsTitle(asset),
                    fullName: `${stringifyAmount(asset.amount)}&nbsp;&nbsp;&nbsp;–&nbsp;&nbsp;&nbsp;${asset.normalizedName}`,
                    description: buildHighChartsTitle(asset),
                    type: asset.type,
                    currency: asset.currency,
                    value: props.rates.transform(asset.currency, +asset.amount, "USD"),
                } as Point)
            })
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
                    fullName: `${merged.fullName}<br>${current.fullName}`,
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
                fullName: `${merged.fullName ? (merged.fullName + "<br>") : ""}${current.fullName}`,
                name: AssetType[current.type].toUpperCase(),
                id: AssetType[current.type],
                parent: "total",
                value: (merged.value || 0) + current.value,
            } as Point), {} as Point)
            unifiedAsset.children = assets
            return unifiedAsset
        }

        const assetsByCurrency = Object.values(preparedAssetsData
            .reduce((merged: { [index: string]: Point }, current: Point) => {
                const thisCurrency = merged[current.currency]
                if (thisCurrency) {
                    thisCurrency.value += +current.value
                    thisCurrency.description = `${thisCurrency.description}<br>${current.description}`;
                    thisCurrency.fullName = `${thisCurrency.fullName}<br>${current.fullName}`;
                    thisCurrency.children?.push(current)
                } else {
                    merged[current.currency] = {
                        id: current.currency,
                        description: current.name,
                        fullName: current.fullName,
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

        const extractAssets = (assetsByCurrency: Point[], i: number, bothTypesExist: boolean) => {
            assetsByCurrency = separateTooSmallAssets(assetsByCurrency)
            const resultAssets: Point[] = []
            if (assetsByCurrency.length) {
                const unifiedAsset = buildUnifiedAssetByType(assetsByCurrency)
                unifiedAsset.color = treemapColors[2];
                bothTypesExist && resultAssets.push(unifiedAsset)

                unifiedAsset.children?.forEach((assetByCurrency, i) => {
                    assetByCurrency.parent = unifiedAsset.id
                    assetByCurrency.color = treemapColors[(i % treemapColors.length)];
                    resultAssets.push(assetByCurrency)

                    assetByCurrency.children?.forEach((point, i) => {
                        point.parent = assetByCurrency.id
                        point.color = treemapColors[i];
                        resultAssets.push(point)
                    })
                })
            }
            return resultAssets
        }
        const bothTypesExist = !!(fiatAssetsByCurrency.length && cryptoAssetsByCurrency.length);

        const preparedAssets = ([] as Point[])
            .concat(extractAssets(fiatAssetsByCurrency, 0, bothTypesExist))
            .concat(extractAssets(cryptoAssetsByCurrency, 1, bothTypesExist))
            .map((point) => {
                point.percentage = point.value / onePercentOfTotal
                return point
            })

        // let allAssets = ([] as Point[])
        //     .concat(fiatAssetsByCurrency)
        //     .concat(cryptoAssetsByCurrency);
        //
        // const totalAmountAsset = allAssets
        //     .reduce((merged, current) => ({
        //         fullName: `${merged.fullName ? (merged.fullName + '<br>') : ''}${current.fullName}`,
        //         value: (merged.value || 0) + current.value,
        //         percentage: 100,
        //         name: merged.name,
        //         id: merged.id,
        //         currency: merged.currency,
        //     } as Point), {
        //         name: "Total",
        //         id: "total",
        //         currency: "Total",
        //     } as Point)
        //
        // preparedAssets.push(totalAmountAsset)

        return {
            title: false,
            subtitle: false,
            credits: false,
            series: [{
                type: "treemap",
                name: 'Assets',
                layoutAlgorithm: 'squarified',
                alternateStartingDirection: true,
                data: preparedAssets,
                // size: '80%',
                allowDrillToNode: true,
                clip: true,
                dataLabels: {
                    enabled: true
                },
                levels: [{
                    level: bothTypesExist ? 1 : 2,
                    layoutAlgorithm: 'squarified',
                    dataLabels: {
                        enabled: true,
                        align: bothTypesExist ? 'left' : 'center',
                        verticalAlign: bothTypesExist ? 'top' : 'center',
                    },
                    borderWidth: bothTypesExist ? 3 : 2,
                    // }, {
                    //     level: 1,
                    //     layoutAlgorithm: 'squarified',
                    //     dataLabels: {
                    //         enabled: true,
                    //         align: 'left',
                    //     },
                    //     // borderWidth: 3,
                }],
            }],
            chart: {
                backgroundColor: {},
                type: 'treemap',
                height: chartHeight,
                width: chartWidth,
                color: treemapColors,
            },
            tooltip: {
                pointFormat: `{point.fullName}<br/>
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

    const options = useMemo(() => createChartOptions(props.assets), [
        props.assets, isPortrait, chartHeight, chartWidth, createChartOptions
    ]);

    return <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
}
