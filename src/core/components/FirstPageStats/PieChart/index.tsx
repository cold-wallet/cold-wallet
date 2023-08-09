import './index.css';
import React from "react";
import UserData from "../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import BalancePerType from "./BalancePerType";
import BalancePerCurrency from "./BalancePerCurrency";
import TotalPicture from "./TotalPicture";

export default function PieChart(
    userData: UserData,
    monobankUserData: MonobankUserData,
    binanceUserData: AccountInfo,
) {
    const pieControls = [{
        imagePath: "./TotalPicture.svg",
        image: <TotalPicture/>,
        text: "Total",
        onClick: () => {
        },
    }, {
        imagePath: "./BalancePerCurrency.svg",
        image: <BalancePerCurrency/>,
        text: "Per currency",
        onClick: () => {
        },
    }, {
        imagePath: "./BalancePerType.svg",
        image: <BalancePerType/>,
        text: "Per type",
        onClick: () => {
        },
    },];

    return <div className={"chart-total-pie-box flex-box-centered flex-direction-column layer-0-themed-color"}>
        <div className="chart-total-pie-main"></div>
        <div className="chart-total-pie-controls flex-box-centered flex-direction-row">{
            pieControls.map(control => (
                <div
                    className="chart-total-pie-control flex-box-centered flex-direction-column pad layer-1-themed-color"
                    onClick={control.onClick}>
                    <div className="chart-total-pie-control-image">{control.image}</div>
                    <div className="chart-total-pie-control-label clickable">{control.text}</div>
                </div>
            ))
        }</div>
    </div>
}
