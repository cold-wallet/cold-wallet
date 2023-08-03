export default class AssetDTO {
    normalizedName

    constructor(
        public id: string,
        public currency: string,
        public amount: string,
        public name: string,
        public decimalScale: number,
    ) {
        if (!id || !currency || !amount || !name || !decimalScale || (+amount) <= 0) {
            throw new Error(`invalid asset parameters: ${id}, ${currency}, ${amount}, ${name}, ${decimalScale}`)
        }
        this.id = id;
        this.currency = currency;
        this.amount = amount;
        this.name = name;
        this.decimalScale = decimalScale;
        this.normalizedName = ((this.name.toUpperCase().indexOf(this.currency.toUpperCase()) !== 0)
            ? `${this.currency} ` : "") + name;
    }
}
