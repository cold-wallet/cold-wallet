import AssetDTO from "./AssetDTO";

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
