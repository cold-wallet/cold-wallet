import UserData, { UserSettings } from '../domain/UserData';
import AssetDTO, { AssetType } from '../domain/AssetDTO';
import { initUserDataHolder, sanitizeUserData, sealUserDataHolder } from './UserDataService';
import { newPinKey } from './PinVault';
import UserDataHolder from '../domain/UserDataHolder';
import cypherService from './CypherService';
import { dataImporter } from '../components/settings/ImportData';
import { parseBackupToken } from './userDataValidation';

const asset = (amount: string) => new AssetDTO('id-1', 'EUR', amount, 'Savings', 2, AssetType.fiat);
const toToken = (obj: unknown) => Buffer.from(encodeURIComponent(JSON.stringify(obj)), 'ascii').toString('base64');

describe('parseBackupToken', () => {
  it('accepts a real export (no PIN), tolerating line breaks in the pasted token', async () => {
    const holder = initUserDataHolder(new UserData('u1', new UserSettings(), [asset('100')]));
    const token = dataImporter.generateExportData(holder);
    const pasted = token.replace(/(.{40})/g, '$1\n');
    const r = await parseBackupToken(pasted);
    expect(r.ok).toBe(true);
  });

  it('accepts an export holding a very long ticker (CoinGecko has 38-char ones)', async () => {
    const long = new AssetDTO('id-2', 'HIXOKDKEKJCJDKSICNDNAIAIHSBZNNXNXNDUJE', '5', 'HIXOK', 8, AssetType.crypto);
    const holder = initUserDataHolder(new UserData('u1', new UserSettings(), [long]));
    expect((await parseBackupToken(dataImporter.generateExportData(holder))).ok).toBe(true);
  });

  describe('PIN-protected backups are decrypted and checked before anything is replaced', () => {
    let holder: UserDataHolder;
    let token: string;
    beforeAll(async () => {
      holder = await sealUserDataHolder(new UserData('u1', new UserSettings(), [asset('100')]), await newPinKey('4321'));
      token = dataImporter.generateExportData(holder);
    });

    it('asks for the PIN first', async () => {
      expect(holder.pinCodeEncrypted).toBe(true);
      expect(await parseBackupToken(token)).toEqual({ ok: false, error: 'pin-required' });
    });
    it('accepts the right PIN and hands over the key, so it is not derived twice', async () => {
      const r = await parseBackupToken(token, '4321');
      expect(r.ok && r.wallet.data.id).toBe('u1');
      expect(r.ok && r.wallet.pinKey).toBeTruthy();
    });
    it('refuses a wrong PIN', async () => {
      expect(await parseBackupToken(token, '1111')).toEqual({ ok: false, error: 'wrong-pin' });
    });
    it('refuses a token whose ciphertext was cut, even with the right PIN, and replaces nothing', async () => {
      const cut = { ...holder, encryptedData: holder.encryptedData.slice(0, -40) };
      const importWallet = vi.fn();
      const r = await dataImporter.readImportedData(toToken(cut), importWallet, '4321');
      expect(r).toEqual({ ok: false, error: 'wrong-pin' });
      expect(importWallet).not.toHaveBeenCalled();
    });
    it('still opens a backup made by an older version with its PIN', async () => {
      const old = { pinCodeEncrypted: true, encryptedData: cypherService.encrypt(new UserData('old', new UserSettings(), [asset('5')]), '4321') };
      const r = await parseBackupToken(toToken(old), '4321');
      expect(r.ok && r.wallet.data.id).toBe('old');
      expect(r.ok && r.wallet.pinKey).toBeNull(); // re-saved in the current format on import
      expect(await parseBackupToken(toToken(old), '1111')).toEqual({ ok: false, error: 'wrong-pin' });
    });
    it('reports a browser failure (not a wrong PIN) when the key cannot be derived', async () => {
      const spy = vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new Error('out of memory'));
      expect(await parseBackupToken(token, '4321')).toEqual({ ok: false, error: 'browser' });
      spy.mockRestore();
    });
    it('refuses a PIN-protected payload that decrypts but is not a valid portfolio', async () => {
      const bogus = { pinCodeEncrypted: true, encryptedData: cypherService.encrypt({ hello: 'world' }, '4321') };
      expect(await parseBackupToken(toToken(bogus), '4321')).toEqual({ ok: false, error: 'wrong-pin' });
    });
  });

  it('rejects garbage, wrong JSON shapes and demo backups', async () => {
    expect(await parseBackupToken('not base64 at all !!!')).toEqual({ ok: false, error: 'not-a-backup' });
    expect(await parseBackupToken(toToken({ hello: 'world' }))).toEqual({ ok: false, error: 'not-a-backup' });
    expect(await parseBackupToken(toToken({ pinCodeEncrypted: 'yes', encryptedData: 'x'.repeat(40) })))
      .toEqual({ ok: false, error: 'not-a-backup' });
    const demo = initUserDataHolder(new UserData('u1', new UserSettings(), []), true);
    expect(await parseBackupToken(dataImporter.generateExportData(demo))).toEqual({ ok: false, error: 'demo' });
  });

  it('rejects an unprotected backup whose holdings are broken', async () => {
    const bad = { id: 'u1', settings: {}, assets: [{ id: 'a', currency: 'EUR', amount: '-5', name: 'x', decimalScale: 2, type: 1 }] };
    const holder = { pinCodeEncrypted: false, encryptedData: cypherService.encrypt(bad, '0123456789') };
    expect(await parseBackupToken(toToken(holder))).toEqual({ ok: false, error: 'damaged' });
    const undecryptable = { pinCodeEncrypted: false, encryptedData: 'U2FsdGVkX1' + 'A'.repeat(40) };
    expect(await parseBackupToken(toToken(undecryptable))).toEqual({ ok: false, error: 'damaged' });
  });

  it('does not replace stored data when the token is rejected', async () => {
    const importWallet = vi.fn();
    const r = await dataImporter.readImportedData(toToken({ nope: true }), importWallet);
    expect(r.ok).toBe(false);
    expect(importWallet).not.toHaveBeenCalled();
  });
});

describe('sanitizeUserData', () => {
  it('canonicalises legacy amounts and keeps everything else', () => {
    const data = new UserData('u1', new UserSettings(), [asset('1012.0000000000000000000')]);
    const out = sanitizeUserData(data);
    expect(out.assets[0].amount).toBe('1012');
    expect(out.assets[0].name).toBe('Savings');
  });

  it('never drops unparseable entries and returns the same object when nothing changes', () => {
    const odd = { ...asset('1'), amount: 'n/a' } as AssetDTO;
    const data = new UserData('u1', new UserSettings(), [odd]);
    expect(sanitizeUserData(data)).toBe(data);
    expect(sanitizeUserData(data).assets).toHaveLength(1);
  });

  it('turns a missing assets list into an empty one', () => {
    const data = { id: 'u1', settings: new UserSettings() } as unknown as UserData;
    expect(sanitizeUserData(data).assets).toEqual([]);
  });
});
