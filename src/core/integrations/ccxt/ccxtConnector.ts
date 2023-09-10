import ccxt from "ccxt";
import ApiResponse from "../../domain/ApiResponse";

const ccxtConnector = {
    getExchanges() {
        return ccxt.exchanges
    },
    async loadUserData(exchange: string, apiKey: string, apiSecret: string | null, password: string | null,
                       additionalSetting: string | null) {
        const exchangeClass = (ccxt as any)[exchange];
        if (exchangeClass) {
            try {
                const balances = await new exchangeClass({
                    apiKey: apiKey,
                    secret: apiSecret,
                    password: password,
                }).fetchBalance();
                return ApiResponse.success(200, balances)
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
