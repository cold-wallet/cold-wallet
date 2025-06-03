export default class UserDataHolder {
    constructor(
        public pinCodeEncrypted: boolean,
        public encryptedData: string,
        public demo: boolean = false,
    ) {
    }
}
