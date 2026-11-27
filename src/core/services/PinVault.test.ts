import {
  isNewerFormat, KeyDerivationTimeoutError, newPinKey, open, openWithKey, seal, isSealed, setWorkerFactoryForTests,
  WORKER_TIMEOUT_MS, WrongPinError,
} from './PinVault';

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

  it('opens data with a key already in memory, but not data sealed with another key', async () => {
    const key = await newPinKey('2580');
    expect(await openWithKey(await seal({ a: 1 }, key), key)).toEqual({ a: 1 });
    const other = await seal({ a: 1 }, await newPinKey('2580'));
    await expect(openWithKey(other, key)).rejects.toBeInstanceOf(WrongPinError);
  });

  it('recognises data saved by a newer version', () => {
    expect(isNewerFormat('cw3.abc')).toBe(true);
    expect(isNewerFormat('cw12.abc')).toBe(true);
    expect(isNewerFormat('cw2.abc')).toBe(false);
    expect(isNewerFormat('U2FsdGVkX1+abc')).toBe(false);
  });
});

describe('PinVault worker', () => {
  afterEach(() => {
    setWorkerFactoryForTests(undefined);
    vi.useRealTimers();
  });

  function fakeWorker(onPost: (w: Worker) => void = () => {}) {
    const w = { onmessage: null, onerror: null, terminate: vi.fn(), postMessage: vi.fn() } as unknown as Worker & { terminate: ReturnType<typeof vi.fn> };
    (w.postMessage as ReturnType<typeof vi.fn>).mockImplementation(() => onPost(w));
    return w;
  }

  it('gives up on a worker that stops answering, so the attempt can be retried', async () => {
    vi.useFakeTimers();
    const w = fakeWorker();
    setWorkerFactoryForTests(() => w);
    const attempt = newPinKey('2580');
    const failed = expect(attempt).rejects.toBeInstanceOf(KeyDerivationTimeoutError);
    await vi.advanceTimersByTimeAsync(WORKER_TIMEOUT_MS);
    await failed;
    expect(w.terminate).toHaveBeenCalled();
  });

  it('falls back to the page when the worker cannot run', async () => {
    const w = fakeWorker((self) => queueMicrotask(() => self.onerror?.(new Event('error') as ErrorEvent)));
    setWorkerFactoryForTests(() => w);
    const key = await newPinKey('2580');
    expect((await open(await seal({ a: 1 }, key), '2580')).data).toEqual({ a: 1 });
  });
});
