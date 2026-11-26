import AssetDTO, {AssetType} from "../../domain/AssetDTO";
import uuidGenerator from "../uuidGenerator";
import UserData, {MetaMaskIntegrationSettingsData, UserSettings} from "../../domain/UserData";
import {AddressBalanceResult, MetaMaskAccount} from "../../integrations/metamask/MetaMaskWallet";
import {initUserDataHolder} from "../../services/UserDataService";

/*
 * Demo portfolio: a fixed, realistic set of holdings (same on every visit) so the demo — and the
 * landing's hero screenshot taken from it — always shows a believable mix of fiat and crypto
 * across every source. Labels follow the formats the real integrations produce
 * (monobankApiClient, BinanceApiService, okxApiClient, MetaMaskLoader), so a demo row looks
 * exactly like a connected one. Addresses and card numbers are made up.
 */

type Source = 'manual' | 'binance' | 'monobank' | 'okx' | 'metamask';
type DemoHolding = { currency: string; amount: string; name: string; type: AssetType };

const FIAT_SCALE = 2;
const CRYPTO_SCALE = 8;
const DEMO_WALLET = '0x8b2f41c97e0d6a35f1c4e2b9a07d3e5c6f9a1b24';

const MANUAL: DemoHolding[] = [
    {currency: 'EUR', amount: '9500.00', name: 'Savings account', type: AssetType.fiat},
    {currency: 'USD', amount: '4800.00', name: 'Cash', type: AssetType.fiat},
    {currency: 'GBP', amount: '2300.00', name: 'Revolut', type: AssetType.fiat},
];

const MONOBANK: DemoHolding[] = [
    {currency: 'UAH', amount: '86400.00', name: 'UAH 537541******4127 black', type: AssetType.fiat},
    {currency: 'USD', amount: '3250.00', name: 'USD 537541******8803 black', type: AssetType.fiat},
    {currency: 'EUR', amount: '1840.00', name: 'EUR 537541******2216 white', type: AssetType.fiat},
];

const BINANCE: DemoHolding[] = [
    {currency: 'BTC', amount: '0.142', name: 'BTC Funding', type: AssetType.crypto},
    {currency: 'USDT', amount: '3200', name: 'USDT Funding', type: AssetType.crypto},
    {currency: 'BNB', amount: '2.4', name: 'BNB Funding', type: AssetType.crypto},
];

const OKX: DemoHolding[] = [
    {currency: 'ETH', amount: '1.85', name: 'ETH funding OKX', type: AssetType.crypto},
    {currency: 'SOL', amount: '24', name: 'SOL trading OKX', type: AssetType.crypto},
];

const METAMASK: DemoHolding[] = [
    {currency: 'ETH', amount: '0.62', name: `ETH Ethereum ${DEMO_WALLET}`, type: AssetType.crypto},
    {currency: 'USDC', amount: '1250', name: `USDC Base ${DEMO_WALLET}`, type: AssetType.crypto},
];

function toAssets(holdings: DemoHolding[], source: Source): AssetDTO[] {
    return holdings.map(({currency, amount, name, type}) => new AssetDTO(
        uuidGenerator.generateUUID(),
        currency,
        amount,
        name,
        type === AssetType.fiat ? FIAT_SCALE : CRYPTO_SCALE,
        type,
        source === 'binance',
        source === 'monobank',
        source === 'okx',
        false,
        null,
        source === 'metamask',
    ));
}

/** Builds a fresh demo UserDataHolder (demo manual holdings + demo settings), already in demo mode. */
export function buildDemoUserDataHolder() {
    const userData = new UserData(
        uuidGenerator.generateUUID(),
        createDemoUserSettings(),
        createDemoAssets(),
    );
    return initUserDataHolder(userData, true);
}

/** Hand-entered ("Cash / Manual") demo holdings. Integration holdings come from the loaders below. */
export function createDemoAssets() {
    return toAssets(MANUAL, 'manual');
}

export function createDemoBinanceAssets() {
    return toAssets(BINANCE, 'binance');
}

export function createDemoOkxAssets() {
    return toAssets(OKX, 'okx');
}

export function createDemoMetamaskAssets() {
    return toAssets(METAMASK, 'metamask');
}

export function createDemoMonobankAssets() {
    return toAssets(MONOBANK, 'monobank');
}

export function createDemoUserSettings() {
    return new UserSettings(
        true,
        null,
        true,
        null,
        null,
        true,
        null,
        null,
        null,
        null,
        null,
        {},
        {
            enabled: true,
            accounts: {
                "0xdemo0123456789": {
                    "ETH": {
                        0: {
                            chainId: 0,
                            address: '0xdemo0123456789',
                            decimals: 8,
                            formatted: "1.001",
                            symbol: "ETH",
                            value: "1.001",
                        } as AddressBalanceResult
                    }
                }
            } as MetaMaskAccount,
        } as MetaMaskIntegrationSettingsData
    );
}
