export class MonobankAccountResponse {
    constructor(
        public id: string, // "seRrRZYX-Z2Mpb2F22tUCA",
        public sendId: string, // "938Dk4E8Xk",
        public currencyCode: number, // 980,
        public cashbackType: string, // "UAH",
        public balance: number, // 1050740,
        public creditLimit: number, // 0,
        public maskedPan: string[], // ["444111******5540"],
        public type: string, // "black",
        public iban: string, // "UA523220010000026207305948063"
    ) {
    }
}

export class MonobankJarResponse {
    constructor(
        public id: string, // "kMV4b-D8Bkdir5x6naUJALewxBYIh18",
        public sendId: string, // "jar/6Rr9vrccPf",
        public title: string, // "На   на",
        public description: string, // "",
        public currencyCode: number, // 980,
        public balance: number, // 0,
        public goal: number, // 10000
    ) {
    }
}

export default class MonobankUserDataResponse {
    constructor(
        public clientId: string, // 938Dk4E8Xk",
        public name: string, // "Максимчук Сергій",
        public webHookUrl: string, // "",
        public permissions: string, // "psfj",
        public accounts: MonobankAccountResponse[],
        public jars: MonobankJarResponse[],
    ) {
    }

    static assetsExist = (accountInfo: MonobankUserDataResponse | null) => {
        return accountInfo && (accountInfo.accounts?.length || accountInfo.jars?.length)
    }
}
