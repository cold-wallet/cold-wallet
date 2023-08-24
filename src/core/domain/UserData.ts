import AssetDTO from "./AssetDTO";

export class UserSettings {
    constructor(
        public monobankIntegrationEnabled: boolean = false,
        public monobankIntegrationToken: string | null = null,
        public binanceIntegrationEnabled: boolean = false,
        public binanceIntegrationApiKey: string | null = null,
        public binanceIntegrationApiSecret: string | null = null,
        public pinCode: string | null = null,
    ) {
    }
}

export default class UserData {
    constructor(
        public id: string | null = null,
        public settings: UserSettings = new UserSettings(),
        public assets: AssetDTO[] = [],
    ) {
    }
}
