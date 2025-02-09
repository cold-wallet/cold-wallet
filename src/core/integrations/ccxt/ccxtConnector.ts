import ccxt from "ccxt";
import ApiResponse from "../../domain/ApiResponse";
import fiatCurrencies from "../../fiatCurrencies";
import AssetDTO, {AssetType} from "../../domain/AssetDTO";

const proxyUrl = 'https://corsproxy.io/?url=';

const ccxtConnector = {
    getExchanges() {
        return ccxt.exchanges
    },
    async loadUserData(exchange: string, apiKey: string, apiSecret: string | null, password: string | null,
                       additionalSetting: string | null): Promise<ApiResponse<AssetDTO[]>> {
        const exchangeClass = (ccxt as any)[exchange];
        if (exchangeClass) {
            try {
                const exchangeInstance = new exchangeClass({
                    apiKey: apiKey,
                    secret: apiSecret,
                    password: password,
                    //proxyUrl,
                });
                const balances: { [currency: string]: number } = await exchangeInstance.fetchTotalBalance()
                const nonZeroBalances = {} as { [currency: string]: number }
                Object.entries(balances)
                    .filter(([, total]) => Number(total))
                    .forEach(([currency, total]) => nonZeroBalances[currency] = total)
                console.log(`successfully loaded ${exchange} account data`, nonZeroBalances)
                const assets = Object.entries(nonZeroBalances)
                    .map(([currency, total]) => {
                        const name = `${currency} SPOT`;
                        const fiatCurrency = fiatCurrencies.getByStringCode(currency);
                        const isFiat = !!fiatCurrency
                        return new AssetDTO(
                            `${exchange}_${name}`,
                            currency,
                            String(total),
                            name,
                            fiatCurrency?.afterDecimalPoint || 8, // todo: in future, inject correct value by fetching from appropriate service
                            isFiat ? AssetType.fiat : AssetType.crypto,
                            false,
                            false,
                            false,
                            true,
                            exchange,
                        );
                    })
                return ApiResponse.success(200, assets)
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
