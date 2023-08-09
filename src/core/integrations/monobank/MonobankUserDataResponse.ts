export class MonobankAccountResponse {
    constructor(
        public id: string,
        public sendId: string,
        public currencyCode: number, // 980,
        public cashbackType: string, // "UAH",
        public balance: number, // 1050740,
        public creditLimit: number, // 0,
        public maskedPan: string[], // ["444111******5540"],
        public type: string, // "black",
        public iban: string,
    ) {
    }
}

export class MonobankJarResponse {
    constructor(
        public id: string,
        public sendId: string,
        public title: string,
        public description: string,
        public currencyCode: number, // 980,
        public balance: number, // 0,
        public goal: number, // 10000
    ) {
    }
}

export default class MonobankUserDataResponse {
    constructor(
        public clientId: string,
        public name: string,
        public webHookUrl: string,
        public permissions: string,
        public accounts: MonobankAccountResponse[],
        public jars: MonobankJarResponse[],
    ) {
    }
}
