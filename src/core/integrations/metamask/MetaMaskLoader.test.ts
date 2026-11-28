import { balanceRequestFor, BalanceRequest, withoutUncheckable } from './MetaMaskLoader';
import { AddressBalanceResult, MetaMaskAccount } from './MetaMaskWallet';
import CoinGeckoCurrencyResponse from '../coingecko/CoinGeckoCurrencyResponse';

vi.mock('../../../wagmiConfig', () => ({ wagmiConfig: {} }));

const WALLET = '0x000000000000000000000000000000000000beef' as const;
const POL_CONTRACT = '0x0000000000000000000000000000000000001010' as const;
const OLD_WETH = '0x00000000000000000000000000000000000000aa' as const;
const balance = (symbol: string, chainId: number, amount: string, token?: `0x${string}`): AddressBalanceResult =>
  ({ chainId, address: WALLET, decimals: 18, formatted: amount, symbol, value: amount, token });
const account = (...balances: AddressBalanceResult[]): MetaMaskAccount => {
  const acc: MetaMaskAccount = {};
  balances.forEach((b) => { ((acc[b.address] ||= {})[b.symbol] ||= {})[b.chainId] = b; });
  return acc;
};
const symbols = (acc: MetaMaskAccount | null) =>
  acc ? Object.values(acc).flatMap((bySymbol) => Object.entries(bySymbol).flatMap(([s, byChain]) => Object.keys(byChain).map((c) => `${s}@${c}`))).sort() : null;

// today's coin list: POL owns the Polygon contract MATIC used to have; WETH lists Ethereum only
const coinList = {
  POL: { id: 'polygon-ecosystem-token', symbol: 'pol', name: 'POL', platforms: { 'polygon-pos': POL_CONTRACT } },
  MATIC: { id: 'matic-network', symbol: 'matic', name: 'Polygon', platforms: {} },
  WETH: { id: 'weth', symbol: 'weth', name: 'WETH', platforms: { ethereum: '0x00000000000000000000000000000000000000bb' } },
} as unknown as { [symbol: string]: CoinGeckoCurrencyResponse };
const searched: BalanceRequest[] = [
  { address: WALLET, chainId: 1, symbol: 'ETH' },
  { address: WALLET, chainId: 137, symbol: 'POL', token: POL_CONTRACT },
  { address: WALLET, chainId: 1, symbol: 'WETH', token: '0x00000000000000000000000000000000000000bb' },
];

describe('re-checking a stored MetaMask balance', () => {
  it('uses the contract saved with it, even when the coin list no longer names it there', () => {
    expect(balanceRequestFor(balance('WETH', 137, '0.01', OLD_WETH), coinList))
      .toEqual({ address: WALLET, chainId: 137, symbol: 'WETH', token: OLD_WETH });
  });

  it('falls back to the coin list for balances saved without a contract, and gives up when it has none', () => {
    expect(balanceRequestFor(balance('POL', 137, '95.78'), coinList)?.token).toBe(POL_CONTRACT);
    expect(balanceRequestFor(balance('MATIC', 137, '95.8'), coinList)).toBeNull();
    expect(balanceRequestFor(balance('ETH', 1, '1.5'), coinList)).toEqual({ address: WALLET, chainId: 1, symbol: 'ETH' });
  });
});

describe('cleaning up after a complete token search', () => {
  it('drops a balance found under an older coin list that nothing can check any more (the MATIC double)', () => {
    const data = account(balance('ETH', 1, '1.5'), balance('POL', 137, '95.78'), balance('MATIC', 137, '95.8'), balance('WETH', 137, '0.01'));
    expect(symbols(withoutUncheckable(data, searched, coinList))).toEqual(['ETH@1', 'POL@137']);
  });

  it('keeps a balance whose contract was saved, though the search no longer covers it', () => {
    const data = account(balance('ETH', 1, '1.5'), balance('WETH', 137, '0.01', OLD_WETH));
    expect(withoutUncheckable(data, searched, coinList)).toBeNull();
  });

  it('changes nothing when every balance is covered', () => {
    expect(withoutUncheckable(account(balance('ETH', 1, '1.5'), balance('POL', 137, '95.78')), searched, coinList)).toBeNull();
  });
});
