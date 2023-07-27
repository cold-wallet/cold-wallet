const MAX_ASSET_NAME_LENGTH = 40;

const assetDataValidator = {

    isAssetAmountValid: (value) => {
        return value && !isNaN(value) && (value > 0);
    },

    isAssetNameValid: (newAssetName) => {
        return newAssetName && newAssetName.length <= MAX_ASSET_NAME_LENGTH;
    }

}

export default assetDataValidator;
