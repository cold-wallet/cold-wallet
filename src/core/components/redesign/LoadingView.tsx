// redesign/LoadingView.tsx — market-data sync screen (new look) driven by the REAL
// loader flags from Props (Binance / OKX / CoinGecko / Monobank). Shown until `loaded`.
import React from 'react';
import Props from '../Props';

interface Step {
  key: string;
  label: string;
  tint: string;
  mark: string;
  done: boolean;
  status: string;
}

function money(s: string | undefined): string {
  const n = s ? +s : NaN;
  return isFinite(n) ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '…';
}

export default function LoadingView({ props }: { props: Props }) {
  const steps: Step[] = [
    {
      key: 'binance', label: 'Binance', tint: '#e0a82e', mark: 'B',
      done: props.binancePricesLoaded && props.binanceCurrenciesLoaded,
      status: props.binancePricesLoaded && props.binancePrices
        ? `${props.binanceCurrencies ? Object.keys(props.binanceCurrencies).length : ''} markets · BTC ${money(props.binancePrices['BTCUSDT'])}`
        : 'Spot prices…',
    },
    {
      key: 'okx', label: 'OKX', tint: '#c9ccd1', mark: 'X',
      done: props.okxPricesLoaded && props.okxCurrenciesLoaded,
      status: props.okxPricesLoaded && props.okxPrices
        ? `${props.okxCurrencies ? Object.keys(props.okxCurrencies).length : ''} markets · BTC ${money(props.okxPrices['BTC-USDT'])}`
        : 'Spot prices…',
    },
    {
      key: 'coingecko', label: 'CoinGecko', tint: '#7c8cff', mark: 'C',
      done: props.coinGeckoPricesLoaded && props.coinGeckoCurrenciesLoaded,
      status: props.coinGeckoCurrencies ? `${Object.keys(props.coinGeckoCurrencies).length.toLocaleString()} assets indexed` : 'Token directory…',
    },
    {
      key: 'monobank', label: 'Monobank', tint: '#b6bcc6', mark: 'm',
      done: !!props.monobankRates && !!props.monobankCurrencies,
      status: props.monobankCurrencies ? `${Object.keys(props.monobankCurrencies).length} currencies · FX rates` : 'FX rates…',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="loading">
      <div className="loading__card">
        <div className="loading__head">
          <div className="loading__mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
          <div className="loading__txt">
            <div className="loading__title">Syncing market data</div>
            <div className="loading__sub">Fetching live prices &amp; exchange rates</div>
          </div>
          <div className="loading__pct num">{pct}%</div>
        </div>
        <div className="loading__steps">
          {steps.map((s) => (
            <div className={"lstep" + (s.done ? " lstep--done" : " lstep--active")} key={s.key}>
              <span className="lstep__chip" style={{ background: s.tint }}>{s.mark}</span>
              <div className="lstep__main">
                <div className="lstep__row">
                  <span className="lstep__label">{s.label}</span>
                  <span className="lstep__status num">{s.status}</span>
                </div>
                <div className="lstep__track"><i style={{ width: s.done ? '100%' : '45%' }} /></div>
              </div>
              <span className="lstep__icon">
                {s.done
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l5 5L20 6" /></svg>
                  : <span className="lspin on" />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
