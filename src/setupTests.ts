// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Heavy application modules are mocked so that unit tests don't pull
// in their complex dependencies during import.
vi.mock('./core/components/ColdWallet', () => ({ default: () => 'ColdWallet' }));

// React 19 deprecates `act` from `react-dom/test-utils` in favor of the
// implementation exported directly from `react`. Older versions of
// @testing-library/react still import the deprecated helper, which triggers a
// warning. We shim the module so that any consumers (like the test utilities)
// receive the new `act` implementation instead.
vi.mock('react-dom/test-utils', async () => {
  const actual = await vi.importActual<any>('react-dom/test-utils');
  const { act } = await vi.importActual<any>('react');
  return { ...actual, act };
});

// Real Argon2id parameters cost ~64 MB and a few hundred ms per key; tests use cheap ones. Data
// sealed this way records its own parameters, so opening it uses the same cheap ones.
import { setKdfParamsForTests } from './core/services/PinVault';
setKdfParamsForTests({ alg: 'argon2id', m: 64, t: 1, p: 1 });

// The lock screen's doors open and close at once in tests (useVault.test covers the animation).
import { setVaultTimingsForTests } from './core/components/vault/useVault';
setVaultTimingsForTests({ checkMin: 0, turn: 0, open: 0, close: 0, latch: 0 });
