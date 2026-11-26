import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import EditDialog from './EditDialog';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import UserData, { UserSettings } from '../../domain/UserData';
import type Props from '../Props';

// Minimal Props for the dialog; only the fields it reads or calls.
function makeProps(over: Partial<Props>): Props {
  return {
    assetToEdit: null,
    newAssetCurrency: null,
    newAssetName: null,
    newAssetAmount: null,
    isNewAssetAmountInvalid: false,
    isNewAssetNameInvalid: false,
    binanceCurrencies: null,
    currencyOptions: [],
    userData: new UserData('u1', new UserSettings(), []),
    setUserData: vi.fn(),
    stateReset: vi.fn(),
    setNewAssetCurrency: vi.fn(),
    setNewAssetName: vi.fn(),
    setNewAssetAmount: vi.fn(),
    setIsNewAssetAmountInvalid: vi.fn(),
    setIsNewAssetNameInvalid: vi.fn(),
    setShowCreateNewAssetWindow: vi.fn(),
    setShowConfigsWindow: vi.fn(),
    prefetchPrice: vi.fn(),
    ...over,
  } as unknown as Props;
}

describe('EditDialog', () => {
  it('renaming a holding keeps an amount that has more decimals than the currency precision', () => {
    // e.g. entered before the input mask existed: 12 decimals, Binance precision for BTC is 8
    const btc = new AssetDTO('a1', 'BTC', '0.123456789012', 'Cold storage', 8, AssetType.crypto);
    const setUserData = vi.fn();
    render(<EditDialog props={makeProps({
      assetToEdit: btc,
      newAssetAmount: '0.123456789012',
      newAssetName: 'Renamed only',
      binanceCurrencies: { BTC: { precision: 8 } } as unknown as Props['binanceCurrencies'],
      userData: new UserData('u1', new UserSettings(), [btc]),
      setUserData,
    })} />);
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('0.123456789012');
    fireEvent.click(screen.getByText('Save'));
    const saved = setUserData.mock.calls[0][0].assets[0];
    expect(saved.amount).toBe('0.123456789012');
    expect(saved.name).toBe('Renamed only');
  });

  it('saving a new amount for a legacy holding stores the currency precision, not the old one', () => {
    const btc = new AssetDTO('a1', 'BTC', '0.123456789012', 'Cold storage', 12, AssetType.crypto);
    const setUserData = vi.fn();
    render(<EditDialog props={makeProps({
      assetToEdit: btc,
      newAssetAmount: '5',
      newAssetName: 'Cold storage',
      binanceCurrencies: { BTC: { precision: 8 } } as unknown as Props['binanceCurrencies'],
      userData: new UserData('u1', new UserSettings(), [btc]),
      setUserData,
    })} />);
    fireEvent.click(screen.getByText('Save'));
    const saved = setUserData.mock.calls[0][0].assets[0];
    expect(saved.amount).toBe('5');
    expect(saved.decimalScale).toBe(8);
  });

  it('a new holding is still rounded to the currency precision', () => {
    const setUserData = vi.fn();
    render(<EditDialog props={makeProps({ newAssetCurrency: 'EUR', newAssetAmount: '10.555', newAssetName: 'Cash', setUserData })} />);
    fireEvent.click(screen.getByText('Add asset'));
    expect(setUserData.mock.calls[0][0].assets[0].amount).toBe('10.56');
  });

  it('shows a character counter near the 40-character name limit, counting emoji as one', () => {
    render(<EditDialog props={makeProps({ newAssetCurrency: 'EUR', newAssetAmount: '1', newAssetName: '🙂'.repeat(35) })} />);
    expect(screen.getByText(/35\/40/)).toBeTruthy();
  });
});
