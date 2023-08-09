import './index.css'
import React from "react";
import UserData from "../../domain/UserData";
import {AccountInfo} from "../../integrations/binance/binanceApiClient";
import PieChart from "./PieChart";
import AssetsAllInCurrencies from "./AssetsAllInCurrencies";
import MonobankUserData from "../../integrations/monobank/MonobankUserData";

export default function FirstPageStats(
    userData: UserData,
    monobankUserData: MonobankUserData,
    binanceUserData: AccountInfo,
) {
    return <>
        <div className={"first-page-stats-box"}>
            {AssetsAllInCurrencies(
                userData,
                monobankUserData,
                binanceUserData,
            )}
            {PieChart(
                userData,
                monobankUserData,
                binanceUserData,
            )}
        </div>
    </>
}
