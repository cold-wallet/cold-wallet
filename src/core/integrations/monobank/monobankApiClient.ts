import axios, {AxiosResponse} from "axios";
import fiatCurrencies from "../../fiatCurrencies";
import MonobankCurrencyResponse from "./MonobankCurrencyResponse";
import MonobankUserDataResponse, {MonobankAccountResponse, MonobankJarResponse} from "./MonobankUserDataResponse";
import MonobankPublicDataResponse from "./MonobankPublicDataResponse";
import ApiResponse from "../../domain/ApiResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";
import reduceToObject from "../../utils/reduceToObject";
import MonobankUserData from "./MonobankUserData";
import AssetDTO, {fiat} from "../../domain/AssetDTO";

let monobankBaseUrl = 'https://api.monobank.ua';
const urlMonobankRates = monobankBaseUrl + '/bank/currency';
const urlMonobankClientInfo = monobankBaseUrl + '/personal/client-info';


function extractAssetsFromMonobankAccounts(accounts: MonobankAccountResponse[]) {
    return accounts.filter(account => +account.balance)
        .map(account => {
            let fiatCurrency = fiatCurrencies.getByNumCode(account.currencyCode);
            if (!fiatCurrency) {
                const message = `unknown currency numCode ${account.currencyCode}`;
                console.error(message)
                fiatCurrency = {
                    code: String(account.currencyCode),
                    numCode: String(account.currencyCode),
                    afterDecimalPoint: 2,
                    name: message,
                } as FiatCurrency
            }
            const name = `${fiatCurrency.code} ${account.maskedPan
                ? (account.maskedPan[0] ? (account.maskedPan[0] + " ") : "")
                : ""}${account.type}`;
            return new AssetDTO(
                "monobank_" + account.id,
                fiatCurrency.code,
                String(account.balance / 100),
                name,
                fiatCurrency.afterDecimalPoint,
                fiat,
                false,
                true,
            )
        })
}

function extractAssetsFromMonobankJars(jars: MonobankJarResponse[]) {
    return jars.filter(jar => +jar.balance)
        .map(jar => {
            let fiatCurrency = fiatCurrencies.getByNumCode(jar.currencyCode);
            if (!fiatCurrency) {
                const message = `unknown currency numCode ${jar.currencyCode}`;
                console.error(message)
                fiatCurrency = {
                    code: String(jar.currencyCode),
                    numCode: String(jar.currencyCode),
                    afterDecimalPoint: 2,
                    name: message,
                } as FiatCurrency
            }
            const name = `${fiatCurrency.code} ${jar.title}`;
            return new AssetDTO(
                "monobank_jar_" + jar.id,
                fiatCurrency.code,
                String(jar.balance / 100),
                name,
                fiatCurrency.afterDecimalPoint,
                fiat,
                false,
                true,
            )
        })
}

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
    getUserInfo: async (token: string): Promise<ApiResponse<MonobankUserData | any>> => {
        try {
            const response: AxiosResponse<MonobankUserDataResponse> = await axios.get(urlMonobankClientInfo, {
                headers: {
                    "X-Token": token,
                }
            });
            const userInfo: MonobankUserDataResponse = response.data
            if (userInfo && userInfo.name && userInfo.accounts) {
                const accounts = extractAssetsFromMonobankAccounts(userInfo.accounts);
                const jars = extractAssetsFromMonobankJars(userInfo.jars);
                const accountInfo: MonobankUserData = {
                    ...userInfo,
                    accounts,
                    jars,
                }
                return ApiResponse.success(
                    response.status,
                    accountInfo,
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
