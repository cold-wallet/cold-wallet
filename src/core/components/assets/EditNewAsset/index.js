import fiatCurrencies from "./../../../fiatCurrencies";
import AssetDTO from "./../../../domain/AssetDTO";
import uuidGenerator from "./../../../utils/uuidGenerator";
import AssetEditor from "../AssetEditor";

export default function EditNewAsset(
    assetCurrency,
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
    let fiatCurrency = fiatCurrencies.getByStringCode(assetCurrency);
    const decimalScale = fiatCurrency ? fiatCurrency.afterDecimalPoint : 8;
    if (newAssetName == null) {
        setNewAssetName(`${assetCurrency} amount`);
    }
    const onAccept = () => {
        let userDataNew = {...userData}
        if (!userDataNew.assets) {
            userDataNew.assets = [];
        }
        let newAsset = new AssetDTO(uuidGenerator.generateUUID(), assetCurrency, newAssetAmount,
            newAssetName, decimalScale);
        userDataNew.assets.unshift(newAsset)
        setUserData(userDataNew);
        setNewAssetAmount(null);
        setNewAssetCurrency(null);
        setNewAssetName(null);
        setIsNewAssetNameInvalid(false);
        setIsNewAssetAmountInvalid(false);
        setCreatingNewAsset(false);
        setShowCreateNewAssetWindow(false);
    }

    const onCancel = () => {
        setNewAssetAmount(null);
        setNewAssetCurrency(null);
        setNewAssetName(null);
        setIsNewAssetNameInvalid(false);
        setIsNewAssetAmountInvalid(false);
        setCreatingNewAsset(!(userData.assets?.length));
        setShowCreateNewAssetWindow(!(userData.assets?.length));
    }

    return AssetEditor({
        newAssetAmount,
        setNewAssetAmount,
        isNewAssetAmountInvalid,
        setIsNewAssetAmountInvalid,
        newAssetName,
        setNewAssetName,
        isNewAssetNameInvalid,
        setIsNewAssetNameInvalid,
        decimalScale,
        defaultAmount: "",
        assetCurrency,
        onAccept,
        onCancel,
    })
}
