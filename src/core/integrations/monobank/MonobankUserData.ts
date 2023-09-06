import AssetDTO from "../../domain/AssetDTO";

export default class MonobankUserData {
    constructor(
        public clientId: string,
        public name: string,
        public webHookUrl: string,
        public permissions: string,
        public accounts: AssetDTO[],
        public jars: AssetDTO[],
    ) {
    }

    static assetsExist = (accountInfo: MonobankUserData | null) => {
        return !!(accountInfo && (accountInfo.accounts?.length || accountInfo.jars?.length))
    }

    static getAllAssets = (accountInfo: MonobankUserData | null): AssetDTO[] => {
        return accountInfo ? [...accountInfo.accounts].concat(accountInfo.jars) : []
    }
}
