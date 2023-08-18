import './index.css';
import React, {useMemo} from "react";
import AssetDTO, {AssetType} from "../../../domain/AssetDTO";
// import './../../../utils/highChartTheme'
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
            firstPageChartType: string,
        },
    }
) {

    interface Point {
        name: string,
        currency: string,
        prefix?: string,
        type: AssetType,
        y: number, // point's value
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const chartHeight = isPortrait ? (window.innerWidth * 0.7) : (window.innerHeight * 0.55)
    const chartWidth = isPortrait ? (window.innerWidth * 0.8) : (window.innerWidth * 0.55)

    const createChartOptions = (assets: AssetDTO[]) => {
        let preparedAssets: Point[] = []
        let amountPerTypeChartData: Point[] = []
        const preparedAssetsData = assets
            .map(asset => ({
                name: buildHighChartsTitle(asset),
                prefix: buildHighChartsTitle(asset),
                type: asset.type,
                currency: "USD",
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
                    prefix: "Other",
                    currency: "USD",
                    y: merged.y + current.y,
                } as Point))

            unitedSmallAsset && normalAssets.push(unitedSmallAsset);
            return normalAssets;
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

                preparedAssets = separateTooSmallAssets(preparedAssets)
                break
            }
            case "per-type": {
                let fiatAssets = preparedAssetsData.filter(asset => asset.type === AssetType.fiat);
                let cryptoAssets = preparedAssetsData.filter(asset => asset.type === AssetType.crypto);

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

                fiatAssets = separateTooSmallAssets(fiatAssets)
                cryptoAssets = separateTooSmallAssets(cryptoAssets)
                preparedAssets = fiatAssets.concat(cryptoAssets);
                break
            }
        }

        const series: any[] = [{
            allowPointSelect: true,
            name: 'TOTAL',
            innerSize: (props.firstPageChartType === "per-type") ? '55%' : 0,
            clip: false,
            animation: false,
            size: '90%',
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
        }];
        if (props.firstPageChartType === "per-type") {
            series.push({
                name: 'TOTAL',
                innerSize: 0,
                size: '44%',
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
            tooltip: {
                pointFormat: `<tspan style="color:{point.color}" x="8" dy="15">●</tspan>
                          ${props.firstPageChartType === "per-currency" ? '{point.prefix}' : ''}
                          <span>{series.name}</span>: <b>{point.y:,.2f} USD</b> ({point.percentage:.2f}%)<br/>`,
                backgroundColor: '#98d3b2',
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
