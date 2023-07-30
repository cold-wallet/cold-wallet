import React from "react";
import './index.css';
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import SettingsIcon from './../../../../resources/images/icons8-settings.svg'

export default function AssetsManageButtons(
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    stateReset,
) {
    const addNewAssetButtonClicked = () => {
        stateReset();
        setShowCreateNewAssetWindow(true);
        setCreatingNewAsset(true);
    }

    const showConfigsWindow = () => {
        stateReset();
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
