import ApiResponse from "../../domain/ApiResponse";
import {AccountBalance, Instrument, RestClient, SubAccountBalances, Ticker} from 'okx-api';
import AssetDTO, {crypto, fiat} from "../../domain/AssetDTO";
import fiatCurrencies from "../../fiatCurrencies";
import OkxCurrencyResponse from "./OkxCurrencyResponse";

const okxApiClient = {
    fetchPrices: async (): Promise<ApiResponse<{ [p: string]: string } | any>> => {
        try {
            const tickers: Ticker[] = await new RestClient().getTickers("SPOT")
            const prices = tickers.reduce((merged: { [p: string]: string }, ticker) => {
                merged[ticker.instId/*.replace("-", "_")*/] = ticker.last
                return merged
            }, {});
            return ApiResponse.success(200, prices,)
        } catch (error: any) {
            console.warn('Error fetching prices from OKX:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    fetchCurrencies: async (): Promise<ApiResponse<{ [index: string]: OkxCurrencyResponse } | any>> => {
        try {
            const instruments: Instrument[] = await new RestClient().getInstruments("SPOT")
            const currencies = instruments
                .reduce((merged: { [p: string]: OkxCurrencyResponse }, instrument) => {
                    merged[instrument.baseCcy] = {
                        symbol: instrument.baseCcy,
                        precision: Number(instrument.lotSz)
                    }
                    return merged
                }, {});
            return ApiResponse.success(200, currencies,)
        } catch (error: any) {
            console.warn('Error fetching currencies from OKX:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async getUserInfo(
        apiKey: string,
        apiSecret: string,
        apiPass: string,
        subAccountName: string | null,
        okxCurrencies: { [index: string]: OkxCurrencyResponse },
        okxAccount: OkxAccount | null,
    ) {
        const extractAsset = (balance: { ccy: string, eq: string }) => new AssetDTO(
            "okx_spot_" + balance.ccy,
            balance.ccy,
            String(balance.eq),
            balance.ccy + " SPOT OKX",
            okxCurrencies[balance.ccy]?.precision || ((() => {
                console.warn("not found precision for " + balance.ccy)
                return 8
            })()),
            fiatCurrencies.getByStringCode(balance.ccy) ? fiat : crypto,
            true,
        );

        const client = new RestClient({apiKey, apiSecret, apiPass});
        const accountInfo = okxAccount ? {...okxAccount} : new OkxAccount()
        try {
            const balances: AccountBalance[] = await client.getBalance();
            accountInfo.spotAccountBalances = balances[0].details
                .filter(balance => Number(balance.eq))
                .map(extractAsset)
        } catch (e) {
            console.warn("failed to load balances from OKX", e)
        }
        if (subAccountName) {
            try {
                const subAccountBalances: SubAccountBalances[] = await client.getSubAccountBalances(subAccountName);
                accountInfo.subAccountBalances = subAccountBalances[0].details
                    .filter(balance => Number(balance.eq))
                    .map(extractAsset)
            } catch (e) {
                console.warn("failed to load subAccount balances from OKX", e)
            }
        }
        return accountInfo
    },
}

export class OkxAccount {
    constructor(
        public spotAccountBalances?: AssetDTO[],
        public subAccountBalances?: AssetDTO[],
    ) {
    }

    static assetsExist = (accountInfo: OkxAccount | null): boolean => {
        return !!(accountInfo && (accountInfo.spotAccountBalances?.length
            || accountInfo.subAccountBalances?.length))
    }

    static getAllAssets = (accountInfo: OkxAccount | null): AssetDTO[] => {
        return accountInfo ? [...accountInfo.spotAccountBalances || []]
                .concat(accountInfo.subAccountBalances || [])
            : []
    }
}

export default okxApiClient;
