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
  currency: z.string().min(1).max(32),
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

export type BackupError = 'not-a-backup' | 'damaged' | 'demo';
export type BackupResult = { ok: true; holder: UserDataHolder } | { ok: false; error: BackupError };

export const BACKUP_ERROR_TEXT: Record<BackupError, string> = {
  'not-a-backup': "This isn't a Cold Wallet backup token. Copy it again from Export.",
  damaged: 'This backup is damaged or incomplete, so nothing was changed.',
  demo: 'This backup was made in demo mode and has no real portfolio to restore.',
};

/**
 * Decode and check a backup token. The holder's shape is always checked; when the backup has no
 * PIN its payload can be decrypted here too, so the holdings themselves are validated before
 * anything is replaced. (PIN-protected payloads are canonicalised after unlock — see UserDataService.sanitizeUserData.)
 */
export function parseBackupToken(token: string): BackupResult {
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

  if (!holder.data.pinCodeEncrypted) {
    let payload: unknown;
    try {
      payload = cypherService.decrypt<unknown>(holder.data.encryptedData, DEFAULT_PIN_CODE);
    } catch {
      return { ok: false, error: 'damaged' };
    }
    if (!userDataSchema.safeParse(payload).success) return { ok: false, error: 'damaged' };
  }
  return { ok: true, holder: new UserDataHolder(holder.data.pinCodeEncrypted, holder.data.encryptedData, false) };
}
