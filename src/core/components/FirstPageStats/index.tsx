import './index.css'
import React, {lazy, Suspense} from "react";
import LoadingWindow from "../LoadingWindow";
import Props from "../Props";

const FirstPageStatsChart = lazy(() => delayForDemo(import('./FirstPageStatsChart')));

function delayForDemo(promise: Promise<any>) {
    return new Promise(resolve => {
        setTimeout(resolve, 1000);
    }).then(() => promise);
}

export default function FirstPageStats(props: Props) {
    const getLoadingWindow = () => LoadingWindow(
        props.coinGeckoPrices,
        props.coinGeckoPricesLoaded,
        props.coinGeckoCurrencies,
        props.coinGeckoCurrenciesLoaded,
        props.binancePricesLoaded,
        props.binancePrices,
        props.binanceCurrenciesLoaded,
        props.binanceCurrencies,
        props.okxPricesLoaded,
        props.okxPrices,
        props.okxCurrenciesLoaded,
        props.okxCurrencies,
        props.monobankRates,
        props.monobankCurrencies,
    );
    return (
        <div className={"first-page-stats-box"}>
            {props.loaded
                ? <Suspense fallback={getLoadingWindow()}>
                    <FirstPageStatsChart props={props}/>
                </Suspense>
                : getLoadingWindow()}
        </div>
    )
}
