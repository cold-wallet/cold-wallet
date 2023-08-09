import './index.css';
import React, {Dispatch, SetStateAction} from "react";
import AssetDTO from "../../../domain/AssetDTO";
import AssetEditor from "../AssetEditor";
import UserData from "../../../domain/UserData";

export default function EditAsset(
    assetToEdit: AssetDTO,
    userData: UserData, setUserData: Dispatch<SetStateAction<UserData | null>>,
    isNewAssetAmountInvalid: boolean, setIsNewAssetAmountInvalid: Dispatch<SetStateAction<boolean | null>>,
    newAssetAmount: string, setNewAssetAmount: Dispatch<SetStateAction<string | null>>,
    newAssetName: string, setNewAssetName: Dispatch<SetStateAction<string | null>>,
    isNewAssetNameInvalid: boolean, setIsNewAssetNameInvalid: Dispatch<SetStateAction<boolean | null>>,
    stateReset: () => void,
) {
    if (newAssetName === null) {
        setNewAssetName(assetToEdit.name)
    }
    if (newAssetAmount === null) {
        setNewAssetAmount(assetToEdit.amount)
    }

    const onAcceptAsset = () => {
        let userDataNew = {...userData}
        if (!userDataNew.assets) {
            userDataNew.assets = [];
        }
        userDataNew.assets = userDataNew.assets.map(asset => {
            if (asset.id === assetToEdit.id) {
                return new AssetDTO(assetToEdit.id, assetToEdit.currency, newAssetAmount,
                    newAssetName, assetToEdit.decimalScale, assetToEdit.type);
            } else {
                return asset;
            }
        });
        setUserData(userDataNew);
        onCancelAsset();
    }

    const onCancelAsset = () => {
        stateReset();
    }

    return (
        <AssetEditor
            key={assetToEdit.id}
            id={assetToEdit.id}
            newAssetAmount={newAssetAmount}
            setNewAssetAmount={setNewAssetAmount}
            isNewAssetAmountInvalid={isNewAssetAmountInvalid}
            setIsNewAssetAmountInvalid={setIsNewAssetAmountInvalid}
            newAssetName={newAssetName}
            setNewAssetName={setNewAssetName}
            isNewAssetNameInvalid={isNewAssetNameInvalid}
            setIsNewAssetNameInvalid={setIsNewAssetNameInvalid}
            decimalScale={assetToEdit.decimalScale}
            defaultAmount={assetToEdit.amount}
            assetCurrency={assetToEdit.currency}
            onAccept={onAcceptAsset}
            onCancel={onCancelAsset}
        />
    )
}
