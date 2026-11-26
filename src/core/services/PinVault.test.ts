import { newPinKey, open, seal, isSealed, WrongPinError } from './PinVault';

const toB64 = (s: string) => btoa(s);
const envelopeOf = (sealed: string) => JSON.parse(atob(sealed.slice(4)));
const resealed = (sealed: string, change: (e: Record<string, unknown> & { ct: string }) => void) => {
  const e = envelopeOf(sealed);
  change(e);
  return 'cw2.' + toB64(JSON.stringify(e));
};

describe('PinVault', () => {
  it('round-trips data with the right PIN and returns a key for later saves', async () => {
    const key = await newPinKey('2580');
    const sealed = await seal({ a: 1, s: 'ü' }, key);
    expect(isSealed(sealed)).toBe(true);
    const { data, pinKey } = await open<{ a: number; s: string }>(sealed, '2580');
    expect(data).toEqual({ a: 1, s: 'ü' });
    // the returned key saves data that opens with the same PIN
    expect((await open(await seal({ b: 2 }, pinKey), '2580')).data).toEqual({ b: 2 });
  });

  it('never reuses an IV, and gives each new key its own salt', async () => {
    const key = await newPinKey('2580');
    const a = envelopeOf(await seal({}, key));
    const b = envelopeOf(await seal({}, key));
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).toBe(b.salt);
    expect((await newPinKey('2580')).salt).not.toBe(key.salt);
  });

  it('keeps the derived key unreadable', async () => {
    const { key } = await newPinKey('2580');
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });

  it('refuses a wrong PIN and tampered data', async () => {
    const sealed = await seal({ a: 1 }, await newPinKey('2580'));
    await expect(open(sealed, '2581')).rejects.toBeInstanceOf(WrongPinError);
    const flipped = resealed(sealed, (e) => { e.ct = (e.ct[0] === 'A' ? 'B' : 'A') + e.ct.slice(1); });
    await expect(open(flipped, '2580')).rejects.toBeInstanceOf(WrongPinError);
    await expect(open('cw2.@@@', '2580')).rejects.toBeInstanceOf(WrongPinError);
  });

  it('refuses key parameters outside sane bounds (a crafted token)', async () => {
    const sealed = await seal({ a: 1 }, await newPinKey('2580'));
    for (const kdf of [{ alg: 'argon2id', m: 4 * 1024 * 1024, t: 1, p: 1 }, { alg: 'argon2id', m: 64, t: 1000, p: 1 }, { alg: 'pbkdf2', m: 64, t: 1, p: 1 }]) {
      await expect(open(resealed(sealed, (e) => { e.kdf = kdf; }), '2580')).rejects.toBeInstanceOf(WrongPinError);
    }
  });
});
