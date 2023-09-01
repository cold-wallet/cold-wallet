import ApiResponse from "../../domain/ApiResponse";
import axios, {AxiosResponse} from "axios";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";

const name = "coingecko"
const apiBaseUrl = "https://api.coingecko.com"
const apiPrefix = "/api/v3"

const apiClient = {
    async fetchPrices(
        currencies: { [index: string]: CoinGeckoCurrencyResponse },
        subCurrencies: string[],
    ): Promise<ApiResponse<CoinGeckoPriceResponse | any>> {
        try {
            const currencyIdToSymbol = Object
                .values(currencies)
                .reduce((merged, current) => {
                    merged.set(current.id, current.symbol)
                    return merged
                }, new Map<string, string>())
            const currenciesParam = Object
                .values(currencies)
                .map(currency => currency.id)
                .join(",")
            const vsCurrencies = subCurrencies.join(",")
            const urlPrices = apiBaseUrl + apiPrefix + "/simple/price";
            const pricesResponse: AxiosResponse<CoinGeckoPriceResponse>
                = await axios.get(urlPrices, {
                params: {
                    ids: currenciesParam,
                    vs_currencies: vsCurrencies,
                    precision: "full",
                }
            });
            if (pricesResponse.data && Object.keys(pricesResponse.data).length) {
                const result = Object.entries(pricesResponse.data)
                    .reduce((merged, current) => {
                        const symbol = currencyIdToSymbol.get(current[0])
                        symbol && (merged[symbol] = current[1])
                        return merged
                    }, {} as CoinGeckoPriceResponse)
                return ApiResponse.success(200, result,)
            }
            return ApiResponse.fail(
                0,
                "empty response",
            )
        } catch (error: any) {
            console.warn(`Error fetching prices from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async fetchCurrencies(): Promise<ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>> {
        try {
            const url = apiBaseUrl + apiPrefix + "/coins/list";
            const response: AxiosResponse<CoinGeckoCurrencyResponse[]> = await axios.get(url);
            if (response.data?.length) {
                const currencies = response.data
                    .reduce((merged: { [p: string]: CoinGeckoCurrencyResponse }, currency) => {
                        merged[currency.symbol] = currency
                        return merged
                    }, {});
                return ApiResponse.success(200, currencies,)
            } else {
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            }
        } catch (error: any) {
            console.warn(`Error fetching currencies from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async fetchSubCurrencies(): Promise<ApiResponse<string[] | any>> {
        try {
            const urlVsCurrencies = apiBaseUrl + apiPrefix + "/simple/supported_vs_currencies";
            const response: AxiosResponse<string[]> = await axios.get(urlVsCurrencies);
            if (response.data?.length) {
                return ApiResponse.success(200, response.data,)
            } else {
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            }
        } catch (error: any) {
            console.warn(`Error fetching currencies from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },

}

export default apiClient;
