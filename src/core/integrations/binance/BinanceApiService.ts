import BinanceApi from './binance-api-node/dist'
import {
    Account,
    Binance,
    FundingWallet,
    IsolatedAsset,
    IsolatedAssetSingle,
    IsolatedCrossAccount,
    SimpleEarnFlexibleProductPosition,
    SimpleEarnFlexibleProductPositionResponse,
    SimpleEarnLockedProductPosition,
    SimpleEarnLockedProductPositionResponse
} from "binance-api-node";
import AssetDTO, {crypto, fiat} from "../../domain/AssetDTO";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import OldSpot from "./connector/spot";
import fiatCurrencies from "../../fiatCurrencies";
// import Spot from './@binance/connector/src/spot'

const proxyUrl = "https://ntrocp887e.execute-api.eu-central-1.amazonaws.com/prod/binance"
//"https://api.binance.com"
// 'https://corsproxy.io/?url=' + encodeURIComponent("https://api.binance.com")
//     "https://proxy.corsfix.com/?https://api.binance.com"

class BinanceApiService {

    // newClient: Spot
    client: Binance
    customClient: SpotClient
    binanceCurrencies: { [p: string]: BinanceCurrencyResponse } | null;

    constructor(
        apiKey: string,
        apiSecret: string,
        binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null
    ) {
        this.client = BinanceApi({apiKey, apiSecret, httpBase: proxyUrl})
        this.binanceCurrencies = binanceCurrencies;
        this.customClient = new OldSpot(apiKey, apiSecret, {baseURL: proxyUrl}) as SpotClient
        // this.newClient = new Spot(apiKey, apiSecret)
    }

    accountInfo(): Promise<Account> {
        return this.client.accountInfo()
    }

