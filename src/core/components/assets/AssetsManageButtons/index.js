import React from "react";
import './index.css';
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import SettingsIcon from './../../../../resources/images/icons8-settings.svg'

export default function AssetsManageButtons(
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    setAssetToEdit,
    setNewAssetAmount,
    setNewAssetName,
    setIsNewAssetAmountInvalid,
    setIsNewAssetNameInvalid,
) {
    const addNewAssetButtonClicked = () => {
        setShowCreateNewAssetWindow(true);
        setCreatingNewAsset(true);
        setAssetToEdit(null);
        setNewAssetAmount(null);
        setNewAssetName(null);
        setIsNewAssetAmountInvalid(false);
        setIsNewAssetNameInvalid(false);
    }

    const showConfigsWindow = () => {
    }

    return (
        <div className="add-new-asset-row flex-box flex-direction-row">
            <NeutralButton onClick={showConfigsWindow}
                           className={"show-configs-window-button"}
            ><SettingsIcon/></NeutralButton>
            <PositiveButton onClick={addNewAssetButtonClicked}
                            className={"add-new-asset-button layer-3-themed-color"}
            >+</PositiveButton>
        </div>
    )
}