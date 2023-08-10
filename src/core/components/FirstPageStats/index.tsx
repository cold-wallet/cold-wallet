import './index.css'
import React, {lazy, Suspense} from "react";
import UserData from "../../domain/UserData";
import {AccountInfo} from "../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../integrations/monobank/MonobankUserData";

const PieChart = lazy(() => delayForDemo(import('./PieChart')));

function Loading() {
    return <progress/>;
}

function delayForDemo(promise: Promise<any>) {
    return new Promise(resolve => {
        setTimeout(resolve, 2000);
    }).then(() => promise);
}

export default function FirstPageStats(
    userData: UserData,
    monobankUserData: MonobankUserData,
    binanceUserData: AccountInfo,
) {
    return <>
        <div className={"first-page-stats-box"}>
            {<Suspense fallback={<Loading/>}>
                <PieChart
                    userData={userData}
                    monobankUserData={monobankUserData}
                    binanceUserData={binanceUserData}
                />
            </Suspense>}
        </div>
    </>
}
