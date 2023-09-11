import ccxt from "ccxt";
import ApiResponse from "../../domain/ApiResponse";
import {Balances} from "ccxt/js/src/base/types";
import fiatCurrencies from "../../fiatCurrencies";
import AssetDTO, {AssetType} from "../../domain/AssetDTO";

const proxyUrl = 'https://corsproxy.io/?';

const ccxtConnector = {
    getExchanges() {
        return ccxt.exchanges
    },
    async loadUserData(exchange: string, apiKey: string, apiSecret: string | null, password: string | null,
                       additionalSetting: string | null): Promise<ApiResponse<AssetDTO[]>> {
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
                console.log(`successfully loaded ${exchange} account data`, nonZeroBalances)
                const assets = Object.entries(nonZeroBalances)
                    .map(([currency, balance]) => {
                        const name = `${currency} SPOT`;
                        const fiatCurrency = fiatCurrencies.getByStringCode(currency);
                        const isFiat = !!fiatCurrency
                        return new AssetDTO(
                            `${exchange}_${name}`,
                            currency,
                            String(balance.total),
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
