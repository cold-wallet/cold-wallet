import './index.css';

import NumberFormat from "react-number-format";
import React from "react";
import assetDataValidator from "./../../../utils/AssetDataValidator";
import AssetControls from "./../AssetControls";

export default function AssetEditor({
                                        id,
                                        newAssetAmount,
                                        setNewAssetAmount,
                                        isNewAssetAmountInvalid,
                                        setIsNewAssetAmountInvalid,
                                        newAssetName,
                                        setNewAssetName,
                                        isNewAssetNameInvalid,
                                        setIsNewAssetNameInvalid,
                                        decimalScale,
                                        defaultAmount,
                                        assetCurrency,
                                        onAccept,
                                        onCancel,
                                    }) {
    const onAcceptAsset = () => {
        let assetAmountValid = assetDataValidator.isAssetAmountValid(newAssetAmount);
        let assetNameValid = assetDataValidator.isAssetNameValid(newAssetName);
        if (assetAmountValid && assetNameValid) {
            onAccept();
        } else {
            if (!assetAmountValid) {
                setIsNewAssetAmountInvalid(true);
            }
            if (!assetNameValid) {
                setIsNewAssetNameInvalid(true);
            }
        }
    }

    return (
        <div key={"edit-asset"}
             className={"asset-row-edit-asset flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"edit-asset-item-value"
            + (isNewAssetAmountInvalid ? " edit-asset-item-value-input--invalid" : "")}>
                <NumberFormat
                    key={id}
                    allowNegative={false}
                    allowLeadingZeros={false}
                    getInputRef={(input) => {
                        input && !input.value && input.focus();
                    }}
                    isNumericString={true}
                    displayType={"input"}
                    decimalScale={decimalScale}
                    thousandSeparator={true}
                    defaultValue={defaultAmount}
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
                    renderText={value => <div className={"edit-asset-item-value-input" +
                    (isNewAssetAmountInvalid ? " edit-asset-item-value-input--invalid" : "")
                    }>{value}</div>}
                />
            </div>
            <div className="asset-row-currency text-label">{assetCurrency}</div>
            <AssetControls
                editMode={true}
                onEditAsset={onAcceptAsset}
                onCancelOrDeleteAsset={onCancel}
            />
            <div className="asset-item-name-row flex-box-centered flex-direction-row">
                <div className="asset-item-name-label text-label">name:&nbsp;</div>
                <input key={id}
                       type={"text"}
                       defaultValue={newAssetName}
                       onChange={event => {
                           let value = event?.target?.value;
                           setIsNewAssetNameInvalid(false);
                           setNewAssetName(value);
                       }}
                       className={"edit-asset-item-name-input"
                       + (isNewAssetNameInvalid ? " edit-asset-item-name-input--invalid" : "")}/>
            </div>
        </div>
    )
}
