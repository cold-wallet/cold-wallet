import React from 'react';
import { render, screen } from '@testing-library/react';
import HoldingRow from './HoldingRow';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import type { Valued } from '../../ui/portfolio';

function row(priced: boolean, syncing: boolean) {
  const asset = new AssetDTO('a1', 'EUR', '10', 'Savings', 2, AssetType.fiat);
  const h = {
    asset, id: 'a1', code: 'EUR', kind: 'fiat', usd: priced ? 11.5 : 0, priced,
    source: { key: 'manual', label: 'Manual', mark: 'M', tint: '#999', icon: null },
    manual: true, color: '#999', sym: '€', scale: 2, unitUsd: 0,
  } as unknown as Valued;
  render(<HoldingRow h={h} hidden={false} active={false} onSelect={() => {}} onEdit={() => {}} onDelete={() => {}} syncing={syncing} />);
}

describe('HoldingRow USD line', () => {
  it('shows the USD value when the price is known', () => {
    row(true, false);
    expect(screen.getByText('$11.50')).toBeTruthy();
  });
  it('says the price is loading instead of $0.00 while prices are fetched', () => {
    row(false, true);
    expect(screen.getByText('price loading…')).toBeTruthy();
    expect(screen.queryByText('$0.00')).toBeNull();
  });
  it('says there is no price once fetching is over', () => {
    row(false, false);
    expect(screen.getByText('no price')).toBeTruthy();
  });
});
