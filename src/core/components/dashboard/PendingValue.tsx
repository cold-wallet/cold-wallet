// PendingValue — stands in for a value that is still loading (a price on its way): three dots
// that pulse in turn. "—" stays for a value that isn't coming (no source prices the coin).
import React from 'react';

export default function PendingValue({ label = 'Price loading', className = '' }: { label?: string; className?: string }) {
  return (
    <span className={'pending ' + className} role="img" aria-label={label} title={label}>
      <i /><i /><i />
    </span>
  );
}
