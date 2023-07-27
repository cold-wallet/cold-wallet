const AssetDataValidator = {

    isAssetAmountValid: (value) => {
        return value && !isNaN(value) && (value > 0)
    },

    isAssetNameValid: (newAssetName) => {
        return newAssetName && newAssetName.length <= 40
    }

}

export default AssetDataValidator;
