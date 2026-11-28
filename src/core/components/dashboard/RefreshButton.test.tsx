import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import RefreshButton from './RefreshButton';
import type { ButtonView } from '../../refresh/describe';

const view = (v: Partial<ButtonView>) => () => ({ spinning: false, tone: 'idle', blockedUntil: 0, title: 'Refresh', ...v } as ButtonView);

describe('RefreshButton', () => {
  it('spins and reports busy while its part loads; a click still works (it joins the request)', () => {
    const onClick = vi.fn();
    render(<RefreshButton className="act refresh" label="Refresh BTC" view={view({ spinning: true })} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Refresh BTC' });
    expect(button.className).toContain('spinning');
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows a part being retried in amber, one that will not load in red', () => {
    const { rerender } = render(<RefreshButton className="act refresh" label="r" view={view({ spinning: true, tone: 'warn' })} onClick={() => undefined} />);
    expect(screen.getByRole('button').className).toContain('is-warn');
    rerender(<RefreshButton className="act refresh" label="r" view={view({ tone: 'error' })} onClick={() => undefined} />);
    expect(screen.getByRole('button').className).toContain('is-error');
  });

  it('is disabled while a rate limit holds, and comes back by itself when it is over', () => {
    vi.useFakeTimers();
    try {
      const until = Date.now() + 2_000;
      const onClick = vi.fn();
      render(<RefreshButton className="act refresh" label="Refresh Monobank" onClick={onClick}
                            view={(now) => ({ spinning: false, tone: 'idle', blockedUntil: until, title: `available in ${Math.ceil((until - now) / 1000)} s` })} />);
      const button = screen.getByRole('button', { name: 'Refresh Monobank' }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.title).toBe('available in 2 s');
      expect(button.textContent).toBe('2');              // the seconds show in place of the icon
      act(() => { vi.advanceTimersByTime(1_000); });
      expect(button.title).toBe('available in 1 s');
      expect(button.textContent).toBe('1');
      act(() => { vi.advanceTimersByTime(1_000); });
      expect(button.disabled).toBe(false);
      expect(button.querySelector('svg')).not.toBeNull();
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
