import { MAX_SCALE, validateAmount, validateAssetName } from "../amount";

// Thin wrapper kept for existing callers; the rules live in utils/amount.ts.
const assetDataValidator = {

    isAssetAmountValid: (value: number | string | null, scale: number = MAX_SCALE) => {
        return validateAmount(value, scale).ok;
    },

    isAssetNameValid: (newAssetName: string | null) => {
        return validateAssetName(newAssetName).ok;
    }

}

export default assetDataValidator;
