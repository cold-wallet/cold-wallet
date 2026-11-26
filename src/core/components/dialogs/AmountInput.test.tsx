import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AmountInput from './AmountInput';

function Harness({ initial = '', scale = 2, onValue }: { initial?: string; scale?: number; onValue?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return <AmountInput value={value} scale={scale} currency="EUR" onChange={(v) => { setValue(v); onValue?.(v); }} />;
}
const input = () => screen.getByRole('textbox') as HTMLInputElement;

describe('AmountInput', () => {
  it('keeps the value and explains when a second dot is typed', () => {
    const onValue = vi.fn();
    render(<Harness initial="12.34" onValue={onValue} />);
    fireEvent.change(input(), { target: { value: '1.2.34' } });
    expect(onValue).not.toHaveBeenCalled();
    expect(input().value).toBe('12.34');
    expect(screen.getByRole('status').textContent).toMatch(/only one decimal point/);
  });

  it('keeps the value when more decimals than the currency allows are typed', () => {
    render(<Harness initial="1.23" />);
    fireEvent.change(input(), { target: { value: '1.923' } });
    expect(input().value).toBe('1.23');
    expect(screen.getByRole('status').textContent).toMatch(/up to 2 decimals/);
  });

  it('drops a comma and tells the user to use a dot', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    fireEvent.change(input(), { target: { value: '1,5' } });
    expect(onValue).toHaveBeenCalledWith('15');
    expect(screen.getByRole('status').textContent).toMatch(/use a dot/);
  });

  it('clears the notice on the next clean edit and shows a grouped read-back for large numbers', () => {
    render(<Harness initial="1.23" />);
    fireEvent.change(input(), { target: { value: '1.2.3' } });
    expect(screen.queryByRole('status')).not.toBeNull();
    fireEvent.change(input(), { target: { value: '1234567.5' } });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(/1,234,567\.5/)).toBeTruthy();
  });
});
