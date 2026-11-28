import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import RefreshButton from './RefreshButton';
import type { ButtonView } from '../../refresh/describe';
import type { RefreshStore } from '../../refresh/useRefreshTracker';

const NOTHING = {};
const store: RefreshStore = { current: () => NOTHING, subscribe: () => () => undefined };

const view = (v: Partial<ButtonView>) => () => ({ spinning: false, tone: 'idle', blockedUntil: 0, title: 'Refresh', ...v } as ButtonView);

describe('RefreshButton', () => {
  it('spins and reports busy while its part loads; a click still works (it joins the request)', () => {
    const onClick = vi.fn();
    render(<RefreshButton store={store} className="act refresh" label="Refresh BTC" view={view({ spinning: true })} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Refresh BTC' });
    expect(button.className).toContain('spinning');
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows a part being retried in amber, one that will not load in red', () => {
    const { rerender } = render(<RefreshButton store={store} className="act refresh" label="r" view={view({ spinning: true, tone: 'warn' })} onClick={() => undefined} />);
    expect(screen.getByRole('button').className).toContain('is-warn');
    rerender(<RefreshButton store={store} className="act refresh" label="r" view={view({ tone: 'error' })} onClick={() => undefined} />);
    expect(screen.getByRole('button').className).toContain('is-error');
  });

  it('while a rate limit holds: a click loads nothing but says how long is left; it comes back by itself', () => {
    vi.useFakeTimers();
    try {
      const until = Date.now() + 4_000;
      const onClick = vi.fn();
      render(<RefreshButton store={store} className="act refresh" label="Refresh Monobank" onClick={onClick}
                            view={(_status, now) => ({ spinning: false, tone: 'idle', blockedUntil: until, title: `available in ${Math.ceil((until - now) / 1000)} s` })} />);
      const button = screen.getByRole('button', { name: 'Refresh Monobank' }) as HTMLButtonElement;
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.title).toBe('available in 4 s');
      expect(button.className).toContain('is-waiting');
      expect(button.className).not.toContain('show-wait');   // the seconds show on hover only…

      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
      expect(button.className).toContain('show-wait');       // …or for a moment after a click
      expect(screen.getByRole('status').textContent).toBe('in 4s');
      act(() => { vi.advanceTimersByTime(1_000); });
      expect(screen.getByRole('status').textContent).toBe('in 3s');

      act(() => { vi.advanceTimersByTime(3_000); });
      expect(button.getAttribute('aria-disabled')).toBeNull();
      expect(button.className).not.toContain('is-waiting');
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
