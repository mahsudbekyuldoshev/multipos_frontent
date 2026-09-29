import { useEffect, useState } from 'react';
import { fmtQty, parseNumber } from '../utils/format';

/**
 * Savatdagi miqdor maydoni. "2,5" va "2.5" ikkalasi ham qabul qilinadi.
 * Enter yoki maydondan chiqishda `onCommit(son)` chaqiriladi;
 * u xato matnini (yoki null) qaytaradi — xato bo'lsa eski qiymat tiklanadi.
 */
export default function QtyInput({ value, onCommit, label }) {
  const [draft, setDraft] = useState(fmtQty(value));

  useEffect(() => {
    setDraft(fmtQty(value));
  }, [value]);

  const commit = () => {
    const n = parseNumber(draft);
    if (!Number.isFinite(n) || n === value) {
      setDraft(fmtQty(value));
      return;
    }
    if (onCommit(n)) setDraft(fmtQty(value));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setDraft(fmtQty(value));
      }}
      className="field w-20 px-2 py-1 text-right font-num"
    />
  );
}
