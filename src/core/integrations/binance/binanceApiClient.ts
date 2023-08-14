import ApiResponse from "../../domain/ApiResponse";
import Binance, {Account, Symbol, TradingType, TradingType_LT} from 'binance-api-node'
import BinanceApiService from "./BinanceApiService";
import reduceToObject from "../../utils/reduceToObject";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import AssetDTO, {crypto, fiat} from "../../domain/AssetDTO";
import fiatCurrencies from "../../fiatCurrencies";

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
        binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
        binanceUserData: AccountInfo | null,
    ) {
        const binanceApiService = new BinanceApiService(key, secret, binanceCurrencies);
        const accountInfo = binanceUserData ? {...binanceUserData} : new AccountInfo()
        try {
            const account: Account = await binanceApiService.accountInfo();
            accountInfo.account = {
                ...account,
                balances: account.balances
                    .filter(balance => +balance.free + +balance.locked)
                    .filter(balance => !(
                        balance.asset.indexOf("LD") === 0 && !binanceCurrencies[balance.asset]
                    ))
                    .map(balance => new AssetDTO(
                        "binance_" + account.accountType + "_" + balance.asset,
                        balance.asset,
                        String(+balance.free + +balance.locked),
                        balance.asset + " " + account.accountType + " binance",
                        binanceCurrencies[balance.asset]?.precision || ((() => {
                            console.warn("not found precision for " + balance.asset)
                            return 8
                        })()),
                        fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                        true,
                    ))
            } as SpotAccount
        } catch (e) {
            console.warn("failed to load accountInfo from binance", e)
        }
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

export interface SpotAccount {
    accountType: TradingType.MARGIN | TradingType.SPOT
    balances: AssetDTO[]
    buyerCommission: number
    canDeposit: boolean
    canTrade: boolean
    canWithdraw: boolean
    makerCommission: number
    permissions: TradingType_LT[]
    sellerCommission: number
    takerCommission: number
    updateTime: number
}

export class AccountInfo {
    constructor(
        public account?: SpotAccount,
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

    static assetsExist = (accountInfo: AccountInfo | null): boolean => {
        return !!(accountInfo && (accountInfo.account?.balances.length
            || accountInfo.marginIsolated?.length
            || accountInfo.marginCross?.length
            || accountInfo.futuresUsdM?.length
            || accountInfo.futuresCoinM?.length
            || accountInfo.funding?.length
            || accountInfo.lockedStaking?.length
            || accountInfo.lockedDeFiStaking?.length
            || accountInfo.flexibleDefiStaking?.length
            || accountInfo.liquidityFarming?.length
            || accountInfo.savingsFixed?.length
            || accountInfo.savingsFlexible?.length))
    }

    static getAllAssets = (accountInfo: AccountInfo | null): AssetDTO[] => {
        return accountInfo ? [...accountInfo.account?.balances || []]
                .concat(accountInfo.marginIsolated || [])
                .concat(accountInfo.marginCross || [])
                .concat(accountInfo.futuresUsdM || [])
                .concat(accountInfo.futuresCoinM || [])
                .concat(accountInfo.funding || [])
                .concat(accountInfo.lockedStaking || [])
                .concat(accountInfo.lockedDeFiStaking || [])
                .concat(accountInfo.flexibleDefiStaking || [])
                .concat(accountInfo.liquidityFarming || [])
                .concat(accountInfo.savingsFixed || [])
                .concat(accountInfo.savingsFlexible || [])
            : []
    }
}

export default binanceApiClient;
