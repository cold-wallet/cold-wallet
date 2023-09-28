import './index.css';
import React, {useMemo} from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
import noExponents from "../../../utils/noExponents";
import PriceService from "../../../services/PriceService";
import Highcharts from "highcharts";
import highCharts3d from 'highcharts/highcharts-3d'
import HighchartsReact from "highcharts-react-official";
import numberFormat from "../../../utils/numberFormat";

highCharts3d(Highcharts);

const pieColors = [
    "#1a5048",
    "#2d6a4f",
    "#41926d",
    "#6ab791",
    "#98d3b2",
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
            assets: AssetDTO[],
            rates: PriceService,
        },
    }
) {

    interface Point {
        name: string,
        currency: string,
        prefix?: string,
        type: AssetType,
        trueAmount: number,
        decimalScale: number,
        y: number, // point's value
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const chartWidth = isPortrait ? (window.innerWidth) : (window.innerWidth * 0.6)
    const chartHeight = isPortrait ? (window.innerWidth * 0.65)
        : Math.min(window.innerHeight * 0.7, chartWidth * 0.65)

    const createChartOptions = (assets: AssetDTO[]) => {
        let amountPerTypeChartData: Point[] = []
        const preparedAssetsData = assets
            .map(asset => {
                let y = props.rates.transform(asset.currency, +asset.amount, "USD");
                if (isNaN(y)) {
                    console.warn("!!!!!") // for debugging, in case this happen once more
                    y = props.rates.transform(asset.currency, +asset.amount, "USD");
                }
                return ({
                    prefix: buildHighChartsTitle(asset),
                    name: `${stringifyAmount(asset.amount)}&nbsp;&nbsp;&nbsp;–&nbsp;&nbsp;&nbsp;${asset.normalizedName}`,
                    type: asset.type,
                    currency: asset.currency,
                    trueAmount: +asset.amount,
                    decimalScale: asset.decimalScale,
                    y: y,
                } as Point)
            })
            .sort((a, b) => b.y - a.y)

        const totalInUSD = preparedAssetsData.reduce((total, asset) => total + asset.y, 0)
        const onePercentOfTotal = totalInUSD / 100

        function separateTooSmallAssets(preparedAssetsData: Point[]) {
            const tooSmallAssets: Point[] = [];
            const normalAssets: Point[] = [];
            preparedAssetsData.forEach(asset => (asset.y < onePercentOfTotal
                ? tooSmallAssets : normalAssets).push(asset))

            let unitedSmallAsset = tooSmallAssets.length && tooSmallAssets
                .reduce((merged, current) => ({
                    name: `${merged.name}<br>${current.name}`,
                    prefix: "Other " + AssetType[current.type],
                    currency: "other" + AssetType[current.type],
                    trueAmount: merged.trueAmount + current.trueAmount,
                    decimalScale: Math.max(merged.decimalScale, current.decimalScale),
                    y: merged.y + current.y,
                } as Point))

            unitedSmallAsset && normalAssets.push(unitedSmallAsset);
            return normalAssets;
        }

        let fiatAssets = preparedAssetsData.filter(asset => asset.type === AssetType.fiat);
        let cryptoAssets = preparedAssetsData.filter(asset => asset.type === AssetType.crypto);

        function extractAssetByType(assets: Point[]) {
            if (assets.length === 1) {
                return {
                    ...assets[0],
                    prefix: AssetType[assets[0].type].toUpperCase(),
                    currency: AssetType[assets[0].type],
                }
            }
            return assets.reduce((merged, current) => ({
                name: `${merged.name}<br>${current.name}`,
                prefix: AssetType[merged.type].toUpperCase(),
                type: merged.type,
                currency: AssetType[merged.type],
                decimalScale: Math.max(merged.decimalScale, current.decimalScale),
                y: merged.y + current.y,
            } as Point))
        }

        fiatAssets.length && amountPerTypeChartData.push(extractAssetByType(fiatAssets))
        cryptoAssets.length && amountPerTypeChartData.push(extractAssetByType(cryptoAssets))

        const totalAmountAsset = amountPerTypeChartData.reduce((merged, current) => ({
            name: `${merged.name}<br>${current.name}`,
            prefix: isPortrait ? "" : "Total",
            currency: "Total",
            decimalScale: Math.max(merged.decimalScale, current.decimalScale),
            y: merged.y + current.y,
        } as Point))

        function extractPerCurrencyAssets(assets: Point[]): [Point[], boolean] {
            let atLeastOneIsBiggerThatOnePercent = false;
            const assetsPerCurrency = Object.values(assets
                .reduce((merged: { [index: string]: Point }, current: Point) => {
                    const thisCurrency = merged[current.currency]
                    if (thisCurrency) {
                        if (current.y >= 0.01) {
                            atLeastOneIsBiggerThatOnePercent = true
                        }
                        thisCurrency.y += current.y
                        thisCurrency.trueAmount += current.trueAmount
                        thisCurrency.name = `${thisCurrency.name}<br>${current.name}`;
                        thisCurrency.decimalScale = Math.max(thisCurrency.decimalScale, current.decimalScale)
                    } else {
                        merged[current.currency] = {
                            name: `${current.name}`,
                            currency: current.currency,
                            type: current.type,
                            y: current.y,
                            trueAmount: current.trueAmount,
                            decimalScale: current.decimalScale,
                        } as Point
                    }
                    return merged
                }, {}))
                .map(point => {
                    const amount = stringifyAmount(numberFormat(point.trueAmount, point.decimalScale));
                    point.prefix = `<b>${amount} ${point.currency}</b><br/>`
                    return point
                });
            return [separateTooSmallAssets(assetsPerCurrency), atLeastOneIsBiggerThatOnePercent]
        }

        const [perCurrencyFiat, shouldShowPerGroupFiat] = extractPerCurrencyAssets(fiatAssets)
        const [perCurrencyCrypto, shouldShowPerGroupCrypto] = extractPerCurrencyAssets(cryptoAssets)
        const perCurrencyChartData = perCurrencyFiat.concat(perCurrencyCrypto);
        const preparedAssets = fiatAssets.concat(cryptoAssets);

        const showPerCurrency = (perCurrencyFiat.length + perCurrencyCrypto.length < assets.length)
            && (shouldShowPerGroupFiat || shouldShowPerGroupCrypto)
        const showPerType = perCurrencyFiat.length && perCurrencyCrypto.length
            && (perCurrencyFiat.length > 1 || perCurrencyCrypto.length > 1)
        const showTotal = perCurrencyFiat.length + perCurrencyCrypto.length > 1;

        const series: any[] = [{
            allowPointSelect: true,
            name: 'Asset',
            clip: false,
            animation: false,
            size: '95%',
            innerSize: showPerCurrency ? '65%' : showPerType ? '30%' : showTotal ? '37%' : 0,
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
            data: preparedAssets,
        }]
        if (showPerCurrency) {
            series.push({
                name: 'Per Currency',
                size: '57%',
                animation: false,
                innerSize: showPerType ? '50%' : showTotal ? '15%' : 0,
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
                        value: 1
                    }
                },
                allowPointSelect: false,
                data: perCurrencyChartData,
            })
        }

        if (showPerType) {
            series.push({
                name: 'Per Type',
                size: '24%',
                animation: false,
                innerSize: showTotal ? '35%' : 0,
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
                        value: 1
                    }
                },
                allowPointSelect: false,
                data: amountPerTypeChartData,
            });
        }
        if (showTotal) {
            series.push({
                name: 'Total',
                innerSize: 0,
                animation: false,
                size: showPerCurrency || showPerType ? '4%' : '30%',
                accessibility: {
                    announceNewData: {
                        enabled: true
                    },
                },
                dataLabels: {
                    distance: -20,
                    enabled: chartHeight >= 450// !isPortrait,
                },
                allowPointSelect: false,
                data: [totalAmountAsset],
            })
        }
        return {
            chart: {
                backgroundColor: {},
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie',
                height: chartHeight,
                width: chartWidth,
                style: {
                    width: "100%",
                    height: "100%",
                },
            },
            title: false,
            credits: false,
            tooltip: {
                pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                            <span>{series.name}</span>: <b>{point.y:,.2f} USD</b>&nbsp;({point.percentage:.2f}%)<br/>`,
                backgroundColor: '#b7e4c7',
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
                    borderRadius: 5,
                    colors: pieColors,
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.prefix}</b> <br>{point.percentage:.2f} %',
                        distance: 20,
                        filter: {
                            property: 'percentage',
                            operator: '>',
                            value: 1
                        }
                    }
                },
            },
            series: series,
        };
    }

    const options = useMemo(() => createChartOptions(props.assets), [
        props.assets, isPortrait, chartHeight, chartWidth, createChartOptions
    ]);

    return <HighchartsReact highcharts={Highcharts} options={options}/>
}
