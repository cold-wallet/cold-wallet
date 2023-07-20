import currenciesIso from "./resources/currencies-iso-4217.json";
import currencyCodes from "./resources/currencies-iso-4217-code.json";

const fiatCurrencies = {
    getByStringCode(code) {
        return currenciesIso[code]
    },
    getByNumCode(code) {
        const currencyCodeLength = 3;
        const strCode = "" + code;
        let addZeros = currencyCodeLength - strCode.length;

        while (addZeros > 0) {
            code = "0" + code;
            --addZeros
        }
        let res = currencyCodes[code];
        if (!res) {
            console.warn("can't find currency data for code", code)
        }
        return res
    },
};

export default fiatCurrencies;
