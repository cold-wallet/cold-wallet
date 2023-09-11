import ccxt from "ccxt";
import ApiResponse from "../../domain/ApiResponse";
import {Balances} from "ccxt/js/src/base/types";

const proxyUrl = 'https://corsproxy.io/?';

const ccxtConnector = {
    getExchanges() {
        return ccxt.exchanges
    },
    async loadUserData(exchange: string, apiKey: string, apiSecret: string | null, password: string | null,
                       additionalSetting: string | null): Promise<ApiResponse<Balances>> {
        const exchangeClass = (ccxt as any)[exchange];
        if (exchangeClass) {
            try {
                const balances: Balances = await new exchangeClass({
                    apiKey: apiKey,
                    secret: apiSecret,
                    password: password,
                    proxyUrl,
                }).fetchBalance();
                const nonZeroBalances = {} as Balances
                Object.entries(balances)
                    .filter(([, balance]) => Number(balance.total))
                    .forEach(([currency, balance]) => nonZeroBalances[currency] = balance)
                return ApiResponse.success(200, nonZeroBalances)
            } catch (error: any) {
                console.error(error)
                return ApiResponse.fail(
                    error?.response?.status,
                    error.message || error.response?.data?.errorDescription,
                )
            }
        }
        return ApiResponse.fail(0, `unknown exchange ${exchange}`);
    }
}

export default ccxtConnector
