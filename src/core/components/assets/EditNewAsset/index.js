import fiatCurrencies from "./../../../fiatCurrencies";
import AssetDTO, {crypto, fiat} from "./../../../domain/AssetDTO";
import uuidGenerator from "./../../../utils/uuidGenerator";
import AssetEditor from "../AssetEditor";

export default function EditNewAsset(
    assetCurrency,
    isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
    newAssetAmount, setNewAssetAmount,
    newAssetName, setNewAssetName,
    setShowCreateNewAssetWindow,
    isNewAssetNameInvalid, setIsNewAssetNameInvalid,
    userData, setUserData,
    setCreatingNewAsset,
    stateReset,
    anyAssetExist,
    binanceCurrencies,
) {
    let fiatCurrency = fiatCurrencies.getByStringCode(assetCurrency);
    const decimalScale = fiatCurrency
        ? fiatCurrency.afterDecimalPoint
        : (binanceCurrencies[assetCurrency].precision || 8);
    if (newAssetName == null) {
        setNewAssetName(`${assetCurrency} amount`);
    }
    const onAccept = () => {
        let userDataNew = {...userData}
        if (!userDataNew.assets) {
            userDataNew.assets = [];
        }
        let newAsset = new AssetDTO(uuidGenerator.generateUUID(), assetCurrency, newAssetAmount,
            newAssetName, decimalScale, fiatCurrency ? fiat : crypto);
        userDataNew.assets.unshift(newAsset)
        setUserData(userDataNew);
        stateReset();
    }

    const onCancel = () => {
        stateReset();
        setCreatingNewAsset(!anyAssetExist);
        setShowCreateNewAssetWindow(!anyAssetExist);
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
