// services/userDataValidation.ts — checks a pasted backup token before it can replace what's stored.
// (Data decrypted from localStorage is canonicalised in UserDataService.sanitizeUserData.)
import { z } from 'zod';
import UserDataHolder from '../domain/UserDataHolder';
import cypherService from './CypherService';
import { DEFAULT_PIN_CODE } from './UserDataService';
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

export type BackupError = 'not-a-backup' | 'damaged' | 'demo' | 'pin-required' | 'wrong-pin';
export type BackupResult = { ok: true; holder: UserDataHolder } | { ok: false; error: BackupError };

export const BACKUP_ERROR_TEXT: Record<BackupError, string> = {
  'not-a-backup': "This isn't a Cold Wallet backup token. Copy it again from Export.",
  damaged: 'This backup is damaged or incomplete, so nothing was changed.',
  demo: 'This backup was made in demo mode and has no real portfolio to restore.',
  'pin-required': 'This backup is protected with a PIN. Enter it so the backup can be checked before restoring.',
  'wrong-pin': 'Wrong PIN, or the backup is damaged. Nothing was changed.',
};

/**
 * Decode and fully check a backup token before it may replace anything: the holder's shape, then
 * the payload is decrypted (with the default key, or with `pin` for a PIN-protected backup) and the
 * decrypted JSON is validated. A cut or mangled token fails to decrypt / parse here, so it can never
 * overwrite the stored portfolio. A PIN-protected backup without `pin` returns 'pin-required'.
 */
export function parseBackupToken(token: string, pin?: string): BackupResult {
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

  const pinProtected = holder.data.pinCodeEncrypted;
  if (pinProtected && !pin) return { ok: false, error: 'pin-required' };
  const failed: BackupError = pinProtected ? 'wrong-pin' : 'damaged';
  let payload: unknown;
  try {
    // throws on a wrong key or a damaged ciphertext (invalid UTF-8 / JSON after decryption)
    payload = cypherService.decrypt<unknown>(holder.data.encryptedData, pinProtected ? pin as string : DEFAULT_PIN_CODE);
  } catch {
    return { ok: false, error: failed };
  }
  if (!userDataSchema.safeParse(payload).success) return { ok: false, error: failed };
  return { ok: true, holder: new UserDataHolder(pinProtected, holder.data.encryptedData, false) };
}
