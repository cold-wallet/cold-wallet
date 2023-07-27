import './index.css';
import NumberFormat from "react-number-format";
import React from "react";
import EditAssetControls from "../EditAssetControls";

export default function EditAsset(
    assetToEdit,
    setAssetToEdit,
    userData,
    setUserData,
    isAssetAmountInvalid,
    setIsAssetAmountInvalid,
    newAssetAmount,
    setAssetAmount,
    newAssetName,
    setAssetName,
    isAssetNameInvalid,
    setIsAssetNameInvalid,
) {
    if (newAssetName === null) {
        setAssetName(assetToEdit.name)
    }
    if (newAssetAmount === null) {
        setAssetAmount(assetToEdit.amount)
    } else {
        console.log("am", newAssetAmount)
    }
    return (
        <div key={assetToEdit.id}
             className={"asset-row-edit-asset flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"asset-item-value" + (isAssetAmountInvalid ? " asset-item-value-input--invalid" : "")}>
                <NumberFormat
                    allowNegative={false}
                    allowLeadingZeros={false}
                    getInputRef={(input) => {
                        input && !input.value && input.focus();
                    }}
                    isNumericString={true}
                    displayType={"input"}
                    decimalScale={assetToEdit.decimalScale}
                    thousandSeparator={true}
                    defaultValue={assetToEdit.amount}
                    onValueChange={(values) => {
                        const {value} = values;
                        // {
                        //     formattedValue: '$23,234,235.56', //value after applying formatting
                        //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                        //     // if you are setting this value to state make sure to pass isNumericString prop to true
                        //     floatValue: 23234235.56 //floating point representation. For big numbers it
                        //     // can have exponential syntax
                        // }
                        setIsAssetAmountInvalid(false);
                        console.log("am2", value)
                        setAssetAmount(value);
                    }}
                    renderText={value => <div className={
                        "asset-item-value-input" +
                        (isAssetAmountInvalid ? " asset-item-value-input--invalid" : "")
                    }>{value}</div>}
                />
            </div>
            <div className="asset-row-currency text-label">{assetToEdit.currency}</div>
            {EditAssetControls(
                assetToEdit,
                setAssetToEdit,
                newAssetAmount,
                setAssetAmount,
                newAssetName,
                setAssetName,
                setIsAssetAmountInvalid,
                setIsAssetNameInvalid,
                userData,
                setUserData,
            )}
            <div className="asset-item-name-row flex-box-centered flex-direction-row">
                <div className="asset-item-name-label text-label">name:&nbsp;</div>
                <input type={"text"}
                       defaultValue={assetToEdit.name}
                       onChange={event => {
                           let value = event?.target?.value;
                           setIsAssetNameInvalid(false);
                           setAssetName(value)
                       }}
                       className={"asset-item-name-input"
                       + (isAssetNameInvalid ? " asset-item-name-input--invalid" : "")}/>
            </div>
        </div>
    )
}
