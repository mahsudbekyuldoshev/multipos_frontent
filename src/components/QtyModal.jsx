import { useState } from 'react';
import { fmtMoney, fmtQty, formatDate, parseNumber } from '../utils/format';
import { lineTotal } from '../utils/stock';
import { getUnit } from '../data/catalog';
import Modal from './Modal';

/** Mahsulotni savatga qo'shishdan oldin miqdor so'raydi (kasr sonlar bilan). */
export default function QtyModal({ product, onSubmit, onClose }) {
  const [value, setValue] = useState('1');
  const [error, setError] = useState('');

  const qty = parseNumber(value);
  const preview = Number.isFinite(qty) && qty > 0 ? lineTotal(product.price, qty) : 0;
  const fractional = getUnit(product.unit).fractional;

  const submit = () => {
    const err = onSubmit(qty);
    if (err) setError(err);
  };

  return (
    <Modal title={product.name} onClose={onClose} maxWidth="max-w-sm">
      <dl className="mb-4 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Narxi</dt>
          <dd className="font-num">
            {fmtMoney(product.price)} so'm / {product.unit}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Omborda</dt>
          <dd className="font-num">
            {fmtQty(product.stock)} {product.unit}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Oxirgi kelgan</dt>
          <dd className="font-num">{formatDate(product.receivedAt)}</dd>
        </div>
      </dl>

      <label htmlFor="qty-input" className="text-xs text-mute">
        Sotiladigan miqdor ({product.unit})
        {!fractional && <span> — faqat butun son</span>}
      </label>
      <input
        id="qty-input"
        autoFocus
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError('');
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        className="field mt-1 font-num"
      />

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-sm text-mute">Summa</span>
        <span className="font-num text-lg font-semibold">{fmtMoney(preview)} so'm</span>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost">
          Bekor qilish
        </button>
        <button type="button" onClick={submit} className="btn btn-safety">
          Savatga qo'shish
        </button>
      </div>
    </Modal>
  );
}
