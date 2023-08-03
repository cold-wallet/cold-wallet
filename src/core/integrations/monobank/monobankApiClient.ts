import axios, {AxiosResponse} from "axios";
import fiatCurrencies from "../../fiatCurrencies";
import MonobankCurrencyResponse from "./MonobankCurrencyResponse";
import MonobankUserDataResponse from "./MonobankUserDataResponse";
import MonobankPublicDataResponse from "./MonobankPublicDataResponse";
import ApiResponse from "../../domain/ApiResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";
import reduceToObject from "../../utils/reduceToObject";

let monobankBaseUrl = 'https://api.monobank.ua';
const urlMonobankRates = monobankBaseUrl + '/bank/currency';
const urlMonobankClientInfo = monobankBaseUrl + '/personal/client-info';

const monobankApiClient = {
    fetchMonobankRatesAndCurrencies: async (): Promise<ApiResponse<MonobankPublicDataResponse | any>> => {
        try {
            const response: AxiosResponse<MonobankCurrencyResponse[]> = await axios.get(urlMonobankRates);
            if (response.data?.length) {
                let monobankCurrencies: { [index: string]: FiatCurrency } = reduceToObject(
                    response.data, (rate: MonobankCurrencyResponse) => {
                        const currencyA = fiatCurrencies.getByNumCode(rate.currencyCodeA);
                        const currencyB = fiatCurrencies.getByNumCode(rate.currencyCodeB);

                        if (!currencyA || !currencyB) {
                            return []
                        }
                        return [
                            currencyA.code, currencyA,
                            currencyB.code, currencyB,
                        ]
                    })
                return ApiResponse.success(
                    response.status,
                    new MonobankPublicDataResponse(
                        response.data,
                        monobankCurrencies,
                    )
                )
            } else {
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            }
        } catch (error: any) {
            return ApiResponse.fail(
                error.response?.status,
                error.response?.data?.errorDescription,
            )
        }
    },
    getUserInfo: async (token: string): Promise<ApiResponse<MonobankUserDataResponse | any>> => {
        try {
            const response: AxiosResponse<MonobankUserDataResponse> = await axios.get(urlMonobankClientInfo, {
                headers: {
                    "X-Token": token,
                }
            });
            const userInfo: MonobankUserDataResponse = response.data
            if (userInfo && userInfo.name && userInfo.accounts) {
                return ApiResponse.success(
                    response.status,
                    userInfo,
                )
            } else {
                console.warn("Fetching monobank user data failed", response);
                return ApiResponse.fail(
                    0,
                    "failed to load user data",
                )
            }
        } catch (error: any) {
            return ApiResponse.fail(
                error.response?.status,
                error.response?.data?.errorDescription,
            )
        }
    },
}

export default monobankApiClient;
