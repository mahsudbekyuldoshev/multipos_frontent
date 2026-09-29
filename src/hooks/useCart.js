import { useMemo, useState } from 'react';
import { round2 } from '../utils/format';
import { lineTotal, validateQuantity } from '../utils/stock';

/**
 * Savat faqat { productId, quantity } saqlaydi. Nom, narx va h.k. har doim
 * joriy mahsulotlar ro'yxatidan olinadi — shu tufayli narx o'zgarsa yoki
 * mahsulot o'chsa, savat eskirgan ma'lumot ko'rsatmaydi.
 *
 * add / setQuantity: xato bo'lsa xabar matnini, muvaffaqiyatli bo'lsa null qaytaradi.
 */
export function useCart(products) {
  const [items, setItems] = useState([]);

  const lines = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return items.flatMap(({ productId, quantity }) => {
      const product = byId.get(productId);
      return product
        ? [{ product, quantity, lineTotal: lineTotal(product.price, quantity) }]
        : [];
    });
  }, [items, products]);

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines]);

  const addItem = (product, quantity) => {
    const q = round2(quantity);
    const existing = items.find((i) => i.productId === product.id);
    const next = round2((existing?.quantity ?? 0) + q);
    const error = validateQuantity(product, q) || validateQuantity(product, next);
    if (error) return error;

    setItems((prev) =>
      existing
        ? prev.map((i) => (i.productId === product.id ? { ...i, quantity: next } : i))
        : [...prev, { productId: product.id, quantity: q }],
    );
    return null;
  };

  const setQuantity = (product, quantity) => {
    const q = round2(quantity);
    const error = validateQuantity(product, q);
    if (error) return error;
    setItems((prev) => prev.map((i) => (i.productId === product.id ? { ...i, quantity: q } : i)));
    return null;
  };

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clear = () => setItems([]);

  return { lines, total, addItem, setQuantity, removeItem, clear };
}
