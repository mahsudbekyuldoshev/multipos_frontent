import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useSales() {
  const [sales, setSales] = useState([]);

  const reload = useCallback(async () => {
    try {
      setSales(await api.listSales());
    } catch {
      /* statistika muhim emas — xato bo'lsa, eski qiymat qoladi */
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** items: [{ productId, quantity }] -> Sale */
  const createSale = useCallback(
    async (items) => {
      const sale = await api.createSale({ items });
      await reload();
      return sale;
    },
    [reload],
  );

  return { sales, createSale };
}
