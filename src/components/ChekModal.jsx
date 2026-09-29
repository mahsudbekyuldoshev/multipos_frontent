import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getCategory } from '../data/catalog';
import { fmtMoney, fmtQty, formatDate, formatDateTime } from '../utils/format';

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  return [...groups.entries()].map(([category, list]) => ({
    category,
    list,
    subtotal: list.reduce((sum, i) => sum + i.lineTotal, 0),
  }));
}

/**
 * Sotuv yakunlangach chiqadigan chek.
 * Ochilishi bilan window.print() chaqiriladi (autoPrint), "Chop etish" tugmasi bilan qayta chiqarish mumkin.
 * Chek <body> ga portal orqali qo'yiladi, chop etishda index.css ilovaning qolgan qismini yashiradi.
 */
export default function ChekModal({ sale, storeName, onClose, autoPrint = true }) {
  const groups = useMemo(() => groupByCategory(sale.items), [sale]);
  const multiCategory = groups.length > 1;

  useEffect(() => {
    if (!autoPrint) return undefined;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [autoPrint, sale.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="receipt-overlay fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chek"
    >
      {/* Ekranda: markazlashtirilgan ko'rinish */}
      <div className="m-auto flex flex-col items-center gap-3">
        {/* Chek qog'ozi */}
        <div className="receipt-paper w-[340px] bg-[#F5F2E9] px-5 py-6 font-num text-[12.5px] leading-relaxed text-black shadow-2xl">
          <div className="text-center font-head text-base uppercase tracking-wide">
            {storeName}
          </div>
          <div className="text-center text-xs">Chek № {sale.number}</div>
          <div className="text-center text-xs">Sotilgan sana: {formatDateTime(sale.createdAt)}</div>

          <div className="my-3 border-t border-dashed border-black/50" />

          <div className="space-y-1">
            {groups.map(({ category, list, subtotal }) => {
              const meta = getCategory(category);
              return (
                <div key={category} className="space-y-1">
                  <div className="mb-1 mt-2 font-head text-xs uppercase tracking-wide">
                    {meta.icon} {meta.label}
                  </div>
                  {list.map((item) => (
                    <div key={item.productId}>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs">Keldi: {formatDate(item.receivedAt)}</div>
                      <div className="flex justify-between gap-2 text-xs">
                        <span>
                          {fmtQty(item.quantity)} {item.unit} &times; {fmtMoney(item.unitPrice)}
                        </span>
                        <span>{fmtMoney(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                  {multiCategory && (
                    <div className="mt-1 flex justify-between border-t border-dashed border-black/50 pt-1 text-xs font-semibold">
                      <span>{meta.label} — jami</span>
                      <span>{fmtMoney(subtotal)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-3 border-t border-dashed border-black/50" />

          <div className="flex justify-between text-base font-semibold">
            <span>JAMI</span>
            <span>{fmtMoney(sale.total)} so'm</span>
          </div>
          <div className="mt-4 text-center text-xs">Xaridingiz uchun rahmat!</div>
        </div>

        {/* Ekranda ko'rinadigan tugmalar — print qilganda yashiriladi */}
        <div className="no-print flex gap-2">
          <button type="button" autoFocus onClick={() => window.print()} className="btn btn-steel px-5">
            Chop etish
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost bg-white/10 px-5">
            Yopish
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
