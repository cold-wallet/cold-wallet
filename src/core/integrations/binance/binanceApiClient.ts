import ApiResponse from "../../domain/ApiResponse";
import Binance, {Account, Symbol, TradingType, TradingType_LT} from 'binance-api-node'
import BinanceApiService from "./BinanceApiService";
import reduceToObject from "../../utils/reduceToObject";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import AssetDTO, {crypto, fiat} from "../../domain/AssetDTO";
import fiatCurrencies from "../../fiatCurrencies";
import {flushThrottleStats, runThrottled} from "./proxyThrottle";

// A user-data refresh is split into sections so the slow-changing, throttle-prone ones can be
// refreshed less often (see BinanceLoader). Each maps to one signed proxy call / AccountInfo field.
export type BinanceSection =
    'spot' | 'marginIsolated' | 'marginCross' | 'futuresUsdM' | 'futuresCoinM' | 'funding'
    | 'lockedDeFiStaking' | 'flexibleDefiStaking' | 'savingsFixed' | 'savingsFlexible';

// Core balances move with trades → refresh every cycle. Staking / simple-earn change slowly and
// are the endpoints that 429 most → refresh on a longer cadence.
export const CORE_SECTIONS: BinanceSection[] = ['spot', 'marginIsolated', 'marginCross', 'futuresUsdM', 'futuresCoinM', 'funding'];
export const HEAVY_SECTIONS: BinanceSection[] = ['lockedDeFiStaking', 'flexibleDefiStaking', 'savingsFixed', 'savingsFlexible'];
const ALL_SECTIONS = new Set<BinanceSection>([...CORE_SECTIONS, ...HEAVY_SECTIONS]);

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
        binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null,
        binanceUserData: AccountInfo | null,
        sections: Set<BinanceSection> = ALL_SECTIONS,
    ) {
        const binanceApiService = new BinanceApiService(key, secret, binanceCurrencies);
        // Spread preserves the fields of any section we're NOT refreshing this cycle (staggering).
        const accountInfo = binanceUserData ? {...binanceUserData} : new AccountInfo()
        if (sections.has('spot')) try {
            const account: Account = await runThrottled(() => binanceApiService.accountInfo(), 'spot');
            accountInfo.account = {
                ...account,
                balances: account.balances
                    .filter(balance => +balance.free + +balance.locked)
                    .filter(balance => !(
                        balance.asset.indexOf("LD") === 0 && (!binanceCurrencies || !binanceCurrencies[balance.asset])
                    ))
                    .map(balance => new AssetDTO(
                        "binance_" + account.accountType + "_" + balance.asset,
                        balance.asset,
                        String(+balance.free + +balance.locked),
                        balance.asset + " " + account.accountType + " binance",
                        (binanceCurrencies && binanceCurrencies[balance.asset]?.precision) || ((() => {
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
        if (sections.has('marginIsolated')) try {
            accountInfo.marginIsolated = await runThrottled(() => binanceApiService.isolatedMarginAssets(), 'marginIsolated')
        } catch (e) {
            console.warn("failed to load isolatedMarginAssets from binance", e)
        }
        if (sections.has('marginCross')) try {
            accountInfo.marginCross = await runThrottled(() => binanceApiService.crossMarginAssets(), 'marginCross')
        } catch (e) {
            console.warn("failed to load crossMarginAssets from binance", e)
        }
        if (sections.has('futuresUsdM')) try {
            accountInfo.futuresUsdM = await runThrottled(() => binanceApiService.futuresBalancesUsdM(), 'futuresUsdM')
        } catch (e) {
            console.warn("failed to load futuresBalancesUsdM from binance", e)
        }
        if (sections.has('futuresCoinM')) try {
            accountInfo.futuresCoinM = await runThrottled(() => binanceApiService.futuresBalancesCoinM(), 'futuresCoinM')
        } catch (e) {
            console.warn("failed to load futuresBalancesCoinM from binance", e)
        }
        if (sections.has('funding')) try {
            accountInfo.funding = await runThrottled(() => binanceApiService.fundingAssets(), 'funding')
        } catch (e) {
            console.warn("failed to load fundingAssets from binance", e)
        }
        // lockedStaking is disabled (Binance removed the endpoint) — no proxy call, no section.
        accountInfo.lockedStaking = []
        if (sections.has('lockedDeFiStaking')) try {
            accountInfo.lockedDeFiStaking = await runThrottled(() => binanceApiService.lockedDeFiStaking(), 'lockedDeFiStaking')
        } catch (e) {
            console.warn("failed to load lockedDeFiStaking from binance", e)
        }
        if (sections.has('flexibleDefiStaking')) try {
            accountInfo.flexibleDefiStaking = await runThrottled(() => binanceApiService.flexibleDefiStaking(), 'flexibleDefiStaking')
        } catch (e) {
            console.warn("failed to load flexibleDefiStaking from binance", e)
        }
        // DEPRECATED: liquidityFarming was removed as Binance discontinued bswap endpoints in January 2024
        // Replacement: Simple Earn products (savingsFixed and savingsFlexible) provide similar functionality
        if (sections.has('savingsFixed')) try {
            accountInfo.savingsFixed = await runThrottled(() => binanceApiService.savingsFixed(), 'savingsFixed')
        } catch (e) {
            console.warn("failed to load savingsFixed from binance", e)
        }
        if (sections.has('savingsFlexible')) try {
            accountInfo.savingsFlexible = await runThrottled(() => binanceApiService.savingsFlexible(), 'savingsFlexible')
        } catch (e) {
            console.warn("failed to load savingsFlexible from binance", e)
        }
        const stats = flushThrottleStats();
        if (stats.retries) console.warn(`binance refresh: ${stats.calls} proxy calls, ${stats.retries} throttle-retries`);
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
        public liquidityFarming?: AssetDTO[], // DEPRECATED: kept for backwards compatibility but no longer populated
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
            // || accountInfo.liquidityFarming?.length // DEPRECATED: no longer used
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
                // .concat(accountInfo.liquidityFarming || []) // DEPRECATED: no longer used
                .concat(accountInfo.savingsFixed || [])
                .concat(accountInfo.savingsFlexible || [])
            : []
    }
}

export default binanceApiClient;
