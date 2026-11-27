// services/userDataValidation.ts — checks a pasted backup token before it can replace what's stored.
// (Data decrypted from localStorage is canonicalised in UserDataService.sanitizeUserData.)
import { z } from 'zod';
import UserDataHolder from '../domain/UserDataHolder';
import cypherService from './CypherService';
import UserData from '../domain/UserData';
import { DEFAULT_PIN_CODE, openUserDataHolder, type ImportedWallet } from './UserDataService';
import { isNewerFormat, WrongPinError } from './PinVault';
import { validateAmount } from '../utils/amount';

const holderSchema = z.object({
  pinCodeEncrypted: z.boolean(),
  encryptedData: z.string().min(16),
  demo: z.boolean().optional(),
});

const assetSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(1).max(128), // CoinGecko has 38-char tickers; this only stops junk
  amount: z.union([z.string(), z.number()]).refine((v) => validateAmount(v).ok, 'amount must be a positive number'),
  name: z.string().min(1),
  decimalScale: z.number().int().min(0).max(36),
  type: z.number().int().min(0).max(1),
}).passthrough();

const userDataSchema = z.object({
  id: z.string().nullable().optional(),
  settings: z.object({}).passthrough(),
  assets: z.array(assetSchema),
  lastOnline: z.number().optional(),
}).passthrough();

export type BackupError = 'not-a-backup' | 'damaged' | 'demo' | 'newer-version' | 'pin-required' | 'wrong-pin' | 'browser';
export type BackupResult = { ok: true; wallet: ImportedWallet } | { ok: false; error: BackupError };

export const BACKUP_ERROR_TEXT: Record<BackupError, string> = {
  'not-a-backup': "This isn't a Cold Wallet backup token. Copy it again from Export.",
  damaged: 'This backup is damaged or incomplete, so nothing was changed.',
  demo: 'This backup was made in demo mode and has no real portfolio to restore.',
  'newer-version': 'This backup was made by a newer version of Cold Wallet. Reload the page to update, then try again.',
  'pin-required': 'This backup is protected with a PIN. Enter it so the backup can be checked before restoring.',
  'wrong-pin': 'Wrong PIN, or the backup is damaged. Nothing was changed.',
  browser: "This browser couldn't check the backup (it may be short on memory). Nothing was changed. Try again, or use another browser.",
};

/**
 * Decode and fully check a backup token before it may replace anything: the holder's shape, then
 * the payload is decrypted (with the default key, or with `pin` for a PIN-protected backup) and the
 * decrypted JSON is validated. A cut or mangled token fails to decrypt / parse here, so it can never
 * overwrite the stored portfolio. A PIN-protected backup without `pin` returns 'pin-required'.
 */
export async function parseBackupToken(token: string, pin?: string): Promise<BackupResult> {
  let parsed: unknown;
  try {
    const text = Buffer.from(token.replace(/\s+/g, ''), 'base64').toString('ascii');
    parsed = JSON.parse(decodeURIComponent(text));
  } catch {
    return { ok: false, error: 'not-a-backup' };
  }
  const holder = holderSchema.safeParse(parsed);
  if (!holder.success) return { ok: false, error: 'not-a-backup' };
  if (holder.data.demo) return { ok: false, error: 'demo' };
  if (isNewerFormat(holder.data.encryptedData)) return { ok: false, error: 'newer-version' };

  const pinProtected = holder.data.pinCodeEncrypted;
  if (pinProtected && !pin) return { ok: false, error: 'pin-required' };
  const failed: BackupError = pinProtected ? 'wrong-pin' : 'damaged';
  const stored = new UserDataHolder(pinProtected, holder.data.encryptedData, false);
  let payload: unknown;
  let pinKey = null;
  try {
    // throws on a wrong key or a damaged ciphertext
    if (pinProtected) {
      ({ data: payload, pinKey } = await openUserDataHolder(stored, pin as string));
    } else {
      payload = cypherService.decrypt<unknown>(holder.data.encryptedData, DEFAULT_PIN_CODE);
    }
  } catch (e) {
    // a PIN that can't open it vs. a browser that couldn't derive the key (e.g. short on memory)
    return { ok: false, error: !pinProtected || e instanceof WrongPinError ? failed : 'browser' };
  }
  if (!userDataSchema.safeParse(payload).success) return { ok: false, error: failed };
  return { ok: true, wallet: { holder: stored, data: payload as UserData, pinKey } };
}
