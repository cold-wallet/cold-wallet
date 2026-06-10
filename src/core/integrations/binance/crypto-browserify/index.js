import randombytes from 'randombytes'
import createHashModule from 'create-hash'
import { default as createHmacModule } from './../create-hmac/browser'
import algos from 'browserify-sign/algos'
import * as p from 'pbkdf2'
import * as aes from 'browserify-cipher'
import * as dh from 'diffie-hellman'
import * as sign from 'browserify-sign'
import createECDHModule from 'create-ecdh'
import * as publicEncryptModule from 'public-encrypt'
import * as rf from 'randomfill'

export const randomBytes = randombytes
export const rng = randombytes
export const pseudoRandomBytes = randombytes
export const prng = randombytes

export const createHash = createHashModule
export const Hash = createHashModule

export const createHmac = createHmacModule
export const Hmac = createHmacModule

const algoKeys = Object.keys(algos)
const hashes = ['sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'md5', 'rmd160'].concat(algoKeys)
export function getHashes() {
    return hashes
}

export const pbkdf2 = p.pbkdf2
export const pbkdf2Sync = p.pbkdf2Sync

export const Cipher = aes.Cipher
export const createCipher = aes.createCipher
export const Cipheriv = aes.Cipheriv
export const createCipheriv = aes.createCipheriv
export const Decipher = aes.Decipher
export const createDecipher = aes.createDecipher
export const Decipheriv = aes.Decipheriv
export const createDecipheriv = aes.createDecipheriv
export const getCiphers = aes.getCiphers
export const listCiphers = aes.listCiphers

export const DiffieHellmanGroup = dh.DiffieHellmanGroup
export const createDiffieHellmanGroup = dh.createDiffieHellmanGroup
export const getDiffieHellman = dh.getDiffieHellman
export const createDiffieHellman = dh.createDiffieHellman
export const DiffieHellman = dh.DiffieHellman

export const createSign = sign.createSign
export const Sign = sign.Sign
export const createVerify = sign.createVerify
export const Verify = sign.Verify

export const createECDH = createECDHModule

export const publicEncrypt = publicEncryptModule.publicEncrypt
export const privateEncrypt = publicEncryptModule.privateEncrypt
export const publicDecrypt = publicEncryptModule.publicDecrypt
export const privateDecrypt = publicEncryptModule.privateDecrypt

// the least I can do is make error messages for the rest of the node.js/crypto api.
// ;[
//   'createCredentials'
// ].forEach(function (name) {
//   exports[name] = function () {
//     throw new Error([
//       'sorry, ' + name + ' is not implemented yet',
//       'we accept pull requests',
//       'https://github.com/crypto-browserify/crypto-browserify'
//     ].join('\n'))
//   }
// })

export const randomFill = rf.randomFill
export const randomFillSync = rf.randomFillSync

export function createCredentials() {
    throw new Error([
        'sorry, createCredentials is not implemented yet',
        'we accept pull requests',
        'https://github.com/crypto-browserify/crypto-browserify'
    ].join('\n'))
}

export const constants = {
    'DH_CHECK_P_NOT_SAFE_PRIME': 2,
    'DH_CHECK_P_NOT_PRIME': 1,
    'DH_UNABLE_TO_CHECK_GENERATOR': 4,
    'DH_NOT_SUITABLE_GENERATOR': 8,
    'NPN_ENABLED': 1,
    'ALPN_ENABLED': 1,
    'RSA_PKCS1_PADDING': 1,
    'RSA_SSLV23_PADDING': 2,
    'RSA_NO_PADDING': 3,
    'RSA_PKCS1_OAEP_PADDING': 4,
    'RSA_X931_PADDING': 5,
    'RSA_PKCS1_PSS_PADDING': 6,
    'POINT_CONVERSION_COMPRESSED': 2,
    'POINT_CONVERSION_UNCOMPRESSED': 4,
    'POINT_CONVERSION_HYBRID': 6
}

// Create default export
const cryptoModule = {
    randomBytes, rng, pseudoRandomBytes, prng,
    createHash, Hash, createHmac, Hmac, getHashes,
    pbkdf2, pbkdf2Sync,
    Cipher, createCipher, Cipheriv, createCipheriv,
    Decipher, createDecipher, Decipheriv, createDecipheriv,
    getCiphers, listCiphers,
    DiffieHellmanGroup, createDiffieHellmanGroup,
    getDiffieHellman, createDiffieHellman, DiffieHellman,
    createSign, Sign, createVerify, Verify,
    createECDH,
    publicEncrypt, privateEncrypt, publicDecrypt, privateDecrypt,
    randomFill, randomFillSync,
    createCredentials, constants
}

export default cryptoModule
