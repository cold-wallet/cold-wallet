class AssetDTO {

    id;
    currency;
    amount;
    name;
    decimalScale;
    normalizedName;

    constructor(id, currency, amount, name, decimalScale) {
        if (!id || !currency || !amount || !name || !decimalScale || amount <= 0) {
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

export default AssetDTO;
