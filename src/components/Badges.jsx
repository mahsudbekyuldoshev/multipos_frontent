import { getCategory } from '../data/catalog';
import { fmtQty } from '../utils/format';
import { isLow } from '../utils/stock';

export function CategoryIcon({ category }) {
  const c = getCategory(category);
  return (
    <span
      aria-hidden="true"
      title={c.label}
      className="flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-md text-[15px]"
      style={{ background: `${c.accent}26`, border: `1px solid ${c.accent}66` }}
    >
      {c.icon}
    </span>
  );
}

export function CategoryTag({ category }) {
  const c = getCategory(category);
  return (
    <span
      className="inline-block px-1.5 py-0.5 text-xs"
      style={{ color: c.accent, border: `1px solid ${c.accent}66` }}
    >
      {c.label}
    </span>
  );
}

/** Qoldiq: minimumdan kam bo'lsa qizil, yetarli bo'lsa yashil. */
export function StockBadge({ product }) {
  const low = isLow(product);
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-num text-xs ${
        low ? 'border-rust text-rust' : 'border-moss text-moss'
      }`}
    >
      {fmtQty(product.stock)}
    </span>
  );
}
