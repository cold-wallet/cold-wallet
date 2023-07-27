import fiatCurrencies from "../../fiatCurrencies";
import NumberFormat from "react-number-format";
import React from "react";
import EditNewAssetControls from "./EditNewAssetControls";

export default function EditNewAsset(
    newAssetCurrency,
    setNewAssetCurrency,
    isNewAssetAmountInvalid,
    setIsNewAssetAmountInvalid,
    newAssetAmount,
    setNewAssetAmount,
    newAssetName,
    setNewAssetName,
    setShowCreateNewAssetWindow,
    isNewAssetNameInvalid,
    setIsNewAssetNameInvalid,
    userData,
    setUserData,
    setCreatingNewAsset,
) {
    let fiatCurrency = fiatCurrencies.getByStringCode(newAssetCurrency);
    const afterDecimalPoint = fiatCurrency ? fiatCurrency.afterDecimalPoint : 8;
    if (newAssetName == null) {
        setNewAssetName(`${newAssetCurrency} amount`);
    }
    return (
        <div className={"asset-row-edit-asset flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"asset-item-value" + (isNewAssetAmountInvalid ? " asset-item-value-input--invalid" : "")}>
                <NumberFormat
                    allowNegative={false}
                    allowLeadingZeros={false}
                    getInputRef={(input) => {
                        input && !input.value && input.focus();
                    }}
                    isNumericString={true}
                    displayType={"input"}
                    decimalScale={afterDecimalPoint}
                    thousandSeparator={true}
                    defaultValue={""}
                    onValueChange={(values) => {
                        const {value} = values;
                        // {
                        //     formattedValue: '$23,234,235.56', //value after applying formatting
                        //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                        //     // if you are setting this value to state make sure to pass isNumericString prop to true
                        //     floatValue: 23234235.56 //floating point representation. For big numbers it
                        //     // can have exponential syntax
                        // }
                        setIsNewAssetAmountInvalid(false);
                        setNewAssetAmount(value);
                    }}
                    renderText={value => <div className={
                        "asset-item-value-input" +
                        (isNewAssetAmountInvalid ? " asset-item-value-input--invalid" : "")
                    }>{value}</div>}
                />
            </div>
            <div className="asset-row-currency text-label">{newAssetCurrency}</div>
            {EditNewAssetControls(
                afterDecimalPoint,
                newAssetAmount,
                setNewAssetAmount,
                newAssetCurrency,
                setNewAssetCurrency,
                newAssetName,
                setNewAssetName,
                setShowCreateNewAssetWindow,
                setIsNewAssetAmountInvalid,
                setIsNewAssetNameInvalid,
                userData,
                setUserData,
                setCreatingNewAsset,
            )}
            <div className="asset-item-name-row flex-box-centered flex-direction-row">
                <div className="asset-item-name-label text-label">name:&nbsp;</div>
                <input type={"text"}
                       defaultValue={`${newAssetCurrency} amount`}
                    //ref={() => (newAssetName === null) && setNewAssetName(`${newAssetCurrency} amount`)}
                       onChange={event => {
                           let value = event?.target?.value;
                           setIsNewAssetNameInvalid(false);
                           setNewAssetName(value);
                       }}
                       className={"asset-item-name-input"
                       + (isNewAssetNameInvalid ? " asset-item-name-input--invalid" : "")}/>
            </div>
        </div>
    )
}
