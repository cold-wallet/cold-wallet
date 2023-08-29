const CryptoJS = require("crypto-js");

const cypherService = {
    encrypt<T>(data: T, secret: string) {
        return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
    },

    decrypt<T>(cipherText: string, secret: string): T {
        const bytes = CryptoJS.AES.decrypt(cipherText, secret);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }

}

export default cypherService
