// Encryption key used for user data when the user has not set a PIN. It is public (this is open
// source): without a PIN the local data is only obfuscated, not protected. Kept in its own module
// so UserDataService and userDataValidation can both use it without importing each other.
export const DEFAULT_PIN_CODE = "0123456789";
