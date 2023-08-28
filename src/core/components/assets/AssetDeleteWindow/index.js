import React from "react";
import './index.css'
import ModalWindow from "../../ModalWindow";
import NegativeButton from "../../buttons/NegativeButton";
import NeutralButton from "../../buttons/NeutralButton";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import {OkxAccount} from "../../../integrations/okx/okxApiClient";

export default function AssetDeleteWindow(
    assetToDelete,
    userData,
    setUserData,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    stateReset,
    binanceUserData,
    monobankUserData,
    okxUserData,
) {
    const onCancel = () => {
        stateReset();
    }

    const deleteAsset = () => {
        const userDataNew = {...userData};
        userDataNew.assets = userDataNew.assets.filter(asset => asset.id !== assetToDelete.id);
        setUserData(userDataNew);
        stateReset();

        let anyAssetExist = !!(userDataNew.assets.length)
            || userData.settings.binanceIntegrationEnabled && AccountInfo.assetsExist(binanceUserData)
            || userData.settings.okxIntegrationEnabled && OkxAccount.assetsExist(okxUserData)
            || userData.settings.monobankIntegrationEnabled && MonobankUserData.assetsExist(monobankUserData)

        if (!anyAssetExist) {
            setCreatingNewAsset(true);
            setShowCreateNewAssetWindow(true);
        }
    }

    return <ModalWindow
        onCancel={onCancel}
        closeable={true}
        large={false}
        children={
            <div className="confirm-delete-asset-text text-label">{
                `Delete ${assetToDelete.amount} ${assetToDelete.normalizedName}?`
            }</div>
        }
        bottom={[
            <NegativeButton onClick={deleteAsset}
                            key={"delete"}
                            className="confirm-delete-asset-button">Delete
            </NegativeButton>,
            <NeutralButton onClick={onCancel}
                           key={"cancel"}
                           className="confirm-delete-asset-button">Cancel
            </NeutralButton>
        ]
        }/>
}
