import AssetDTO, {AssetType} from "../../domain/AssetDTO";
import uuidGenerator from "../uuidGenerator";
import {MetaMaskIntegrationSettingsData, UserSettings} from "../../domain/UserData";
import {AddressBalanceResult, MetaMaskAccount} from "../../integrations/metamask/MetaMaskWallet";

export function createDemoBinanceAssets() {
    const length = 1 + Math.random() * 5;
    return Array.from({length}, () => {
        const currency = getRandomCryptoCurrency();
        return new AssetDTO(
            uuidGenerator.generateUUID(),
            currency,
            getRandomAmount(currency, AssetType.crypto).toString(),
            "demo binance amount",
            8,
            AssetType.crypto,
            true,
            false,
            false,
            false,
            null,
            false,
        )
    })
}

export function createDemoOkxAssets() {
    const length = 1 + Math.random() * 5;
    return Array.from({length}, () => {
        const currency = getRandomCryptoCurrency();
        return new AssetDTO(
            uuidGenerator.generateUUID(),
            currency,
            getRandomAmount(currency, AssetType.crypto).toString(),
            "demo okx amount",
            8,
            AssetType.crypto,
            false,
            false,
            true,
            false,
            null,
            false,
        )
    })
}

export function createDemoMetamaskAssets() {
    const length = 1 + Math.random() * 5;
    return Array.from({length}, () => {
        const currency = getRandomCryptoCurrency();
        return new AssetDTO(
            uuidGenerator.generateUUID(),
            currency,
            getRandomAmount(currency, AssetType.crypto).toString(),
            "demo metamask amount",
            8,
            AssetType.crypto,
            false,
            false,
            false,
            false,
            null,
            true,
        )
    })
}

export function createDemoMonobankAssets() {
    const length = 1 + Math.random() * 5;
    return Array.from({length}, () => {
        const currency = getRandomFiatCurrency();
        return new AssetDTO(
            uuidGenerator.generateUUID(),
            currency,
            getRandomAmount(currency, AssetType.fiat).toString(),
            "demo monobank amount",
            8,
            AssetType.fiat,
            false,
            true,
            false,
            false,
            null,
            false,
        )
    })
}

export function createDemoAssets() {
    function createDemoAsset() {
        function generateOneRandomTrue(length: number): boolean[] {
            const arr = Array.from({length}, () => false);
            const randomIndex = Math.floor(Math.random() * arr.length);
            arr[randomIndex] = true;
            return arr;
        }

        const {currency, type} = getRandomCurrency();
        const randomArr = generateOneRandomTrue(4);
        const isCrypto = type === AssetType.crypto;
        return new AssetDTO(
            uuidGenerator.generateUUID(),
            currency,
            getRandomAmount(currency, type).toString(),
            "demo amount",
            8,
            type,
            isCrypto && randomArr[0],
            isCrypto && randomArr[1],
            isCrypto && randomArr[2],
            false,
            null,
            isCrypto && randomArr[3]
        )
    }

    const length = 1 + Math.random() * 5;
    return Array.from({length}, createDemoAsset);
}

function getRandomBoolean() {
    return Math.random() < 0.5;
}

function getRandomCurrency() {
    const type = getRandomBoolean() ? AssetType.crypto : AssetType.fiat;
    return {
        currency: type === AssetType.crypto ? getRandomCryptoCurrency() : getRandomFiatCurrency(),
        type: type,
    };
}

function getRandomCryptoCurrency(): string {
    return [
        "BTC",
        "ETH",
        "SOL",
        "USDT",
        "USDC",
        "DOT",
        "DAI",
        "BNB",
        "XRP",
        "XLM",
        "ADA",
    ][Number((Math.random() * 10).toFixed())];
}

function getRandomFiatCurrency(): string {
    return [
        "UAH",
        "USD",
        "EUR",
        "GBP",
        "TRY",
        "PLN",
    ][Number((Math.random() * 5).toFixed())];
}

function getRandomAmount(currency: string, type: AssetType = AssetType.crypto): number {
    return Math.random() * (currency === "BTC" ? Math.random()// * Math.random() * 10
            : currency === "ETH" || currency === "BNB" ? 10
                : (type === AssetType.fiat ? 10000 : currency.startsWith("USD") ? 1000 : 100)
    );
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

