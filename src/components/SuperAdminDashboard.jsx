import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { fmtMoney } from '../utils/format';

const SUBSCRIPTION_PRICE = 80000; // so'm / oy

// Muddatga N oy qo'shadi: agar hali muddati tugamagan bo'lsa QOLGAN vaqtga ustiga qo'shadi,
// agar tugagan/belgilanmagan bo'lsa bugungi kundan boshlab hisoblaydi.
function extendSubscriptionDate(currentExpiresAt, months) {
  const base =
    currentExpiresAt && new Date(currentExpiresAt) > new Date() ? new Date(currentExpiresAt) : new Date();
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

// Qolgan (yoki o'tib ketgan) vaqtni kun+soatga ajratadi
function getCountdownParts(expiresAt) {
  if (!expiresAt) return null;
  const target = new Date(expiresAt);
  target.setHours(23, 59, 59, 999); // muddat kunining oxirigacha amal qiladi
  const diffMs = target.getTime() - Date.now();
  const expired = diffMs <= 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60 * 60));
  return { days, hours, expired };
}

function SubscriptionCountdown({ expiresAt, status }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 60000); // har daqiqada yangilanadi
    return () => clearInterval(id);
  }, []);

  if (status === 'inactive') {
    return <span className="font-semibold text-rust">To'xtatilgan</span>;
  }
  const c = getCountdownParts(expiresAt);
  if (!c) return <span className="text-mute">Muddat belgilanmagan</span>;
  if (c.expired) {
    return (
      <span className="font-semibold text-rust">
        {c.days} kun {c.hours} soat oldin tugagan
      </span>
    );
  }
  const warn = c.days <= 7;
  return (
    <span className={warn ? 'font-semibold text-safety' : 'text-moss'}>
      {c.days} kun {c.hours} soat qoldi
    </span>
  );
}

