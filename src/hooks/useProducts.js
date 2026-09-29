import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setProducts(await api.listProducts());
      setError('');
    } catch (err) {
      setError(err.message || "Mahsulotlarni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Xatolik chaqiruvchiga uzatiladi (modal ichida ko'rsatish uchun)
  const saveProduct = useCallback(
    async (data) => {
      const saved = data.id
        ? await api.updateProduct(data.id, data)
        : await api.createProduct(data);
      await reload();
      return saved;
    },
    [reload],
  );

  const deleteProduct = useCallback(
    async (id) => {
      await api.deleteProduct(id);
      await reload();
    },
    [reload],
  );

  return { products, loading, error, reload, saveProduct, deleteProduct };
}
