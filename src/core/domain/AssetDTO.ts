export enum AssetType {
    crypto,
    fiat,
}

export const crypto = AssetType.crypto
export const fiat = AssetType.fiat

export default class AssetDTO {
    normalizedName

    constructor(
        public id: string,
        public currency: string,
        public amount: string,
        public name: string,
        public decimalScale: number,
        public type: AssetType,
        public isBinanceAsset: boolean = false,
        public isMonobankAsset: boolean = false,
        public isOkxAsset: boolean = false,
        public isCcxtAsset: boolean = false,
        public ccxtExchangeName: string | null = null,
        public isMetaMaskAsset: boolean = false,
    ) {
        if (!id || !currency || !amount || !name || !decimalScale || (+amount) <= 0) {
            throw new Error(`invalid asset parameters: ${id}, ${currency}, ${amount}, ${name}, ${decimalScale}`)
        }
        this.id = id;
        this.currency = currency;
        this.amount = amount;
        this.name = name;
        this.decimalScale = decimalScale;
        this.type = type;
        this.normalizedName = ((this.name.toUpperCase().indexOf(this.currency.toUpperCase()) !== 0)
            ? `${this.currency} ` : "") + name;
        this.isBinanceAsset = isBinanceAsset;
        this.isMonobankAsset = isMonobankAsset;
        this.isOkxAsset = isOkxAsset;
        this.isCcxtAsset = isCcxtAsset;
        this.ccxtExchangeName = ccxtExchangeName;
        this.isMetaMaskAsset = isMetaMaskAsset;
    }
}
