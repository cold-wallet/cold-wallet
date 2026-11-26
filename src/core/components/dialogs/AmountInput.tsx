// components/dialogs/AmountInput.tsx — amount field that accepts a decimal comma ("1,5") as well as a
// point, from keys, paste and phone keyboards alike. The value is kept as a plain numeric string with
// "." (see sanitizeAmountInput); large numbers get a grouped read-back under the field, because the
// field itself stays ungrouped so the caret never jumps while typing.
import React from 'react';
import { NumericFormat } from 'react-number-format';
import { sanitizeAmountInput } from '../../utils/amount';

interface AmountInputProps {
  value: string;
  scale: number;
  currency: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  autoFocus?: boolean;
}

export default function AmountInput({ value, scale, currency, onChange, placeholder, className, invalid, autoFocus }: AmountInputProps) {
  const intDigits = (value.split('.')[0] || '').length;
  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        className={className}
        aria-invalid={invalid}
        autoFocus={autoFocus}
        onChange={(e) => {
          const next = sanitizeAmountInput(e.target.value, scale);
          if (next !== null) onChange(next); // null = would exceed the digit cap: keep the old value
        }}
      />
      {intDigits > 4 && (
        <small className="hint amount-readback">
          = <NumericFormat displayType="text" thousandSeparator valueIsNumericString value={value} /> {currency}
        </small>
      )}
    </>
  );
}
