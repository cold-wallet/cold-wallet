import './index.css';

import {NumericFormat} from "react-number-format";
import React from "react";
import assetDataValidator from "./../../../utils/AssetDataValidator";
import AssetControls from "./../AssetControls";
import Props from "../../Props";

export default function AssetEditor(
    {
        onAccept,
        onCancel,
        props,
    }: {
        onAccept: () => void,
        onCancel: () => void,
        props: Props,
    }
) {
    const onAcceptAsset = () => {
        let assetAmountValid = assetDataValidator.isAssetAmountValid(props.newAssetAmount);
        let assetNameValid = assetDataValidator.isAssetNameValid(props.newAssetName);
        if (assetAmountValid && assetNameValid) {
            onAccept();
        } else {
            if (!assetAmountValid) {
                props.setIsNewAssetAmountInvalid(true);
            }
            if (!assetNameValid) {
                props.setIsNewAssetNameInvalid(true);
            }
        }
    }

    return (
        <div key={"edit-asset"}
             className={"asset-row-edit-asset flex-box-centered flex-direction-column layer-2-themed-color"}>
            <div className="asset-row-edit-first-row flex-box-centered flex-direction-row ">
                <div className={"edit-asset-item-value"
                    + (props.isNewAssetAmountInvalid ? " edit-asset-item-value-input--invalid" : "")}>
                    <NumericFormat
                        key={props.assetToEdit?.id}
                        allowNegative={false}
                        allowLeadingZeros={false}
                        getInputRef={(input: HTMLInputElement) => {
                            input && !input.value && input.focus();
                        }}
                        isNumericString={true}
                        displayType={"input"}
                        decimalScale={props.assetToEdit?.decimalScale}
                        thousandSeparator={true}
                        defaultValue={props.assetToEdit?.amount}
                        onValueChange={(values) => {
                            const {value} = values;
                            // {
                            //     formattedValue: '$23,234,235.56', //value after applying formatting
                            //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                            //     // if you are setting this value to state make sure to pass isNumericString prop to true
                            //     floatValue: 23234235.56 //floating point representation. For big numbers it
                            //     // can have exponential syntax
                            // }
                            props.setIsNewAssetAmountInvalid(false);
                            props.setNewAssetAmount(value);
                        }}
                        renderText={value => <div className={"edit-asset-item-value-input" +
                            (props.isNewAssetAmountInvalid ? " edit-asset-item-value-input--invalid" : "")
                        }>{value}</div>}
                    />
                </div>
                <div className="asset-row-currency text-label">{props.assetToEdit?.currency}</div>
                <AssetControls
                    editMode={true}
                    onEditAsset={onAcceptAsset}
                    onCancelOrDeleteAsset={onCancel}
                />
            </div>
            <div className="asset-item-name-row flex-box-centered flex-direction-row">
                <div className="asset-item-name-label text-label">name:&nbsp;</div>
                <input key={props.assetToEdit?.id}
                       type={"text"}
                       defaultValue={props.newAssetName || ""}
                       onChange={event => {
                           let value = event?.target?.value;
                           props.setIsNewAssetNameInvalid(false);
                           props.setNewAssetName(value);
                       }}
                       className={"edit-asset-item-name-input"
                           + (props.isNewAssetNameInvalid ? " edit-asset-item-name-input--invalid" : "")}/>
            </div>
        </div>
    )
}
