import { useState } from 'react';
import { getActiveCategories, UNITS, getUnit } from '../data/catalog';
import { parseNumber, round2, todayKey } from '../utils/format';
import Modal from './Modal';

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-xs text-mute">
    {children}
  </label>
);

/** Yangi mahsulot qo'shish yoki mavjudini tahrirlash (product === null — yangi). */
export default function ProductModal({ product, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => {
    const categories = getActiveCategories();
    return {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.category ?? categories[0]?.key ?? 'qurilish',
      unit: product?.unit ?? 'dona',
      price: product ? String(product.price) : '',
      stock: product ? String(product.stock) : '',
      minStock: product ? String(product.minStock) : '20',
      receivedAt: product?.receivedAt ?? todayKey(),
    };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();

    const price = parseNumber(form.price);
    const stock = parseNumber(form.stock);
    const minStock = parseNumber(form.minStock);

    if (!form.name.trim()) return setError('Mahsulot nomini kiriting.');
    if (!form.sku.trim()) return setError('Artikulni kiriting.');
    if (![price, stock, minStock].every((n) => Number.isFinite(n) && n >= 0)) {
      return setError("Narx va miqdorlar 0 dan kichik bo'lmagan son bo'lishi kerak.");
    }
    if (!getUnit(form.unit).fractional && (!Number.isInteger(stock) || !Number.isInteger(minStock))) {
      return setError(`«${form.unit}» butun sonda hisoblanadi — kasr son kiritmang.`);
    }
    if (!form.receivedAt) return setError('Kelgan sanani kiriting.');

    setSaving(true);
    try {
      await onSave({
        ...(product ? { id: product.id } : {}),
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        unit: form.unit,
        price,
        stock: round2(stock),
        minStock: round2(minStock),
        receivedAt: form.receivedAt,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Saqlab bo'lmadi.");
      setSaving(false);
    }
    return undefined;
  };

  const remove = async () => {
    if (!window.confirm(`«${product.name}» mahsulotini ombordan o'chirishni tasdiqlaysizmi?`)) return;
    setSaving(true);
    try {
      await onDelete(product.id);
      onClose();
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
      setSaving(false);
    }
  };

  return (
    <Modal title={product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <Label htmlFor="pm-name">Mahsulot nomi</Label>
            <input id="pm-name" autoFocus value={form.name} onChange={set('name')} className="field mt-1" />
          </div>
          <div>
            <Label htmlFor="pm-sku">Artikul</Label>
            <input id="pm-sku" value={form.sku} onChange={set('sku')} className="field mt-1 font-num" />
          </div>
        </div>

        <div>
          <Label htmlFor="pm-category">Kategoriya</Label>
          <select id="pm-category" value={form.category} onChange={set('category')} className="field mt-1">
            {getActiveCategories().map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pm-unit">O'lchov birligi</Label>
            <select id="pm-unit" value={form.unit} onChange={set('unit')} className="field mt-1">
              {UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.key}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pm-price">Narxi (so'm)</Label>
            <input
              id="pm-price"
              inputMode="numeric"
              value={form.price}
              onChange={set('price')}
              placeholder="12000"
              className="field mt-1 font-num"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="pm-stock">Qoldiq</Label>
            <input
              id="pm-stock"
              inputMode="decimal"
              value={form.stock}
              onChange={set('stock')}
              placeholder="100"
              className="field mt-1 font-num"
            />
          </div>
          <div>
            <Label htmlFor="pm-min">Min. qoldiq</Label>
            <input
              id="pm-min"
              inputMode="decimal"
              value={form.minStock}
              onChange={set('minStock')}
              placeholder="20"
              className="field mt-1 font-num"
            />
          </div>
          <div>
            <Label htmlFor="pm-date">Kelgan sana</Label>
            <input
              type="date"
              id="pm-date"
              value={form.receivedAt}
              onChange={set('receivedAt')}
              className="field mt-1 font-num text-xs"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-rust/40 bg-rust/10 p-2 text-xs text-rust">
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-2">
          {product ? (
            <button
              type="button"
              disabled={saving}
              onClick={remove}
              className="btn bg-rust/15 text-rust hover:bg-rust/25 text-xs"
            >
              O'chirish
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving} className="btn btn-steel text-xs font-semibold">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
