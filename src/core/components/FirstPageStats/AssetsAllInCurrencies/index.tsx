import './index.css'
import React from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";

export default function AssetsAllInCurrencies(
    userData: UserData,
    monobankUserData: MonobankUserData,
    binanceUserData: AccountInfo,
) {
    return <div className={"assets-in-all-currencies-box"}>
    </div>
}
