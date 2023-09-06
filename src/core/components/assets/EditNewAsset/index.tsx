import fiatCurrencies from "./../../../fiatCurrencies";
import AssetDTO, {crypto, fiat} from "./../../../domain/AssetDTO";
import uuidGenerator from "./../../../utils/uuidGenerator";
import AssetEditor from "../AssetEditor";
import Props from "../../Props";

export default function EditNewAsset(props: Props) {
    const newAssetCurrency = props.newAssetCurrency || "";
    let fiatCurrency = fiatCurrencies.getByStringCode(newAssetCurrency);
    const decimalScale = fiatCurrency
        ? fiatCurrency.afterDecimalPoint
        : ((props.binanceCurrencies && props.binanceCurrencies[newAssetCurrency].precision) || 8);
    if (props.newAssetName == null) {
        props.setNewAssetName(`${props.newAssetCurrency} amount`);
    }
    const onAccept = () => {
        let userDataNew = {...props.userData}
        if (!userDataNew.assets) {
            userDataNew.assets = [];
        }
        let newAsset = new AssetDTO(uuidGenerator.generateUUID(), newAssetCurrency,
            props.newAssetAmount || "0", props.newAssetName || "", decimalScale,
            fiatCurrency ? fiat : crypto);
        userDataNew.assets.unshift(newAsset)
        props.setUserData(userDataNew);
        props.stateReset();
    }

    const onCancel = () => {
        props.stateReset();
        props.setCreatingNewAsset(!props.anyAssetExist);
        props.setShowCreateNewAssetWindow(!props.anyAssetExist);
    }

    return AssetEditor({
        props,
        onAccept,
        onCancel,
    })
}
