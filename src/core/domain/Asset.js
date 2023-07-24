class Asset {

    currency;
    amount;
    decimalScale;

    constructor(currency, amount, decimalScale) {
        this.currency = currency;
        this.amount = amount;
        this.decimalScale = decimalScale;
    }
}

export default Asset;
