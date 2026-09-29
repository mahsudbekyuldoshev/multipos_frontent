import { getUnit } from '../data/catalog';
import { fmtQty, round2 } from './format';

export const EPS = 1e-9;

/** Qator summasi: butun so'mgacha yaxlitlanadi (chekdagi hisob bilan bir xil). */
export const lineTotal = (unitPrice, quantity) => Math.round(unitPrice * quantity);

export const isOut = (p) => p.stock <= EPS;
export const isLow = (p) => p.stock <= p.minStock + EPS;

/**
 * Sotiladigan miqdorni tekshiradi. Xato bo'lsa — xabar matni, hammasi joyida bo'lsa — null.
 * `quantity` — savatdagi JAMI miqdor (oldingi qo'shilganlari bilan birga).
 */
export function validateQuantity(product, quantity) {
  const q = round2(quantity);
  if (!Number.isFinite(q) || q <= 0) return "Miqdorni to'g'ri kiriting.";
  if (!getUnit(product.unit).fractional && !Number.isInteger(q)) {
    return `«${product.name}» butun sonda sotiladi (${product.unit}).`;
  }
  if (q > product.stock + EPS) {
    return `Omborda yetarli emas. Qoldiq: ${fmtQty(product.stock)} ${product.unit}.`;
  }
  return null;
}
