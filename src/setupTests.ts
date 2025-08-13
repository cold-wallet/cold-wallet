// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock third-party modules that rely on browser or Node features
// not available in the test environment. These mocks keep the
// tests lightweight and focused on our own code.
jest.mock('react-gtm-module', () => ({
  __esModule: true,
  default: { initialize: jest.fn() },
}));

// The wagmi provider requires ESM and a number of browser APIs which
// Jest doesn't provide. We replace it with a minimal stub that simply
// renders its children.
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => children,
}));

// Heavy application modules are mocked so that unit tests don't pull
// in their complex dependencies during import.
jest.mock('./core/components/ColdWallet', () => () => 'ColdWallet');
jest.mock('./wagmiConfig', () => ({ wagmiConfig: {} }));

// React 19 deprecates `act` from `react-dom/test-utils` in favor of the
// implementation exported directly from `react`. Older versions of
// @testing-library/react still import the deprecated helper, which triggers a
// warning. We shim the module so that any consumers (like the test utilities)
// receive the new `act` implementation instead.
jest.mock('react-dom/test-utils', () => {
  const actual = jest.requireActual('react-dom/test-utils');
  const { act } = jest.requireActual('react');
  return { ...actual, act };
});
