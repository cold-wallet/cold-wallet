const MAX_ASSET_NAME_LENGTH = 40;

const assetDataValidator = {

    isAssetAmountValid: (value: number | string | null) => {
        return Boolean(value) && !isNaN(Number(value)) && (Number(value) > 0);
    },

    isAssetNameValid: (newAssetName: string | null) => {
        return !!newAssetName && newAssetName.length <= MAX_ASSET_NAME_LENGTH;
    }

}

export default assetDataValidator;