    async isolatedMarginAssets(): Promise<AssetDTO[]> {
        //this.newClient.marginIsolated
        let account = await this.client.marginIsolatedAccount()//
        return account.assets
            .reduce((arr: IsolatedAssetSingle[], account: IsolatedAsset) => {
                arr.push(account.baseAsset)
                arr.push(account.quoteAsset)
                return arr;
            }, [])
            .filter((p) => +p.netAsset)
            .map((balance) => {
                let name = `${balance.asset} Margin Isolated`
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.netAsset,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    async crossMarginAssets(): Promise<AssetDTO[]> {
        let marginAccount: IsolatedCrossAccount = await this.client.marginAccountInfo();//
        return marginAccount.userAssets
            .filter((p) => +p.netAsset)
            .map((balance) => {
                const name = `${balance.asset} Margin Cross`
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.netAsset,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    async futuresBalancesUsdM(): Promise<AssetDTO[]> {
        let balances = await this.client.futuresAccountBalance();
        return balances.filter(f => +f.balance)
            .map((balance) => {
                const name = `${balance.asset} Futures USD-M`
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.balance,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    async futuresBalancesCoinM(): Promise<AssetDTO[]> {
        // let response: Response<FuturesAssetCoinM[]> = await this.customClient.futuresCoinMBalance();
        let response: FuturesAssetCoinM[] = await this.client.deliveryAccountBalance();
        return response.filter((f: FuturesAssetCoinM) => +f.balance)
            .map((balance) => {
                const name = `${balance.asset} Futures COIN-M`
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.balance,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    async fundingAssets(): Promise<AssetDTO[]> {
        let response: FundingWallet[] = await this.client.fundingWallet();//
        return response.filter((asset) => +asset.free)
            .map((balance) => {
                const name = `${balance.asset} Funding`
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.free,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    // replaced by earning fixed
    // async lockedStaking(): Promise<AssetDTO[]> {
    //`STAKING` - for Locked Staking
    // let response: Response<StakingPosition[]> = await this.customClient.stakingProductPosition('STAKING');
    // return response.data.map((balance) => {
    //     const name = `${balance.asset} Staking Locked`
    //     const id = `binance ${name}`;
    //     return new AssetDTO(
    //         id,
    //         balance.asset,
    //         balance.amount,
    //         name,
    //         (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
    //         fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
    //         true,
    //     )
    // })
    // }

    async lockedDeFiStaking(): Promise<AssetDTO[]> {
        //`L_DEFI` - for locked DeFi Staking
        let response: Response<StakingPosition[]> = await this.customClient.stakingProductPosition('L_DEFI');
        return response.data.map((balance) => {
            const name = `${balance.asset} Staking Locked DeFi`
            const id = `binance ${name}`;
            return new AssetDTO(
                id,
                balance.asset,
                balance.amount,
                name,
                (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                true,
            )
        })
    }

    async flexibleDefiStaking(): Promise<AssetDTO[]> {
        //`F_DEFI` - for flexible DeFi Staking
        let response: Response<StakingPosition[]> = await this.customClient.stakingProductPosition('F_DEFI');
        return response.data.map((balance) => {
            const name = `${balance.asset} Staking Flexible DeFi`
            const id = `binance ${name}`;
            return new AssetDTO(
                id,
                balance.asset,
                balance.amount,
                name,
                (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                true,
            )
        })
    }

    // DEPRECATED: Binance discontinued bswap/liquid swap endpoints in January 2024
    // 
    // ❌ FUNCTIONALITY GAP: Simple Earn does NOT fully replace Liquid Swap
    // 
    // Liquid Swap provided:
    // - Dual-asset liquidity provision (BNB/USDT, BTC/ETH pairs)
    // - Trading fee rewards from market making
    // - Impermanent loss exposure with higher potential yields
    //
    // Simple Earn provides:
    // - Single-asset lending/staking only
    // - Fixed/flexible interest rates
    // - No dual-asset exposure
    //
    // MISSING ALTERNATIVES that could partially replace this functionality:
    // - BNB Vault (combines multiple BNB earning strategies)
    // - Auto-Invest (DCA with automatic reinvestment)
    // - Dual Investment (structured products with dual-asset exposure)
    // - Launchpool (stake to earn new token rewards)
    //
    // TODO: Consider implementing these alternative endpoints:
    // - /sapi/v1/bnb-vault/* (BNB Vault)  
    // - /sapi/v1/lending/auto-invest/* (Auto-Invest)
    // - /sapi/v1/dual-investment/* (Dual Investment)
    // - /sapi/v1/mining/* (Launchpool)
    //
    // async liquidityFarming(): Promise<AssetDTO[]> {
    //     return []; // Deprecated - no direct replacement
    // }

    async savingsFixed(): Promise<AssetDTO[]> {
        let savingsAccount: SimpleEarnLockedProductPositionResponse =
            await this.client.getSimpleEarnLockedProductPosition();

        return savingsAccount.rows
            .map((balance: SimpleEarnLockedProductPosition) => {
                let name = `${balance.asset} Earning Fixed ${+balance.apy * 100}%`;
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    balance.asset,
                    balance.amount,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[balance.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(balance.asset) ? fiat : crypto,
                    true,
                )
            })
    }

    async savingsFlexible(): Promise<AssetDTO[]> {
        let savingsAccount: SimpleEarnFlexibleProductPositionResponse =
            await this.client.getSimpleEarnFlexibleProductPosition();
        return savingsAccount.rows
            .map((position: SimpleEarnFlexibleProductPosition) => {
                const name = `${position.asset} Earning Flexible ${+position.latestAnnualPercentageRate * 100}%`;
                const id = `binance ${name}`;
                return new AssetDTO(
                    id,
                    position.asset,
                    position.totalAmount,
                    name,
                    (this.binanceCurrencies && this.binanceCurrencies[position.asset].precision) || 8,
                    fiatCurrencies.getByStringCode(position.asset) ? fiat : crypto,
                    true,
                )
            })
    }
}

interface Response<T> {
    data: T
}

interface StakingPosition {
    amount: string // "0.0001"
    apy: string // "0.0279"
    asset: string // "USDC"
    canRedeemEarly: boolean // true
    deliverDate: number // 1655200800000
    nextInterestPay: string // "0"
    nextInterestPayDate: number // 1655078400000
    payInterestPeriod: number // 1
    productId: string // "USDC*defi"
    redeemingAmt: string // "0"
    renewable: boolean // false
    rewardAmt: string // "0"
    rewardAsset: string // "USDC"
}

// DEPRECATED: Removed LiquidityFarmingPool and LiquidityFarmingPosition interfaces
// These were used for bswap endpoints that Binance discontinued in January 2024

interface SavingFlexiblePosition {
    canRedeem: true
    annualInterestRate: string // "0.1"
    asset: string // "BUSD"
    avgAnnualInterestRate: string // "0.09999905"
    dailyInterestRate: string // "0.00027397"
    freeAmount: string // "5107.93758204"
    freezeAmount: string // "0"
    lockedAmount: string // "0"
    productId: string // "BUSD001"
    productName: string // "BUSD"
    redeemingAmount: string // "0"
    tierAnnualInterestRate: {
        [key: string]: string
    }
    // 0-2000BUSD: "0.10000000"
    // 2000-20000BUSD: "0.02000000"
    // >20000BUSD: "0.01000000"
    todayPurchasedAmount: string // "0.7181452"
    totalAmount: string // "5107.93758204"
    totalInterest: string // "13.89538537"
}

interface SavingFixedPosition {
    asset: string // "USDT"
    canTransfer: boolean // true
    createTimestamp: number // 1654195447000
    duration: number // 30
    endTime: number // 1656806400000
    interest: string // "41.09589"
    interestRate: string // "0.05"
    lot: number // 100
    positionId: number // 2598969
    principal: string // "10000"
    projectId: string // "CUSDT30DAYSS001"
    projectName: string // "USDT"
    purchaseTime: number // 1654195448000
    redeemDate: string // "2022-07-03"
    startTime: number // 1654214400000
    status: string // "HOLDING"
    type: string // "CUSTOMIZED_FIXED"
}

interface FuturesAssetCoinM {
    accountAlias: string // "XqAuFzAuAuXq"
    asset: string // "BNB"
    availableBalance: string // "0.00000001"
    balance: string // "0.00000001"
    crossUnPnl: string // "0.00000000"
    crossWalletBalance: string // "0.00000001"
    updateTime: number // 1654974424727
    withdrawAvailable: string // "0.00000001"
}

interface SpotClient {
    futuresCoinMBalance: () => Promise<Response<FuturesAssetCoinM[]>>
    stakingProductPosition: (p: string) => Promise<Response<StakingPosition[]>>
    // bswapLiquidity: () => Promise<Response<LiquidityFarmingPool[]>> // DEPRECATED: Binance discontinued in Jan 2024
    savingsCustomizedPosition: (a: string) => Promise<Response<SavingFixedPosition[]>>
    savingsFlexibleProductPosition: (a: string) => Promise<Response<SavingFlexiblePosition[]>>
}

export default BinanceApiService
