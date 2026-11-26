// components/dashboard/AmountText.tsx — renders a native holding amount (value + nbsp + ticker), honouring
// the privacy mask and the "<0.01 TICKER" sub-value floor. Shared by the sidebar row, the
// chart-expand list and the delete dialog so all three stay consistent.
import React from 'react';
import { NumericFormat } from 'react-number-format';
import { AMOUNT_MASK, type AmountParts } from '../../ui/format';

const NBSP = ' ';
/** Integer parts longer than this (meme / spam tokens) are shown in scientific notation. */
const MAX_PLAIN_INTEGER_DIGITS = 15;

// The ticker gets its own span so long tickers (CoinGecko has 38-char ones) can end in "…"
// without eating the amount itself; the full ticker is in its tooltip.
const Code = ({ code }: { code: string }) => <span className="amt-code" title={code}>{code}</span>;

export default function AmountText({ amt, code, hidden }: { amt: AmountParts; code: string; hidden: boolean }) {
  if (hidden) return <>{AMOUNT_MASK}{NBSP}<Code code={code} /></>;
  if (amt.floor) return <>{amt.value}{NBSP}<Code code={code} /></>;
  const intDigits = amt.value.split('.')[0].replace(/^-/, '').length;
  if (intDigits > MAX_PLAIN_INTEGER_DIGITS) {
    // e.g. 1234567890123456789012345 → "1.23e24": a cut-off "1,234,567,890,12…" would misread
    // the magnitude; the exact value stays in the tooltip.
    const sci = Number(amt.value).toExponential(2).replace('e+', 'e');
    return <><span title={amt.value}>{sci}</span>{NBSP}<Code code={code} /></>;
  }
  return (
    <>
      <NumericFormat displayType="text" thousandSeparator valueIsNumericString decimalScale={amt.decimalScale} value={amt.value} />
      {NBSP}<Code code={code} />
    </>
  );
}
