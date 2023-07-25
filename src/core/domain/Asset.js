class Asset {

    currency;
    amount;
    name;
    decimalScale;

    constructor(currency, amount, name, decimalScale) {
        this.currency = currency;
        this.amount = amount;
        this.name = name;
        this.decimalScale = decimalScale;
    }
}

export default Asset;
