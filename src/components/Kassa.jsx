import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtMoney, fmtQty, formatDate, money } from '../utils/format';
import { matchesQuery, searchProducts } from '../utils/search';
import { isLow, isOut } from '../utils/stock';
import { CategoryIcon, StockBadge } from './Badges';
import CategoryChips from './CategoryChips';
import QtyInput from './QtyInput';
import QtyModal from './QtyModal';

/**
 * Kassa: qidiruv + savat + ombor holati.
 * `cart` — useCart() natijasi (App'da turadi, shuning uchun tab almashsa ham savat saqlanadi).
 * `onCheckout` — sotuvni yakunlaydi; xato bo'lsa Error tashlaydi.
 */
export default function Kassa({ products, loading, cart, onCheckout }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tableQuery, setTableQuery] = useState('');
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const searchRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(
    () => searchProducts(products, query, { category, limit: 8 }),
    [products, query, category],
  );

  const tableRows = useMemo(
    () =>
      products
        .filter((p) => category === 'all' || p.category === category)
        .filter((p) => matchesQuery(p, tableQuery))
        .sort((a, b) => a.name.localeCompare(b.name, 'uz')),
    [products, category, tableQuery],
  );

  useEffect(() => {
    setActive(0);
  }, [query, category]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const pick = (product) => {
    if (isOut(product)) {
      setNotice(`«${product.name}» omborda tugagan.`);
      return;
    }
    setNotice('');
    setPicked(product);
  };

  const closePicker = () => {
    setPicked(null);
    searchRef.current?.focus();
  };

  const handleAdd = (qty) => {
    const err = cart.addItem(picked, qty);
    if (!err) {
      setPicked(null);
      setQuery('');
      searchRef.current?.focus();
    }
    return err;
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) pick(results[active]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const setLineQty = (product, quantity) => {
    const err = cart.setQuantity(product, quantity);
    setNotice(err || '');
    return err;
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearClick = () => {
    if (cart.lines.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const handleConfirmClear = () => {
    cart.clear();
    setShowClearConfirm(false);
  };

  const handleCheckout = async () => {
    setBusy(true);
    setNotice('');
    try {
      await onCheckout();
    } catch (err) {
      setNotice(err.message || "Sotuvni yakunlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  const hasQuery = query.trim() !== '';

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,480px)_1fr]">
      {/* ================= CHAP: qidiruv + savat ================= */}
      <section className="flex min-w-0 flex-col gap-4">
        <div className="panel p-4">
          <label htmlFor="search" className="font-head text-xs uppercase tracking-wide text-mute">
            Mahsulot qidirish
          </label>
          <input
            id="search"
            ref={searchRef}
            autoFocus
            autoComplete="off"
            type="text"
            role="combobox"
            aria-expanded={hasQuery}
            aria-controls="search-results"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Nomi yoki artikul: sement, kabel, VVG..."
            className="field mt-2"
          />

          <div className="mt-3">
            <CategoryChips value={category} onChange={setCategory} />
          </div>

          {hasQuery && (
            <div
              id="search-results"
              ref={listRef}
              role="listbox"
              className="mt-3 max-h-72 divide-y divide-line overflow-y-auto"
            >
              {results.length === 0 && (
                <p className="py-3 text-sm text-mute">
                  Hech narsa topilmadi. Boshqa so'z yoki artikulni sinab ko'ring.
                </p>
              )}
              {results.map((p, i) => {
                const out = isOut(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    onClick={() => pick(p)}
                    onMouseEnter={() => setActive(i)}
                    className={`row-hover flex w-full items-center gap-3 px-1 py-2.5 text-left ${
                      i === active ? 'bg-steel/15' : ''
                    } ${out ? 'opacity-50' : ''}`}
                  >
                    <CategoryIcon category={p.category} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <span className="font-num text-xs text-mute">{p.sku}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 font-num text-xs">
                        <span>
                          <span className="text-mute">Narx </span>
                          {fmtMoney(p.price)} so'm/{p.unit}
                        </span>
                        <span>
                          <span className="text-mute">Qoldiq </span>
                          <span className={isLow(p) ? 'text-rust' : 'text-moss'}>
                            {out ? 'tugagan' : `${fmtQty(p.stock)} ${p.unit}`}
                          </span>
                        </span>
                        <span>
                          <span className="text-mute">Kelgan </span>
                          {formatDate(p.receivedAt)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel flex min-h-[280px] flex-1 flex-col p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-base uppercase tracking-wide">Savat</h2>
            <button
              type="button"
              onClick={handleClearClick}
              disabled={cart.lines.length === 0}
              className="text-xs text-mute underline hover:text-ink disabled:no-underline disabled:opacity-40"
            >
              tozalash
            </button>
          </div>

          {cart.lines.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-sm text-mute">
              Savat bo'sh. Yuqorida mahsulot qidirib qo'shing.
            </div>
          ) : (
            <ul className="mt-2 max-h-[320px] flex-1 divide-y divide-line overflow-y-auto">
              {cart.lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{product.name}</div>
                    <div className="font-num text-xs text-mute">
                      {fmtMoney(product.price)} &times; {fmtQty(quantity)} {product.unit}
                    </div>
                  </div>
                  <QtyInput
                    value={quantity}
                    label={`${product.name} miqdori`}
                    onCommit={(n) => setLineQty(product, n)}
                  />
                  <div className="w-24 text-right font-num text-sm">{fmtMoney(lineTotal)}</div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(product.id)}
                    aria-label={`${product.name} ni savatdan olib tashlash`}
                    className="px-1 text-lg leading-none text-rust/70 hover:text-rust"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}

          {notice && (
            <p role="alert" className="mt-3 border border-rust/50 bg-rust/10 px-3 py-2 text-sm text-rust">
              {notice}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="font-head text-sm uppercase">Jami</span>
            <span className="font-num text-2xl font-semibold">{money(cart.total)}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.lines.length === 0 || busy}
            className="btn btn-safety mt-3 w-full py-3"
          >
            {busy ? 'Saqlanmoqda...' : 'Sotishni yakunlash — chek chiqarish'}
          </button>
        </div>
      </section>

      {/* ================= O'NG: ombor holati ================= */}
      <section className="panel flex min-w-0 flex-col p-4 lg:max-h-[calc(100vh-7.5rem)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-head text-base uppercase tracking-wide">Ombor holati</h2>
          <input
            type="text"
            value={tableQuery}
            onChange={(e) => setTableQuery(e.target.value)}
            placeholder="Ombordan qidirish..."
            aria-label="Ombordan qidirish"
            className="field w-44 py-1.5"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="th sticky top-0 bg-panel w-10" />
                <th className="th sticky top-0 bg-panel">Nomi</th>
                <th className="th sticky top-0 bg-panel">Birlik</th>
                <th className="th sticky top-0 bg-panel text-right">Narx</th>
                <th className="th sticky top-0 bg-panel text-right">Qoldiq</th>
                <th className="th sticky top-0 bg-panel pr-0">Kelgan sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-mute">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-mute">
                    Mahsulot topilmadi
                  </td>
                </tr>
              )}
              {tableRows.map((p) => (
                <tr
                  key={p.id}
                  tabIndex={0}
                  onClick={() => pick(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      pick(p);
                    }
                  }}
                  className="row-hover cursor-pointer"
                >
                  <td className="py-2.5 pr-3">
                    <CategoryIcon category={p.category} />
                  </td>
                  <td className="py-2.5 pr-3">
                    <div>{p.name}</div>
                    <div className="font-num text-xs text-mute">{p.sku}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-mute">{p.unit}</td>
                  <td className="py-2.5 pr-3 text-right font-num">{fmtMoney(p.price)}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <StockBadge product={p} />
                  </td>
                  <td className="py-2.5 font-num text-mute">{formatDate(p.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">
          Qatorni bosing — miqdor so'raladi va savatga qo'shiladi. Mahsulot qo'shish va tahrirlash —
          "Ombor boshqaruvi" bo'limida.
        </p>
      </section>

      {picked && <QtyModal product={picked} onSubmit={handleAdd} onClose={closePicker} />}

      {/* Savatni tozalashni tasdiqlash modali (brauzer alert emas) */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rust/10 text-2xl text-rust">
                🗑️
              </div>
              <div>
                <h3 className="font-head text-base font-semibold uppercase text-ink">
                  Savatni tozalash
                </h3>
                <p className="text-xs text-mute">Savatdagi barcha tovarlarni tozalashni xohlaysizmi?</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-mute">
              Tanlangan barcha mahsulotlar savatdan olib tashlanadi.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Yo'q (Qolish)
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Ha (Tozalash)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
