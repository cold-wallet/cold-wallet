import './index.css';

import React from "react";
import AssetsManageButtons from "./../assets/AssetsManageButtons";
import Asset from "./../assets/Asset";
import EditNewAsset from "./../assets/EditNewAsset";
import NewAssetWindow from "./../assets/NewAssetWindow";
import AssetDeleteWindow from "./../assets/AssetDeleteWindow";
import EditAsset from "./../assets/EditAsset";
import SettingsWindow from "../SettingsWindow";

export default function AssetsDashboard({
                                            showCreateNewAssetWindow,
                                            setShowCreateNewAssetWindow,
                                            creatingNewAsset,
                                            setCreatingNewAsset,
                                            userData,
                                            newAssetAmount,
                                            setNewAssetAmount,
                                            newAssetCurrency,
                                            setNewAssetCurrency,
                                            newAssetName,
                                            setNewAssetName,
                                            isNewAssetAmountInvalid,
                                            setIsNewAssetAmountInvalid,
                                            isNewAssetNameInvalid,
                                            setIsNewAssetNameInvalid,
                                            setUserData,
                                            monobankCurrencies,
                                            binanceCurrencies,
                                            assetToDelete,
                                            setAssetToDelete,
                                            assetToEdit,
                                            setAssetToEdit,
                                            stateReset,
                                            showConfigsWindow,
                                            setShowConfigsWindow,
                                        }) {
    return (
        <div className={"application-box flex-box flex-direction-row"}>
            {showCreateNewAssetWindow && NewAssetWindow(
                setNewAssetCurrency,
                setShowCreateNewAssetWindow,
                setCreatingNewAsset,
                monobankCurrencies,
                binanceCurrencies,
                userData,
            )}
            {assetToDelete && AssetDeleteWindow(
                assetToDelete, setAssetToDelete, userData, setUserData, setShowCreateNewAssetWindow,
                setCreatingNewAsset, stateReset,
            )}
            {showConfigsWindow && <SettingsWindow stateReset={stateReset}/>}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {AssetsManageButtons({
                    setShowCreateNewAssetWindow,
                    setCreatingNewAsset,
                    setShowConfigsWindow,
                    stateReset,
                })}
                {!showCreateNewAssetWindow && creatingNewAsset && EditNewAsset(
                    newAssetCurrency,
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
                    stateReset,
                )}
                {(userData.assets || []).map(asset => (assetToEdit && (asset.id === assetToEdit.id))
                    ? EditAsset(
                        assetToEdit,
                        userData,
                        setUserData,
                        isNewAssetAmountInvalid,
                        setIsNewAssetAmountInvalid,
                        newAssetAmount,
                        setNewAssetAmount,
                        newAssetName,
                        setNewAssetName,
                        isNewAssetNameInvalid,
                        setIsNewAssetNameInvalid,
                        stateReset,
                    )
                    : Asset(
                        asset,
                        setAssetToDelete,
                        setAssetToEdit,
                        setNewAssetAmount,
                        setNewAssetName,
                        stateReset,
                    ))}
            </div>
        </div>
    );
}