export default function SuperAdminDashboard({ user, onLogout, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [markazlar, setMarkazlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Yangi kassir qo'shish formasi
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    markazId: '',
    password: '',
    subscriptionMonths: 1,
  });
  const [creating, setCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Tahrirlash modali
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    markazId: '',
    password: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Obunani boshqarish modali
  const [subModalUser, setSubModalUser] = useState(null);
  const [subForm, setSubForm] = useState({
    status: 'active',
    expiresAt: '',
  });
  const [savingSub, setSavingSub] = useState(false);

  // Markaz qo'shish / tahrirlash modali
  const [showMarkazModal, setShowMarkazModal] = useState(false);
  const [editMarkaz, setEditMarkaz] = useState(null);
  const [markazForm, setMarkazForm] = useState({ name: '', address: '' });
  const [savingMarkaz, setSavingMarkaz] = useState(false);

  // Chiqishni tasdiqlash modali
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, mList] = await Promise.all([api.listUsers(), api.listMarkazlar()]);
      setUsers(uList || []);
      setMarkazlar(mList || []);
    } catch (err) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhoneFormat = (raw) => {
    let val = raw.replace(/\D/g, '');
    if (val.startsWith('998')) val = val.slice(3);
    if (val.length > 9) val = val.slice(0, 9);
    return val;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim()) {
      setError("Kassir ism va familiyasini kiriting.");
      return;
    }
    if (form.phone.length < 9) {
      setError("Telefon raqamni to'liq 9 xonali qilib kiriting.");
      return;
    }
    if (!form.password.trim() || form.password.trim().length < 3) {
      setError("Parol kamida 3 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setCreating(true);
    try {
      const subscriptionExpiresAt = extendSubscriptionDate(null, form.subscriptionMonths);
      await api.createUser({
        role: 'kassir',
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        markazId: form.markazId ? String(form.markazId) : null,
        password: form.password.trim(),
        subscriptionStatus: 'active',
        subscriptionExpiresAt,
      });
      setSuccess(`Yangi kassir (${form.fullName}) muvaffaqiyatli qo'shildi!`);
      setForm({
        fullName: '',
        phone: '',
        markazId: '',
        password: '',
        subscriptionMonths: 1,
      });
      setShowAddModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (targetUser) => {
    setEditUser(targetUser);
    setEditForm({
      fullName: targetUser.fullName || '',
      phone: targetUser.phone || '',
      markazId: targetUser.markazId || '',
      password: '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setError('');
    setSavingEdit(true);

    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        markazId: editForm.markazId ? String(editForm.markazId) : null,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await api.updateUser(editUser.id, payload);
      setSuccess(`Kassir ma'lumotlari yangilandi!`);
      setEditUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || "Tahrirlashda xatolik");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`«${name}» kassirini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.deleteUser(id);
      setSuccess("Kassir o'chirildi.");
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "O'chirishda xatolik");
    }
  };

  // Obuna handlerlari
  const handleToggleSubStatus = async (targetUser) => {
    const newStatus = targetUser.subscriptionStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateSubscription(targetUser.id, {
        status: newStatus,
        expiresAt: targetUser.subscriptionExpiresAt || new Date().toISOString().slice(0, 10),
      });
      setSuccess(
        `«${targetUser.fullName}» obunasi ${newStatus === 'active' ? 'faollashtirildi' : "to'xtatildi"}!`
      );
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Obuna holatini o'zgartirishda xatolik");
    }
  };

  const handleExtendSub = async (targetUser, months) => {
    try {
      const newDate = extendSubscriptionDate(targetUser.subscriptionExpiresAt, months);
      await api.updateSubscription(targetUser.id, {
        status: 'active',
        expiresAt: newDate,
      });
      setSuccess(`«${targetUser.fullName}» obunasi ${months} oyga uzaytirildi! (${fmtMoney(SUBSCRIPTION_PRICE * months)} so'm)`);
      setSubModalUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || "Obunani uzaytirishda xatolik");
    }
  };

  const handleOpenSubModal = (targetUser) => {
    setSubModalUser(targetUser);
    setSubForm({
      status: targetUser.subscriptionStatus || 'active',
      expiresAt: targetUser.subscriptionExpiresAt || new Date().toISOString().slice(0, 10),
    });
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!subModalUser) return;
    setError('');
    setSavingSub(true);

    try {
      await api.updateSubscription(subModalUser.id, {
        status: subForm.status,
        expiresAt: subForm.expiresAt,
      });
      setSuccess(`«${subModalUser.fullName}» obuna muddati yangilandi!`);
      setSubModalUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || "Obuna muddatini saqlashda xatolik");
    } finally {
      setSavingSub(false);
    }
  };

  // Markaz boshqaruvi handlerlari
  const handleOpenCreateMarkaz = () => {
    setEditMarkaz(null);
    setMarkazForm({ name: '', address: '' });
    setShowMarkazModal(true);
  };

  const handleOpenEditMarkaz = (m) => {
    setEditMarkaz(m);
    setMarkazForm({ name: m.name || '', address: m.address || '' });
    setShowMarkazModal(true);
  };

  const handleSaveMarkaz = async (e) => {
    e.preventDefault();
    if (!markazForm.name.trim()) {
      setError("Markaz nomini kiriting.");
      return;
    }
    setSavingMarkaz(true);
    setError('');
    try {
      if (editMarkaz) {
        await api.updateMarkaz(editMarkaz.id, {
          name: markazForm.name.trim(),
          address: markazForm.address.trim(),
        });
        setSuccess("Markaz ma'lumotlari yangilandi!");
      } else {
        await api.createMarkaz({
          name: markazForm.name.trim(),
          address: markazForm.address.trim(),
        });
        setSuccess("Yangi markaz qo'shildi!");
      }
      setShowMarkazModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Markazni saqlashda xatolik");
    } finally {
      setSavingMarkaz(false);
    }
  };

  const handleDeleteMarkaz = async (id, name) => {
    if (!window.confirm(`«${name}» markazini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.deleteMarkaz(id);
      setSuccess("Markaz o'chirildi.");
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Markazni o'chirishda xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-line bg-panel">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel font-head text-xl font-bold text-onaccent">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-head text-xl font-bold uppercase tracking-wider text-ink">
                  Kassirlar va Obunalar Boshqaruvi
                </span>
              </div>
              <p className="text-xs text-mute">Kassirlar ro'yxati, obunalar va savdo markazlari nazorati</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profil tugmasi */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink hover:border-steel/50 transition"
            >
              <span>👤</span>
              <span className="max-w-[140px] truncate">{user.fullName || 'Admin'}</span>
            </button>

            {/* Chiqish */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Tizimdan chiqish"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-mute transition hover:border-rust/50 hover:bg-rust/10 hover:text-rust"
            >
              ⏻
            </button>
          </div>
        </div>
      </header>

      {/* ── Asosiy Kontent ── */}
      <main className="mx-auto max-w-[1500px] px-5 py-6">
        {/* Bildirishnomalar */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-rust/50 bg-rust/10 px-4 py-3 text-sm text-rust">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError('')} className="text-xs underline">
              Yopish
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-moss/50 bg-moss/10 px-4 py-3 text-sm text-moss">
            <span>✅ {success}</span>
            <button type="button" onClick={() => setSuccess('')} className="text-xs underline">
              Yopish
            </button>
          </div>
        )}

        {/* Yuqori Panel va Qo'shish tugmasi */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-head text-2xl font-bold uppercase tracking-wide text-ink">
              Kassirlar va Obunalar Ro'yxati
            </h1>
            <p className="mt-1 text-xs text-mute">
              Yangi kassir qo'shing, obuna holatini va muddatlarini boshqaring.
            </p>
            <div className="mt-1 text-xs text-mute">
              Obuna narxi: <span className="font-semibold text-ink">{fmtMoney(SUBSCRIPTION_PRICE)} so'm / oy</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-steel rounded-xl px-5 py-2.5 text-xs font-semibold shadow-lg transition hover:scale-105"
          >
            + Yangi Kassir Qo'shish
          </button>
        </div>

        {/* Statistika kartalari */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-xs text-mute">Jami Kassirlar</div>
            <div className="mt-1 font-num text-3xl font-bold text-ink">
              {users.filter((u) => u.role === 'kassir').length}
            </div>
            <div className="mt-1 text-[11px] text-mute">Tizimdagi jami kassirlar soni</div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-xs text-mute">Savdo Markazlari</div>
            <div className="mt-1 font-num text-3xl font-bold text-safety">
              {markazlar.length}
            </div>
            <div className="mt-1 text-[11px] text-mute">Ro'yxatdagi savdo filiallari soni</div>
          </div>
        </div>

        {/* Kassirlar Jadvali */}
        <section className="panel rounded-2xl overflow-hidden p-5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="th py-3">Ism va Familiya</th>
                  <th className="th py-3">Telefon (Login)</th>
                  <th className="th py-3">Savdo Markazi</th>
                  <th className="th py-3">Obuna</th>
                  <th className="th py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-mute">
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!loading && users.filter((u) => u.role === 'kassir').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-mute">
                      Kassirlar mavjud emas. Yuqoridagi tugma orqali yangi kassir qo'shing.
                    </td>
                  </tr>
                )}
                {users
                  .filter((u) => u.role === 'kassir')
                  .map((u) => (
                    <tr key={u.id} className="row-hover">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-ink">{u.fullName}</div>
                        <div className="text-[11px] text-mute font-num">ID: {u.id}</div>
                      </td>

                      <td className="py-3.5 pr-4 font-num font-medium text-ink">
                        +998 {u.phone}
                      </td>

                      <td className="py-3.5 pr-4">
                        {u.centerName ? (
                          <span className="text-ink">{u.centerName}</span>
                        ) : (
                          <span className="text-xs italic text-mute">Markazsiz (Shaxsiy)</span>
                        )}
                      </td>

                      {/* Obuna Holati va Teskari Sanoq */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-1">
                          <SubscriptionCountdown expiresAt={u.subscriptionExpiresAt} status={u.subscriptionStatus} />
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleSubStatus(u)}
                              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border transition ${
                                u.subscriptionStatus === 'active'
                                  ? 'border-rust/40 text-rust hover:bg-rust/10'
                                  : 'border-moss/40 text-moss hover:bg-moss/10'
                              }`}
                            >
                              {u.subscriptionStatus === 'active' ? "To'xtatish" : 'Faollashtirish'}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Amallar */}
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenSubModal(u)}
                          className="mr-2 rounded border border-safety/40 bg-safety/10 px-2.5 py-1 text-xs font-semibold text-safety hover:bg-safety/25 transition"
                        >
                          📅 Obuna
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="mr-2 rounded px-2.5 py-1 text-xs font-semibold text-steel hover:bg-steel/10 transition"
                        >
                          Tahrirlash
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.fullName)}
                          className="rounded px-2.5 py-1 text-xs font-semibold text-rust hover:bg-rust/10 transition"
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Markazlar Boshqaruvi Bo'limi */}
        <div className="mt-12 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-head text-xl font-bold uppercase tracking-wide text-ink">
              Savdo Markazlari (Filiallar) Boshqaruvi
            </h2>
            <p className="mt-1 text-xs text-mute">
              Tizimdagi savdo markazlarini qo'shing, tahrirlang yoki o'chiring.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateMarkaz}
            className="btn btn-steel rounded-xl px-4 py-2 text-xs font-semibold shadow-lg transition hover:scale-105"
          >
            + Yangi Markaz Qo'shish
          </button>
        </div>

        <section className="panel rounded-2xl overflow-hidden p-5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="th py-3">Markaz Nomi</th>
                  <th className="th py-3">Manzil</th>
                  <th className="th py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {markazlar.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-mute">
                      Hozircha markazlar mavjud emas.
                    </td>
                  </tr>
                )}
                {markazlar.map((m) => (
                  <tr key={m.id} className="row-hover">
                    <td className="py-3.5 pr-4 font-semibold text-ink">{m.name}</td>
                    <td className="py-3.5 pr-4 text-mute">{m.address || '—'}</td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMarkaz(m)}
                        className="mr-2 rounded px-2.5 py-1 text-xs font-semibold text-steel hover:bg-steel/10 transition"
                      >
                        Tahrirlash
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMarkaz(m.id, m.name)}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-rust hover:bg-rust/10 transition"
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── Obunani Boshqarish va Narxlar Modali ── */}
      {subModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSubModalUser(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                  Obunani Boshqarish
                </h3>
                <p className="text-xs text-mute">
                  {subModalUser.fullName} (+998 {subModalUser.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubModalUser(null)}
                className="text-2xl text-mute hover:text-ink"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block font-head text-xs uppercase tracking-wider text-mute">
                  Tezkor Uzaytirish (Narxi bilan):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleExtendSub(subModalUser, 1)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition"
                  >
                    <div className="font-bold text-xs text-ink">+1 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{fmtMoney(SUBSCRIPTION_PRICE * 1)} so'm</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendSub(subModalUser, 3)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition"
                  >
                    <div className="font-bold text-xs text-ink">+3 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{fmtMoney(SUBSCRIPTION_PRICE * 3)} so'm</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendSub(subModalUser, 6)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition"
                  >
                    <div className="font-bold text-xs text-ink">+6 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{fmtMoney(SUBSCRIPTION_PRICE * 6)} so'm</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendSub(subModalUser, 12)}
                    className="rounded-xl border border-safety/50 bg-safety/10 p-3 text-left hover:bg-safety/20 transition"
                  >
                    <div className="font-bold text-xs text-safety">+1 yil (12 oy)</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{fmtMoney(SUBSCRIPTION_PRICE * 12)} so'm</div>
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <form onSubmit={handleSaveSub} className="space-y-3">
                  <label className="block font-head text-xs uppercase tracking-wider text-mute">
                    Aniq sana belgilash
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={subForm.expiresAt}
                      onChange={(e) => setSubForm({ ...subForm, expiresAt: e.target.value })}
                      className="field rounded-xl p-2.5 font-num text-sm text-ink bg-paper border-line flex-1"
                    />
                    <button
                      type="submit"
                      disabled={savingSub}
                      className="btn btn-steel rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {savingSub ? '...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setSubModalUser(null)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yangi Kassir Qo'shish Modali ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                Yangi Kassir Qo'shish
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-2xl text-mute hover:text-ink"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Ism va Familiya <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Rustamov"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="field rounded-lg"
                />
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Telefon Raqami (Login) <span className="text-rust">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs text-mute font-num">
                    +998
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="90 123 45 67"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: handlePhoneFormat(e.target.value) })}
                    className="field rounded-lg pl-14 font-num"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Savdo Markazi <span className="text-mute/70 lowercase font-normal">(ixtiyoriy)</span>
                </label>
                <select
                  value={form.markazId}
                  onChange={(e) => setForm({ ...form, markazId: e.target.value })}
                  className="field rounded-lg bg-paper text-ink"
                >
                  <option value="">Markazsiz (Biriktirilmagan)</option>
                  {markazlar.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.address ? `(${m.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Parol Yaratish <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kassir uchun parol belgilang"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field rounded-lg font-num"
                />
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wide text-mute">
                  Boshlang'ich obuna muddati
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, subscriptionMonths: months }))}
                      className={`rounded-lg border p-2 text-center text-xs ${
                        form.subscriptionMonths === months
                          ? 'border-safety bg-safety/10 text-safety'
                          : 'border-line text-mute hover:text-ink'
                      }`}
                    >
                      <div className="font-semibold">{months === 12 ? '1 yil' : `${months} oy`}</div>
                      <div className="mt-0.5 font-num">{(SUBSCRIPTION_PRICE * months).toLocaleString('uz')} so'm</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-steel rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {creating ? 'Qo\'shilmoqda...' : 'Kassirni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Kassirni Tahrirlash Modali ── */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditUser(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                Kassirni Tahrirlash
              </h3>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="text-2xl text-mute hover:text-ink"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Ism va Familiya
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="field rounded-lg"
                />
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Telefon Raqami (Login)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs text-mute font-num">
                    +998
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: handlePhoneFormat(e.target.value) })
                    }
                    className="field rounded-lg pl-14 font-num"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Savdo Markazi
                </label>
                <select
                  value={editForm.markazId}
                  onChange={(e) => setEditForm({ ...editForm, markazId: e.target.value })}
                  className="field rounded-lg bg-paper text-ink"
                >
                  <option value="">Markazsiz (Biriktirilmagan)</option>
                  {markazlar.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.address ? `(${m.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Yangi Parol <span className="text-mute/70 lowercase font-normal">(ixtiyoriy)</span>
                </label>
                <input
                  type="text"
                  placeholder="Bo'sh qolsa eski parol qoladi"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="field rounded-lg font-num"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-steel rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {savingEdit ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Markaz Qo'shish / Tahrirlash Modali ── */}
      {showMarkazModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowMarkazModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                {editMarkaz ? "Markazni Tahrirlash" : "Yangi Markaz Qo'shish"}
              </h3>
              <button
                type="button"
                onClick={() => setShowMarkazModal(false)}
                className="text-2xl text-mute hover:text-ink"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMarkaz} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Markaz Nomi <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Mustahkam Savdo Markazi"
                  value={markazForm.name}
                  onChange={(e) => setMarkazForm({ ...markazForm, name: e.target.value })}
                  className="field rounded-lg"
                />
              </div>

              <div>
                <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
                  Manzil <span className="text-mute/70 lowercase font-normal">(ixtiyoriy)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh., Chilonzor t."
                  value={markazForm.address}
                  onChange={(e) => setMarkazForm({ ...markazForm, address: e.target.value })}
                  className="field rounded-lg"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMarkazModal(false)}
                  className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingMarkaz}
                  className="btn btn-steel rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {savingMarkaz ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Chiqishni Tasdiqlash Modali ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rust/10 text-2xl text-rust">
                ⚠️
              </div>
              <div>
                <h3 className="font-head text-base font-semibold uppercase text-ink">
                  Tizimdan chiqish
                </h3>
                <p className="text-xs text-mute">Tizimdan chiqishni xohlaysizmi?</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Yo'q (Qolish)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Ha (Chiqish)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
