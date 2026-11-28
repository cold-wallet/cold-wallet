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

/** What each section is called in the UI. */
export const BINANCE_SECTION_LABELS: Record<BinanceSection, string> = {
    spot: 'Spot',
    marginIsolated: 'Isolated margin',
    marginCross: 'Cross margin',
    futuresUsdM: 'USDⓈ-M futures',
    futuresCoinM: 'COIN-M futures',
    funding: 'Funding',
    lockedDeFiStaking: 'Locked staking',
    flexibleDefiStaking: 'Flexible staking',
    savingsFixed: 'Locked Simple Earn',
    savingsFlexible: 'Flexible Simple Earn',
};

/** The balances one section loads. */
export function binanceSectionAssets(info: AccountInfo, section: BinanceSection): AssetDTO[] {
    return (section === 'spot' ? info.account?.balances : info[section]) || [];
}

/** The section a Binance holding was loaded by (null: none of the current ones). */
export function binanceSectionOf(info: AccountInfo | null, assetId: string): BinanceSection | null {
    if (!info) return null;
    return [...CORE_SECTIONS, ...HEAVY_SECTIONS]
        .find(section => binanceSectionAssets(info, section).some(a => a.id === assetId)) || null;
}

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
    /** Loads the account's balances section by section. `onSection` hears about each section as
     *  it finishes, with the account as loaded so far (or the error that section failed with), so
     *  callers can show balances and progress before the slow sections are done. */
    async getUserInfoAsync(
        key: string,
        secret: string,
        binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null,
        binanceUserData: AccountInfo | null,
        sections: Set<BinanceSection> = ALL_SECTIONS,
        onSection?: (section: BinanceSection, accountInfo: AccountInfo, error?: unknown) => void,
    ) {
        const binanceApiService = new BinanceApiService(key, secret, binanceCurrencies);
        // Spread preserves the fields of any section we're NOT refreshing this cycle (staggering).
        const accountInfo = binanceUserData ? {...binanceUserData} : new AccountInfo()
        // lockedStaking is disabled (Binance removed the endpoint) — no proxy call, no section.
        accountInfo.lockedStaking = []
        // DEPRECATED: liquidityFarming was removed as Binance discontinued bswap endpoints in January 2024
        // Replacement: Simple Earn products (savingsFixed and savingsFlexible) provide similar functionality
        const loaders: [BinanceSection, () => Promise<void>][] = [
            ['spot', async () => {
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
            }],
            ['marginIsolated', async () => {
                accountInfo.marginIsolated = await runThrottled(() => binanceApiService.isolatedMarginAssets(), 'marginIsolated')
            }],
            ['marginCross', async () => {
                accountInfo.marginCross = await runThrottled(() => binanceApiService.crossMarginAssets(), 'marginCross')
            }],
            ['futuresUsdM', async () => {
                accountInfo.futuresUsdM = await runThrottled(() => binanceApiService.futuresBalancesUsdM(), 'futuresUsdM')
            }],
            ['futuresCoinM', async () => {
                accountInfo.futuresCoinM = await runThrottled(() => binanceApiService.futuresBalancesCoinM(), 'futuresCoinM')
            }],
            ['funding', async () => {
                accountInfo.funding = await runThrottled(() => binanceApiService.fundingAssets(), 'funding')
            }],
            ['lockedDeFiStaking', async () => {
                accountInfo.lockedDeFiStaking = await runThrottled(() => binanceApiService.lockedDeFiStaking(), 'lockedDeFiStaking')
            }],
            ['flexibleDefiStaking', async () => {
                accountInfo.flexibleDefiStaking = await runThrottled(() => binanceApiService.flexibleDefiStaking(), 'flexibleDefiStaking')
            }],
            ['savingsFixed', async () => {
                accountInfo.savingsFixed = await runThrottled(() => binanceApiService.savingsFixed(), 'savingsFixed')
            }],
            ['savingsFlexible', async () => {
                accountInfo.savingsFlexible = await runThrottled(() => binanceApiService.savingsFlexible(), 'savingsFlexible')
            }],
        ];
        for (const [section, load] of loaders) {
            if (!sections.has(section)) continue;
            try {
                await load();
                onSection?.(section, {...accountInfo});
            } catch (e) {
                console.warn(`failed to load ${section} from binance`, e)
                onSection?.(section, {...accountInfo}, e);
            }
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
