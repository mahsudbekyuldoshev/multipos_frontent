import { useEffect, useMemo, useState } from 'react';
import { fmtMoney, fmtQty, formatDate, money } from '../utils/format';
import { matchesQuery } from '../utils/search';
import { isLow, isOut } from '../utils/stock';
import { CategoryIcon, CategoryTag } from './Badges';
import CategoryChips from './CategoryChips';
import ProductModal from './ProductModal';
import SalesChart from './SalesChart';
import { api } from '../services/api';
import { setActiveCategories, getActiveCategories } from '../data/catalog';
import Modal from './Modal';

/**
 * Ombor boshqaruvi: mahsulotlar ro'yxati, qoldiqlar, qo'shish / tahrirlash / o'chirish.
 * `onSave(product)` va `onDelete(id)` — promise qaytaradi, xato bo'lsa Error tashlaydi.
 */
export default function Ombor({ products, loading, onSave, onDelete, sales = [] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyLow, setOnlyLow] = useState(false);
  const [modal, setModal] = useState({ open: false, product: null });

  // Kategoriyalarni boshqarish state'lari
  const [categories, setCategories] = useState(getActiveCategories());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null); // null - create, object - edit
  const [catForm, setCatForm] = useState({ key: '', label: '', icon: '📦', accent: '#4E97C4' });
  const [catError, setCatError] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const loadCategories = async () => {
    try {
      const list = await api.listCategories();
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
        setActiveCategories(list);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const stats = useMemo(
    () => ({
      count: products.length,
      low: products.filter(isLow).length,
      value: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    }),
    [products],
  );

  const rows = useMemo(
    () =>
      products
        .filter((p) => category === 'all' || p.category === category)
        .filter((p) => !onlyLow || isLow(p))
        .filter((p) => matchesQuery(p, query))
        .sort((a, b) => a.name.localeCompare(b.name, 'uz')),
    [products, category, onlyLow, query],
  );

  const openNew = () => setModal({ open: true, product: null });
  const openEdit = (product) => setModal({ open: true, product });
  const closeModal = () => setModal({ open: false, product: null });

  const handleOpenCreateCategory = () => {
    setEditCategory(null);
    setCatForm({ key: '', label: '', icon: '📦', accent: '#4E97C4' });
    setCatError('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (c) => {
    setEditCategory(c);
    setCatForm({ key: c.key, label: c.label, icon: c.icon || '📦', accent: c.accent || '#4E97C4' });
    setCatError('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    if (!catForm.label.trim()) {
      setCatError("Kategoriya nomini kiriting.");
      return;
    }
    setSavingCat(true);
    try {
      if (editCategory) {
        await api.updateCategory(editCategory.key, {
          label: catForm.label.trim(),
          icon: catForm.icon.trim() || '📦',
          accent: catForm.accent.trim() || '#4E97C4',
        });
      } else {
        await api.createCategory({
          key: catForm.key.trim() || undefined,
          label: catForm.label.trim(),
          icon: catForm.icon.trim() || '📦',
          accent: catForm.accent.trim() || '#4E97C4',
        });
      }
      await loadCategories();
      setShowCategoryModal(false);
    } catch (err) {
      setCatError(err.message || "Kategoriyani saqlashda xatolik");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (key, label) => {
    if (!window.confirm(`«${label}» kategoriyasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.deleteCategory(key);
      await loadCategories();
      if (category === key) setCategory('all');
    } catch (err) {
      alert(err.message || "O'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Sotuv statistikasi chart ── */}
      <section className="panel p-5">
        <SalesChart sales={sales} />
      </section>

      {/* ── Mahsulotlar jadvali ── */}
      <section className="panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-head text-lg uppercase tracking-wide">Ombor boshqaruvi</h2>
            <p className="mt-0.5 text-xs text-mute">
              Qoldiq belgilangan minimumdan kam bo'lsa — qizil, yetarli bo'lsa — yashil.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ombordan qidirish..."
              aria-label="Ombordan qidirish"
              className="field w-48 py-1.5"
            />
            <button
              type="button"
              onClick={handleOpenCreateCategory}
              className="btn btn-ghost py-1.5 border border-line"
            >
              ⚙️ Kategoriyalar
            </button>
            <button type="button" onClick={openNew} className="btn btn-steel py-1.5">
              + Yangi mahsulot
            </button>
          </div>
        </div>

        <div className="mb-3">
          <CategoryChips value={category} onChange={setCategory}>
            <button
              type="button"
              aria-pressed={onlyLow}
              onClick={() => setOnlyLow((v) => !v)}
              className={`chip ml-auto ${onlyLow ? 'chip-active' : ''}`}
            >
              Kam qolganlar ({stats.low})
            </button>
          </CategoryChips>
        </div>

        <p className="mb-3 text-sm text-mute">
          Jami <span className="font-num text-ink">{stats.count}</span> ta mahsulot, shundan{' '}
          <span className={`font-num ${stats.low ? 'text-rust' : 'text-ink'}`}>{stats.low}</span> tasi
          kam qolgan. Ombordagi tovarlarning sotuv narxidagi qiymati:{' '}
          <span className="font-num text-ink">{money(stats.value)}</span>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="th w-10" />
                <th className="th">Nomi / Artikul</th>
                <th className="th">Kategoriya</th>
                <th className="th">Birlik</th>
                <th className="th text-right">Narx</th>
                <th className="th text-right">Qoldiq</th>
                <th className="th text-right">Minimum</th>
                <th className="th">Holati</th>
                <th className="th">Kelgan sana</th>
                <th className="th pr-0" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-mute">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-mute">
                    Mahsulot topilmadi
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const low = isLow(p);
                return (
                  <tr key={p.id} className="row-hover">
                    <td className="py-2.5 pr-3">
                      <CategoryIcon category={p.category} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <div>{p.name}</div>
                      <div className="font-num text-xs text-mute">{p.sku}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <CategoryTag category={p.category} />
                    </td>
                    <td className="py-2.5 pr-3 text-mute">{p.unit}</td>
                    <td className="py-2.5 pr-3 text-right font-num">{fmtMoney(p.price)}</td>
                    <td
                      className={`py-2.5 pr-3 text-right font-num font-semibold ${
                        low ? 'text-rust' : 'text-moss'
                      }`}
                    >
                      {fmtQty(p.stock)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-num text-mute">{fmtQty(p.minStock)}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block border px-1.5 py-0.5 text-xs ${
                          low ? 'border-rust text-rust' : 'border-moss text-moss'
                        }`}
                      >
                        {isOut(p) ? 'Tugagan' : low ? 'Kam qoldi' : 'Yetarli'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-num text-mute">{formatDate(p.receivedAt)}</td>
                    <td className="whitespace-nowrap py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`${p.name} ni tahrirlash`}
                        title="Tahrirlash"
                        className="px-1 text-mute hover:text-ink"
                      >
                        &#9998;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {modal.open && (
          <ProductModal
            product={modal.product}
            onSave={onSave}
            onDelete={onDelete}
            onClose={closeModal}
          />
        )}

        {/* ── Kategoriyalarni Boshqarish Modali ── */}
        {showCategoryModal && (
          <Modal title="Kategoriyalarni Boshqarish" onClose={() => setShowCategoryModal(false)}>
            <div className="space-y-4">
              {catError && (
                <div className="rounded-lg border border-rust/40 bg-rust/10 p-3 text-xs text-rust">
                  ⚠️ {catError}
                </div>
              )}

              <form onSubmit={handleSaveCategory} className="rounded-xl border border-line bg-paper p-4 space-y-3">
                <h4 className="font-head text-xs uppercase tracking-wide font-bold text-ink">
                  {editCategory ? "Kategoriyani Tahrirlash" : "Yangi Kategoriya Qo'shish"}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-mute mb-1">Nomi (Label)</label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Mebel"
                      value={catForm.label}
                      onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mute mb-1">Kalit (Key)</label>
                    <input
                      type="text"
                      disabled={Boolean(editCategory)}
                      placeholder="mebel (avtomatik)"
                      value={catForm.key}
                      onChange={(e) => setCatForm({ ...catForm, key: e.target.value })}
                      className="field disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-mute mb-1">Icon (Emoji)</label>
                    <input
                      type="text"
                      placeholder="🪑"
                      value={catForm.icon}
                      onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mute mb-1">Rang (Accent)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catForm.accent}
                        onChange={(e) => setCatForm({ ...catForm, accent: e.target.value })}
                        className="h-9 w-12 rounded border border-line bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catForm.accent}
                        onChange={(e) => setCatForm({ ...catForm, accent: e.target.value })}
                        className="field font-num"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editCategory && (
                    <button
                      type="button"
                      onClick={handleOpenCreateCategory}
                      className="btn btn-ghost py-1.5 text-xs"
                    >
                      Bekor qilish
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="btn btn-steel py-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {savingCat ? 'Saqlanmoqda...' : editCategory ? 'Yangilash' : "Qo'shish"}
                  </button>
                </div>
              </form>

              {/* Mavjud kategoriyalar ro'yxati */}
              <div className="space-y-2">
                <h4 className="font-head text-xs uppercase tracking-wide font-bold text-mute">
                  Mavjud Kategoriyalar ({categories.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {categories.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-center justify-between rounded-xl border border-line bg-paper p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded text-sm"
                          style={{ background: `${c.accent}26`, border: `1px solid ${c.accent}66` }}
                        >
                          {c.icon || '📦'}
                        </span>
                        <div>
                          <div className="font-semibold text-ink">{c.label}</div>
                          <div className="font-num text-[10px] text-mute">key: {c.key}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(c)}
                          className="btn btn-ghost px-2 py-1 text-[11px]"
                        >
                          Tahrirlash
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.key, c.label)}
                          className="btn bg-rust/10 text-rust hover:bg-rust/20 px-2 py-1 text-[11px]"
                        >
                          O'chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </section>
    </div>
  );
}
