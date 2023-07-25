class Asset {

    id;
    currency;
    amount;
    name;
    decimalScale;

    constructor(id, currency, amount, name, decimalScale) {
        if (!id || !currency || !amount || !name || !decimalScale || amount <= 0) {
            throw new Error(`invalid asset parameters: ${id}, ${currency}, ${amount}, ${name}, ${decimalScale}`)
        }
        this.id = id;
        this.currency = currency;
        this.amount = amount;
        this.name = name;
        this.decimalScale = decimalScale;
    }
}

export default Asset;
