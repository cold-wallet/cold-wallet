import ApiResponse from "../../domain/ApiResponse";
import axios, {AxiosResponse} from "axios";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";

const name = "coingecko"
const apiBaseUrl = "https://api.coingecko.com"
const apiPrefix = "/api/v3"

const apiClient = {
    async fetchPrices(): Promise<ApiResponse<CoinGeckoPriceResponse | any>> {
        try {
            const currenciesResponse = await this.fetchCurrencies();
            if (currenciesResponse.success) {
                const currencies = Object
                    .values((currenciesResponse.result as { [index: string]: CoinGeckoCurrencyResponse }))
                    .map(currency => currency.id)
                    .join(",")
                const urlVsCurrencies = apiBaseUrl + apiPrefix + "/simple/supported_vs_currencies";
                const response: AxiosResponse<string[]> = await axios.get(urlVsCurrencies);
                if (response.data?.length) {
                    const vsCurrencies = Object.keys(response.data).join(",")
                    const urlPrices = apiBaseUrl + apiPrefix + "/simple/price";
                    const pricesResponse: AxiosResponse<{ [index: string]: { [index: string]: number } }>
                        = await axios.get(urlPrices, {
                        params: {
                            ids: currencies,
                            vs_currencies: vsCurrencies,
                            precision: "full",
                        }
                    });
                    if (pricesResponse.data?.length) {
                        return ApiResponse.success(200, pricesResponse.data as CoinGeckoPriceResponse,)
                    }
                }
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            } else {
                return currenciesResponse
            }
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

}

export default apiClient;
