import axios from "axios";
import fiatCurrencies from "../../fiatCurrencies";
import ApiResponse from "../../domain/ApiResponse";

const urlMonobankRates = 'https://api.monobank.ua/bank/currency';

const monobankApiClient = {
    fetchMonobankRatesAndCurrencies: async () => {
        try {
            const response = await axios.get(urlMonobankRates);
            if (response?.data?.length) {
                let monobankCurrencies = response.data.reduce((result, rate) => {
                    const currencyA = fiatCurrencies.getByNumCode(rate.currencyCodeA);
                    const currencyB = fiatCurrencies.getByNumCode(rate.currencyCodeB);

                    if (!currencyA || !currencyB) {
                        return result
                    }
                    result[currencyA.code] = currencyA;
                    result[currencyB.code] = currencyB;
                    return result
                }, {})
                return ApiResponse.success({
                    code: response.status,
                    result: {
                        rates: response.data,
                        currencies: monobankCurrencies,
                    }
                })
            } else {
                return ApiResponse.fail({
                    code: 0,
                    error: "empty response",
                })
            }
        } catch (error) {
            return ApiResponse.fail({
                code: error.response?.status,
                error: error.response?.data?.errorDescription,
            })
        }
    },
}

export default monobankApiClient;
