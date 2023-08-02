import FiatCurrency from "./FiatCurrency";

const currenciesIso = require("./../../resources/currencies-iso-4217.json");
const currencyCodes = require("./../../resources/currencies-iso-4217-code.json");

const fiatCurrencies = {
    getByStringCode(code: string): FiatCurrency | undefined {
        return currenciesIso[code]
    },
    getByNumCode(code: number | string): FiatCurrency | undefined {
        const currencyCodeLength = 3;
        let strCode = "" + code;
        let addZeros = currencyCodeLength - strCode.length;

        while (addZeros > 0) {
            strCode = "0" + strCode;
            --addZeros
        }
        let res = currencyCodes[strCode];
        if (!res) {
            console.warn("can't find currency data for code", strCode)
        }
        return res
    },
};

export default fiatCurrencies;
