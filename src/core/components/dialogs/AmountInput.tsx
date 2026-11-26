// components/dialogs/AmountInput.tsx — amount field with "." as the only decimal separator. Every
// change (key, paste, phone keyboard) goes through sanitizeAmountInput: a change that would make an
// invalid number is rejected and the field keeps its value, with a short notice saying why; the caret
// stays where the user was typing instead of jumping to the end. Large numbers get a grouped
// read-back under the field (the field itself stays ungrouped so editing never shifts digits).
import React, { useLayoutEffect, useRef, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { amountInputNoticeText, sanitizeAmountInput, type AmountInputNotice } from '../../utils/amount';

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
  const [notice, setNotice] = useState<AmountInputNotice | null>(null);
  // Bumped on every change so a rejected edit (value unchanged) still re-renders and the layout
  // effect below can put the caret back after React restores the controlled value.
  const [, setRenderTick] = useState(0);
  const pendingCaret = useRef<number | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const intDigits = (value.split('.')[0] || '').length;

  useLayoutEffect(() => {
    const input = ref.current;
    if (pendingCaret.current !== null && input && document.activeElement === input) {
      input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const raw = el.value;
    const caret = el.selectionStart ?? raw.length;
    const { value: next, notice: n } = sanitizeAmountInput(raw, scale);
    // Characters the edit added (rejected) or that sanitising removed sit before the caret in
    // practice (typing / pasting happens at the caret), so shift it back by that many.
    const kept = next ?? value;
    pendingCaret.current = Math.max(0, Math.min(kept.length, caret - (raw.length - kept.length)));
    setNotice(n);
    setRenderTick((t) => t + 1);
    if (next !== null) onChange(next);
  }

  return (
    <>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        className={className}
        aria-invalid={invalid}
        aria-describedby={notice ? 'amount-notice' : undefined}
        autoFocus={autoFocus}
        onChange={handleChange}
        onBlur={() => setNotice(null)}
      />
      {notice && (
        <small id="amount-notice" className="hint hint--notice" role="status">
          {amountInputNoticeText(notice, currency, scale)}
        </small>
      )}
      {intDigits > 4 && (
        <small className="hint amount-readback">
          = <NumericFormat displayType="text" thousandSeparator valueIsNumericString value={value} /> {currency}
        </small>
      )}
    </>
  );
}
