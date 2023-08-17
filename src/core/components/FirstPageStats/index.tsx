import './index.css'
import React, {lazy, Suspense} from "react";
import UserData from "../../domain/UserData";
import {AccountInfo} from "../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../integrations/monobank/MonobankUserData";
import CurrencyRates from "../../currencyRates/CurrencyRates";

const FirstPageStatsChart = lazy(() => delayForDemo(import('./FirstPageStatsChart')));

function Loading() {
    return <progress/>;
}

function delayForDemo(promise: Promise<any>) {
    return new Promise(resolve => {
        setTimeout(resolve, 1000);
    }).then(() => promise);
}

export default function FirstPageStats(
    userData: UserData,
    monobankUserData: MonobankUserData,
    binanceUserData: AccountInfo,
    rates: CurrencyRates,
    firstPageChartType: string,
    setFirstPageChartType: React.Dispatch<React.SetStateAction<string>>,
    firstPageChartView: string,
    setFirstPageChartView: React.Dispatch<React.SetStateAction<string>>,
) {
    return <>
        <div className={"first-page-stats-box"}>
            {<Suspense fallback={<Loading/>}>
                <FirstPageStatsChart props={{
                    userData,
                    monobankUserData,
                    binanceUserData,
                    rates,
                    firstPageChartType, setFirstPageChartType,
                    firstPageChartView, setFirstPageChartView,
                }}
                />
            </Suspense>}
        </div>
    </>
}
