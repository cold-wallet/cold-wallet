import React from 'react';
import { render, screen } from '@testing-library/react';
import HoldingRow from './HoldingRow';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import type { Valued } from '../../ui/portfolio';

function row(priced: boolean, pending: boolean) {
  const asset = new AssetDTO('a1', 'EUR', '10', 'Savings', 2, AssetType.fiat);
  const h = {
    asset, id: 'a1', code: 'EUR', kind: 'fiat', usd: priced ? 11.5 : 0, priced, pending,
    source: { key: 'manual', label: 'Manual', mark: 'M', tint: '#999', icon: null },
    manual: true, color: '#999', sym: '€', scale: 2, unitUsd: 0,
  } as unknown as Valued;
  render(<HoldingRow h={h} hidden={false} active={false} onSelect={() => {}} onEdit={() => {}} onDelete={() => {}} />);
}

describe('HoldingRow USD line', () => {
  it('shows the USD value when the price is known', () => {
    row(true, false);
    expect(screen.getByText('$11.50')).toBeTruthy();
  });
  it('shows a loading indicator instead of $0.00 while a price may still arrive', () => {
    row(false, true);
    expect(screen.getByRole('img', { name: 'Price loading' })).toBeTruthy();
    expect(screen.queryByText('$0.00')).toBeNull();
  });
  it('says there is no price when none is coming', () => {
    row(false, false);
    expect(screen.getByText('no price')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Price loading' })).toBeNull();
  });
});
