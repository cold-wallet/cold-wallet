import ApiResponse from "../../domain/ApiResponse";
import Binance, {Account, Symbol} from 'binance-api-node'
import BinanceApiService from "./BinanceApiService";
import reduceToObject from "../../utils/reduceToObject";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import AssetDTO from "../../domain/AssetDTO";

const binanceApiClient = {
    fetchBinancePrices: async (): Promise<ApiResponse<{ [p: string]: string } | any>> => {
        try {
            const prices = await Binance().prices();
            return ApiResponse.success(200, prices,)
        } catch (error: any) {
            console.warn('Error fetching prices from binance:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    fetchBinanceCurrencies: async (): Promise<ApiResponse<{ [index: string]: BinanceCurrencyResponse } | any>> => {
        try {
            const response = await Binance().exchangeInfo();
            const binanceCurrenciesLoaded: {
                [index: string]: BinanceCurrencyResponse
            } = reduceToObject(response.symbols, (symbol: Symbol) => {
                return [
                    symbol.baseAsset, new BinanceCurrencyResponse(symbol.baseAsset, symbol.baseAssetPrecision,),
                    symbol.quoteAsset, new BinanceCurrencyResponse(symbol.quoteAsset, symbol.quoteAssetPrecision,)
                ]
            })
            return ApiResponse.success(200, binanceCurrenciesLoaded,)
        } catch (error: any) {
            console.warn('Error fetching currencies from binance:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async getUserInfoAsync(
        key: string,
        secret: string,
        binanceCurrencies: { [index: string]: BinanceCurrencyResponse }
    ) {
        const binanceApiService = new BinanceApiService(key, secret, binanceCurrencies);
        // spot account info
        let account = await binanceApiService.accountInfo();
        const accountInfo = new AccountInfo(account)
        try {
            accountInfo.marginIsolated = await binanceApiService.isolatedMarginAssets()
        } catch (e) {
            console.warn("failed to load isolatedMarginAssets from binance", e)
        }
        try {
            accountInfo.marginCross = await binanceApiService.crossMarginAssets()
        } catch (e) {
            console.warn("failed to load crossMarginAssets from binance", e)
        }
        try {
            accountInfo.futuresUsdM = await binanceApiService.futuresBalancesUsdM()
        } catch (e) {
            console.warn("failed to load futuresBalancesUsdM from binance", e)
        }
        try {
            accountInfo.futuresCoinM = await binanceApiService.futuresBalancesCoinM()
        } catch (e) {
            console.warn("failed to load futuresBalancesCoinM from binance", e)
        }
        try {
            accountInfo.funding = await binanceApiService.fundingAssets()
        } catch (e) {
            console.warn("failed to load fundingAssets from binance", e)
        }
        try {
            accountInfo.lockedStaking = await binanceApiService.lockedStaking()
        } catch (e) {
            console.warn("failed to load lockedStaking from binance", e)
        }
        try {
            accountInfo.lockedDeFiStaking = await binanceApiService.lockedDeFiStaking()
        } catch (e) {
            console.warn("failed to load lockedDeFiStaking from binance", e)
        }
        try {
            accountInfo.flexibleDefiStaking = await binanceApiService.flexibleDefiStaking()
        } catch (e) {
            console.warn("failed to load flexibleDefiStaking from binance", e)
        }
        try {
            accountInfo.liquidityFarming = await binanceApiService.liquidityFarming()
        } catch (e) {
            console.warn("failed to load liquidityFarming from binance", e)
        }
        try {
            accountInfo.savingsFixed = await binanceApiService.savingsFixed()
        } catch (e) {
            console.warn("failed to load savingsFixed from binance", e)
        }
        try {
            accountInfo.savingsFlexible = await binanceApiService.savingsFlexible()
        } catch (e) {
            console.warn("failed to load savingsFlexible from binance", e)
        }
        return accountInfo
    },
}

export class AccountInfo {
    constructor(
        public account: Account,
        public marginIsolated?: AssetDTO[],
        public marginCross?: AssetDTO[],
        public futuresUsdM?: AssetDTO[],
        public futuresCoinM?: AssetDTO[],
        public funding?: AssetDTO[],
        public lockedStaking?: AssetDTO[],
        public lockedDeFiStaking?: AssetDTO[],
        public flexibleDefiStaking?: AssetDTO[],
        public liquidityFarming?: AssetDTO[],
        public savingsFixed?: AssetDTO[],
        public savingsFlexible?: AssetDTO[],
    ) {
    }
}

export default binanceApiClient;
