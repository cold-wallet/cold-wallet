import './index.css';
import React, {useMemo} from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
import noExponents from "../../../utils/noExponents";
import CurrencyRates from "../../../currencyRates/CurrencyRates";
import Highcharts from "highcharts";
import highCharts3d from 'highcharts/highcharts-3d'
import HighchartsReact from "highcharts-react-official";

highCharts3d(Highcharts);

const pieColors = [
    "#103b34",
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
            rates: CurrencyRates,
        },
    }
) {

    interface Point {
        name: string,
        currency: string,
        prefix?: string,
        type: AssetType,
        trueAmount: number,
        y: number, // point's value
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.75)
    const chartWidth = isPortrait ? (window.innerWidth * 0.8) : (window.innerWidth * 0.55)

    const createChartOptions = (assets: AssetDTO[]) => {
        let amountPerTypeChartData: Point[] = []
        const preparedAssetsData = assets
            .map(asset => ({
                name: buildHighChartsTitle(asset),
                prefix: buildHighChartsTitle(asset),
                type: asset.type,
                currency: asset.currency,
                trueAmount: +asset.amount,
                y: props.rates.transform(asset.currency, +asset.amount, "USD"),
            } as Point))
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
                    y: merged.y + current.y,
                } as Point))

            unitedSmallAsset && normalAssets.push(unitedSmallAsset);
            return normalAssets;
        }

        let fiatAssets = preparedAssetsData.filter(asset => asset.type === AssetType.fiat);
        let cryptoAssets = preparedAssetsData.filter(asset => asset.type === AssetType.crypto);

        fiatAssets.length && amountPerTypeChartData.push(fiatAssets
            .reduce((merged, current) => ({
                name: `${merged.name}<br>${current.name}`,
                prefix: "FIAT",
                type: merged.type,
                currency: AssetType[merged.type],
                y: merged.y + current.y,
            } as Point)))

        cryptoAssets.length && amountPerTypeChartData.push(cryptoAssets
            .reduce((merged, current) => ({
                name: `${merged.name}<br>${current.name}`,
                prefix: "CRYPTO",
                type: merged.type,
                currency: AssetType[merged.type],
                y: merged.y + current.y,
            } as Point)))

        function extractPerCurrencyAssets(assets: Point[]) {
            return separateTooSmallAssets(Object.values(assets
                .reduce((merged: { [index: string]: Point }, current: Point) => {
                    const thisCurrency = merged[current.currency]
                    if (thisCurrency) {
                        thisCurrency.y += +current.y
                        thisCurrency.trueAmount += current.trueAmount
                        thisCurrency.name = `${thisCurrency.name}<br>${current.name}`;
                    } else {
                        merged[current.currency] = {
                            name: current.name,
                            currency: current.currency,
                            type: current.type,
                            y: +current.y,
                            trueAmount: current.trueAmount,
                        } as Point
                    }
                    return merged
                }, {}))
                .map(point => {
                    point.prefix = `<b>${stringifyAmount(point.trueAmount)} ${point.currency}</b><br/>`
                    return point
                }))
        }

        const perCurrencyFiat = extractPerCurrencyAssets(fiatAssets)
        const perCurrencyCrypto = extractPerCurrencyAssets(cryptoAssets)
        const perCurrencyChartData = perCurrencyFiat.concat(perCurrencyCrypto);
        const preparedAssets = fiatAssets.concat(cryptoAssets);

        const series: any[] = [{
            allowPointSelect: true,
            name: 'TOTAL',
            clip: false,
            animation: false,
            size: '95%',
            innerSize: '65%',
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
        }, {
            name: 'Per Currency',
            size: '57%',
            innerSize: '50%',
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
        }, {
            name: 'Per Type',
            innerSize: 0,
            size: '24%',
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
        }];
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
                          <span>{series.name}</span>: <b>{point.y:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
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

    const options = useMemo(() => createChartOptions(props.assets), [props.assets]);

    return <HighchartsReact highcharts={Highcharts} options={options}/>
}
