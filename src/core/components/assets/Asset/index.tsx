import './index.css'
import {NumericFormat} from "react-number-format";
import noExponents from "../../../utils/noExponents";
import React, {JSX} from "react";
import AssetDTO from "../../../domain/AssetDTO";

export default function Asset(asset: AssetDTO, controls: JSX.Element) {
    return (<div key={asset.id} className="asset-row-wrapper flex-box-centered">
        <div className={"asset-row flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"asset-item-value"}>
                <NumericFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    valueIsNumericString={true}
                    displayType={"text"}
                    decimalScale={asset.decimalScale || 8}
                    thousandSeparator={true}
                    value={noExponents(asset.amount)}
                    renderText={value => (
                        <div className={"asset-item-value-input"}>{value}</div>
                    )}
                />
            </div>
            <div className={"asset-item-name text-label"}
                 title={asset.normalizedName}>{asset.normalizedName}</div>
            {controls}
        </div>
    </div>)
}
