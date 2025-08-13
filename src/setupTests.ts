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
