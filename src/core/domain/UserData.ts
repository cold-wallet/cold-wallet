import AssetDTO from "./AssetDTO";
import {MetaMaskAccount} from "../integrations/metamask/MetaMaskWallet";

export interface Integrations {
    [p: string]: IntegrationSettingsData,
}

export interface IntegrationSettingsData {
    enabled: boolean,
    apiKey: string,
    apiSecret: string,
    password: string | null,
    additionalSetting: string | null,
}

export interface MetaMaskIntegrationSettingsData {
    enabled: boolean,
    accounts: MetaMaskAccount,
}

export class UserSettings {
    constructor(
        public monobankIntegrationEnabled: boolean = false,
        public monobankIntegrationToken: string | null = null,
        public binanceIntegrationEnabled: boolean = false,
        public binanceIntegrationApiKey: string | null = null,
        public binanceIntegrationApiSecret: string | null = null,
        public okxIntegrationEnabled: boolean = false,
        public okxIntegrationApiKey: string | null = null,
        public okxIntegrationApiSecret: string | null = null,
        public okxIntegrationPassPhrase: string | null = null,
        public okxIntegrationSubAccountName: string | null = null,
        public pinCode: string | null = null,
        public integrations: Integrations = {},
        public metaMask: MetaMaskIntegrationSettingsData = {
            enabled: false,
            accounts: {} as MetaMaskAccount,
        } as MetaMaskIntegrationSettingsData,
    ) {
    }
}

export default class UserData {
    constructor(
        public id: string | null = null,
        public settings: UserSettings = new UserSettings(),
        public assets: AssetDTO[] = [],
        public lastOnline: number = 0,
    ) {
    }
}
