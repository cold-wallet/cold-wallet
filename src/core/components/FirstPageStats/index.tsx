import './index.css'
import React, {lazy, Suspense} from "react";
import LoadingWindow from "../LoadingWindow";
import Props from "../Props";

const FirstPageStatsChart = lazy(() => delayForDemo(import('./FirstPageStatsChart')));

function Loading() {
    return <progress/>;
}

function delayForDemo(promise: Promise<any>) {
    return new Promise(resolve => {
        setTimeout(resolve, 1000);
    }).then(() => promise);
}

export default function FirstPageStats(props: Props) {
    return <>
        <div className={"first-page-stats-box"}>
            {<Suspense fallback={LoadingWindow(
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
            )}>
                <FirstPageStatsChart props={{...props}}
                />
            </Suspense>}
        </div>
    </>
}
