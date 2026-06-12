// redesign/AmountText.tsx — renders a native holding amount (value + nbsp + ticker), honouring
// the privacy mask and the "<0.01 TICKER" sub-value floor. Shared by the sidebar row, the
// chart-expand list and the delete dialog so all three stay consistent.
import React from 'react';
import { NumericFormat } from 'react-number-format';
import { AMOUNT_MASK, type AmountParts } from './format';

const NBSP = ' ';

export default function AmountText({ amt, code, hidden }: { amt: AmountParts; code: string; hidden: boolean }) {
  if (hidden) return <>{AMOUNT_MASK}{NBSP}{code}</>;
  if (amt.floor) return <>{amt.value}{NBSP}{code}</>;
  return (
    <>
      <NumericFormat displayType="text" thousandSeparator valueIsNumericString decimalScale={amt.decimalScale} value={amt.value} />
      {NBSP}{code}
    </>
  );
}
