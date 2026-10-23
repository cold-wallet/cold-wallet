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
