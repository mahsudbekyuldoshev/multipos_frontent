import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { fmtMoney, todayKey, diffDays, addMonthsKey, addDaysKey, formatUzDate, parseDateKey, formatPhone } from '../utils/format';

function getCountdownParts(expiresAt) {
  if (!expiresAt) return null;
  const target = parseDateKey(expiresAt);
  target.setHours(23, 59, 59, 999);
  const diffMs = target.getTime() - Date.now();
  const expired = diffMs <= 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60 * 60));
  return { days, hours, expired };
}

function SubscriptionCountdown({ expiresAt, status, daysLeft, plan }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (plan === 'standard' && status === 'inactive' && (!expiresAt || diffDays(todayKey(), expiresAt) < 0)) {
    return <span className="font-semibold text-rust">Obuna ulanmagan</span>;
  }
  if (status === 'inactive') {
    return <span className="font-semibold text-rust">To'xtatilgan</span>;
  }
  if (status === 'expired') {
    return plan === 'free' ? <span className="font-semibold text-rust">Bepul davr tugagan</span> : <span className="font-semibold text-rust">Muddati tugagan</span>;
  }

  if (plan === 'free') {
    if (daysLeft !== undefined && daysLeft !== null) {
      if (daysLeft < 0) return <span className="font-semibold text-rust">Bepul davr tugagan ({Math.abs(daysLeft)} kun oldin)</span>;
      if (daysLeft === 0) return <span className="font-semibold text-safety">Bugun tugaydi</span>;
      return <span className="text-moss font-semibold">Bepul davr: {daysLeft} kun qoldi</span>;
    }
    const curDays = diffDays(todayKey(), expiresAt);
    if (curDays < 0) return <span className="font-semibold text-rust">Bepul davr tugagan ({Math.abs(curDays)} kun oldin)</span>;
    if (curDays === 0) return <span className="font-semibold text-safety">Bugun tugaydi</span>;
    return <span className="text-moss font-semibold">Bepul davr: {curDays} kun qoldi</span>;
  }

  if (daysLeft !== undefined && daysLeft !== null) {
    if (daysLeft < 0 || status === 'expired') {
      return <span className="font-semibold text-rust">Muddati tugagan ({Math.abs(daysLeft)} kun oldin)</span>;
    }
    if (daysLeft === 0) {
      return <span className="font-semibold text-safety">Bugun tugaydi</span>;
    }
    const warn = daysLeft <= 7;
    return (
      <span className={warn ? 'font-semibold text-safety' : 'text-moss'}>
        {daysLeft} kun qoldi
      </span>
    );
  }

  const curDays = diffDays(todayKey(), expiresAt);
  if (curDays < 0 || status === 'expired') {
    return <span className="font-semibold text-rust">Muddati tugagan ({Math.abs(curDays)} kun oldin)</span>;
  }
  if (curDays === 0) {
    return <span className="font-semibold text-safety">Bugun tugaydi</span>;
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

function calculateCurrentDaysLeft(expiresAt) {
  if (!expiresAt) return 0;
  return diffDays(todayKey(), expiresAt);
}

function calculateNewDaysLeft(expiresAt) {
  if (!expiresAt) return 0;
  return diffDays(todayKey(), expiresAt);
}

function calculateDiffDays(currentExpiresAt, newExpiresAt) {
  const curRaw = diffDays(todayKey(), currentExpiresAt || todayKey());
  const curDays = curRaw < 0 ? 0 : curRaw;
  const newDays = diffDays(todayKey(), newExpiresAt || todayKey());
  return newDays - curDays;
}

function formatDiffString(diff) {
  if (diff > 0) return `+${diff} kun`;
  if (diff < 0) return `${Math.abs(diff)} kun kamayadi`;
  return `o'zgarmadi`;
}

function calculateShortenDate(currentExpiresAt, months) {
  const baseKey = currentExpiresAt && diffDays(todayKey(), currentExpiresAt) > 0 ? currentExpiresAt : todayKey();
  const newKey = addMonthsKey(baseKey, -months);
  const today = todayKey();
  if (diffDays(newKey, today) > 0) {
    return today;
  }
  return newKey;
}

export default function SuperAdminDashboard({ user, onLogout, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [markazlar, setMarkazlar] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Yangi kassir qo'shish formasi
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    markazId: '',
    password: '',
    plan: 'free',
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
  const [modalError, setModalError] = useState('');
  const [shortenConfirmData, setShortenConfirmData] = useState(null);

  // Markaz qo'shish / tahrirlash modali
  const [showMarkazModal, setShowMarkazModal] = useState(false);
  const [editMarkaz, setEditMarkaz] = useState(null);
  const [markazForm, setMarkazForm] = useState({ name: '', address: '' });
  const [savingMarkaz, setSavingMarkaz] = useState(false);

  // Chiqish va o'chirish tasdiqlash modallari
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteMarkazTarget, setDeleteMarkazTarget] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      let tList = [];
      try {
        tList = await api.getTariffs();
      } catch {
        tList = [];
      }
      const [uList, mList] = await Promise.all([
        api.listUsers(),
        api.listMarkazlar(),
      ]);
      setUsers(uList || []);
      setMarkazlar(mList || []);
      setTariffs(tList || []);
    } catch (err) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const standardTariff = tariffs.find((t) => t.code === 'standard');
  const subscriptionPrice = standardTariff?.pricePerMonth || 80000;

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
      const payload = {
        role: 'kassir',
        fullName: form.fullName.trim(),
        phone: '998' + form.phone.trim(),
        markazId: form.markazId ? String(form.markazId) : null,
        password: form.password.trim(),
        plan: form.plan,
      };
      if (form.plan === 'standard') {
        payload.subscription_months = form.subscriptionMonths;
      }

      await api.createUser(payload);

      if (form.plan === 'free') {
        setSuccess("Kassir qo'shildi. 11 kunlik bepul tarif berildi.");
      } else {
        setSuccess(`Kassir qo'shildi. ${form.subscriptionMonths} oylik Standart obuna ulandi (tugash: ${formatUzDate(addMonthsKey(todayKey(), form.subscriptionMonths))})`);
      }

      setForm({
        fullName: '',
        phone: '',
        markazId: '',
        password: '',
        plan: 'free',
        subscriptionMonths: 1,
      });
      setShowAddModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      if (err.data?.plan || (err.message && err.message.toLowerCase().includes('bepul'))) {
        setError("Bu raqam bepul davrdan foydalangan. Standart tarifni tanlang.");
        setForm((prev) => ({ ...prev, plan: 'standard' }));
      } else {
        setError(err.message || "Xatolik yuz berdi");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (targetUser) => {
    setEditUser(targetUser);
    const rawPhone = String(targetUser.phone || '').replace(/\D/g, '');
    const last9 = rawPhone.slice(-9);
    setEditForm({
      fullName: targetUser.fullName || '',
      phone: last9,
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
        phone: '998' + editForm.phone.trim(),
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

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await api.deleteUser(deleteUserTarget.id);
      setSuccess("Kassir o'chirildi.");
      setDeleteUserTarget(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "O'chirishda xatolik");
      setDeleteUserTarget(null);
    }
  };

  const handleToggleSubStatus = async (targetUser) => {
    const newStatus = targetUser.subscriptionStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.updateSubscription(targetUser.id, {
        status: newStatus,
      });
      
      const updatedUser = {
        ...targetUser,
        plan: res.plan ?? targetUser.plan,
        subscriptionStatus: res.status ?? res.subscriptionStatus,
        subscriptionExpiresAt: res.subscriptionEndDate || targetUser.subscriptionExpiresAt,
        daysLeft: res.daysLeft ?? res.days_left ?? calculateCurrentDaysLeft(targetUser.subscriptionExpiresAt),
      };

      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      setSuccess(
        `«${targetUser.fullName}» obunasi ${newStatus === 'active' ? 'faollashtirildi' : "to'xtatildi"}!`
      );
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Obuna holatini o'zgartirishda xatolik");
    }
  };

  const handleRenewSub = async (targetUser, months) => {
    setModalError('');
    setSavingSub(true);
    try {
      const res = await api.renewSubscription(targetUser.id, months);
      const newExp = res.subscriptionEndDate || res.subscriptionExpiresAt;
      const newDays = res.daysLeft ?? res.days_left ?? calculateCurrentDaysLeft(newExp);
      const newStatus = res.status || res.subscriptionStatus || 'active';
      const newPlan = res.plan || 'standard';

      const updatedUser = {
        ...targetUser,
        plan: newPlan,
        subscriptionExpiresAt: newExp,
        daysLeft: newDays,
        subscriptionStatus: newStatus,
      };

      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      setSuccess(`«${targetUser.fullName}» obunasi standart tarifga o'tkazilib, ${months} oyga uzaytirildi! (${fmtMoney(subscriptionPrice * months)} so'm)`);
      setSubModalUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || err.detail || "Obunani uzaytirishda xatolik");
    } finally {
      setSavingSub(false);
    }
  };

  const handleOpenShortenConfirm = (targetUser, months) => {
    const previewDate = calculateShortenDate(targetUser.subscriptionExpiresAt, months);
    const isPastOrToday = diffDays(todayKey(), previewDate) <= 0;
    setShortenConfirmData({
      user: targetUser,
      months,
      previewDate,
      isPastOrToday,
    });
  };

  const confirmShortenSub = async () => {
    if (!shortenConfirmData) return;
    const { user: targetUser, months, previewDate } = shortenConfirmData;
    setShortenConfirmData(null);
    setModalError('');
    setSavingSub(true);

    try {
      const res = await api.shortenSubscription(targetUser.id, months);
      const newExp = res.subscriptionEndDate || res.subscriptionExpiresAt || previewDate;
      const newDays = res.daysLeft ?? res.days_left ?? calculateCurrentDaysLeft(newExp);
      const newStatus = res.status || res.subscriptionStatus || 'active';
      const newPlan = res.plan || targetUser.plan;

      const updatedUser = {
        ...targetUser,
        plan: newPlan,
        subscriptionExpiresAt: newExp,
        daysLeft: newDays,
        subscriptionStatus: newStatus,
      };

      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      if (res.clamped) {
        setSuccess(`«${targetUser.fullName}» obunasi qisqartirildi. Muddat bugunga qisqartirildi.`);
      } else {
        setSuccess(`«${targetUser.fullName}» obunasi ${months} oyga qisqartirildi. Yangi muddat: ${formatUzDate(newExp)} (${newDays} kun)`);
      }
      setSubModalUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || err.detail || "Obunani qisqartirishda xatolik");
    } finally {
      setSavingSub(false);
    }
  };

  const handleOpenSubModal = (targetUser) => {
    setSubModalUser(targetUser);
    setModalError('');
    setSubForm({
      status: targetUser.subscriptionStatus || 'active',
      expiresAt: targetUser.subscriptionExpiresAt || todayKey(),
    });
  };

  const handleSaveSetDate = async (e) => {
    e.preventDefault();
    if (!subModalUser) return;
    setModalError('');

    const diff = calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt);
    if (diff < 0) {
      const isPastOrToday = diffDays(todayKey(), subForm.expiresAt) <= 0;
      const confirmMsg = isPastOrToday
        ? `Qolgan muddat 1 oydan kam. Obuna BUGUN (${formatUzDate(todayKey())}) tugaydi va kassir tizimga kira olmaydi. Davom etasizmi?`
        : `Obuna muddati ${Math.abs(diff)} kunga qisqartiriladi. Yangi tugash sanasi: ${formatUzDate(subForm.expiresAt)}. Davom etasizmi?`;
      if (!window.confirm(confirmMsg)) return;
    }

    setSavingSub(true);
    try {
      const res = await api.setSubscriptionDate(subModalUser.id, subForm.expiresAt);
      const newExp = res.subscriptionEndDate || res.subscriptionExpiresAt || subForm.expiresAt;
      const newDays = res.daysLeft ?? res.days_left ?? calculateCurrentDaysLeft(newExp);
      const newStatus = res.status || res.subscriptionStatus || 'active';
      const newPlan = res.plan || 'standard';

      const updatedUser = {
        ...subModalUser,
        plan: newPlan,
        subscriptionExpiresAt: newExp,
        daysLeft: newDays,
        subscriptionStatus: newStatus,
      };

      setUsers((prev) => prev.map((u) => (u.id === subModalUser.id ? updatedUser : u)));
      setSuccess(`«${subModalUser.fullName}» obunasi ${formatUzDate(newExp)} gacha belgilandi (${newDays} kun)`);
      setSubModalUser(null);
      await loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || err.detail || "Obuna muddatini saqlashda xatolik");
    } finally {
      setSavingSub(false);
    }
  };

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
      setError(err.message || err.detail || "Markazni saqlashda xatolik");
    } finally {
      setSavingMarkaz(false);
    }
  };

  const confirmDeleteMarkaz = async () => {
    if (!deleteMarkazTarget) return;
    try {
      await api.deleteMarkaz(deleteMarkazTarget.id);
      setSuccess("Markaz o'chirildi.");
      setDeleteMarkazTarget(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || err.detail || "Markazni o'chirishda xatolik");
      setDeleteMarkazTarget(null);
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
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink hover:border-steel/50 transition"
            >
              <span>👤</span>
              <span className="max-w-[140px] truncate">{user.fullName || 'Admin'}</span>
            </button>

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

        {/* Tariflar Bloki */}
        {tariffs.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tariffs.map((t) => (
              <div key={t.code} className="rounded-2xl border border-line bg-panel p-5">
                <div className="flex items-center justify-between">
                  <span className="font-head text-sm font-bold uppercase tracking-wider text-ink">{t.name}</span>
                  <span className="font-num text-xs font-semibold px-2.5 py-1 rounded bg-steel/10 text-steel">
                    {t.code === 'free' ? '11 kun (0 so\'m)' : `${fmtMoney(t.pricePerMonth)} so'm / oy`}
                  </span>
                </div>
                <div className="mt-2 text-xs text-mute">
                  {t.code === 'free' ? 'Har bir kassir uchun bir marta, birinchi 11 kun' : 'Standart oylik obuna'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-line bg-panel p-4 text-xs text-rust text-center font-semibold">
            ⚠️ Tariflar yuklanmadi.
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
              Standart obuna narxi: <span className="font-semibold text-ink">{fmtMoney(subscriptionPrice)} so'm / oy</span>
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
                  <th className="th py-3">Tarif / Obuna</th>
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
                        {formatPhone(u.phone)}
                      </td>

                      <td className="py-3.5 pr-4">
                        {u.centerName ? (
                          <span className="text-ink">{u.centerName}</span>
                        ) : (
                          <span className="text-xs italic text-mute">Markazsiz (Shaxsiy)</span>
                        )}
                      </td>

                      {/* Tarif va Obuna */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            {u.plan === 'free' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                                Bepul
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-moss/10 text-moss border border-moss/30">
                                Standart
                              </span>
                            )}
                          </div>
                          <SubscriptionCountdown expiresAt={u.subscriptionExpiresAt} status={u.subscriptionStatus} daysLeft={u.daysLeft} plan={u.plan} />
                          <div>
                            {(() => {
                              const isUnassigned = u.plan === 'standard' && u.subscriptionStatus === 'inactive' && (!u.subscriptionExpiresAt || diffDays(todayKey(), u.subscriptionExpiresAt) < 0);
                              if (isUnassigned) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSubModal(u)}
                                    className="text-[10px] uppercase font-semibold px-2.5 py-1 rounded bg-safety/20 text-safety hover:bg-safety/30 transition border border-safety/40"
                                  >
                                    Obuna ulash
                                  </button>
                                );
                              }
                              return (
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
                              );
                            })()}
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
                          onClick={() => setDeleteUserTarget({ id: u.id, name: u.fullName })}
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
                        onClick={() => setDeleteMarkazTarget({ id: m.id, name: m.name })}
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
            if (e.target === e.currentTarget) {
              setSubModalUser(null);
              setModalError('');
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                  {subModalUser.plan === 'free' || (subModalUser.plan === 'standard' && subModalUser.subscriptionStatus === 'inactive' && (!subModalUser.subscriptionExpiresAt || diffDays(todayKey(), subModalUser.subscriptionExpiresAt) < 0)) ? "Standart Tarifga O'tkazish" : "Obunani Boshqarish"}
                </h3>
                <p className="text-xs text-mute">
                  {subModalUser.fullName} ({formatPhone(subModalUser.phone)}) {subModalUser.plan === 'free' && <span className="text-safety font-semibold">(Bepul davr)</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubModalUser(null);
                  setModalError('');
                }}
                className="text-2xl text-mute hover:text-ink"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-rust/50 bg-rust/10 p-3 text-xs text-rust">
                ⚠️ {modalError}
              </div>
            )}

            <div className="mt-5 space-y-5">
              {/* 1) Tezkor uzaytirish / Standartga o'tkazish */}
              <div>
                <label className="mb-2 block font-head text-xs uppercase tracking-wider text-mute">
                  {subModalUser.plan === 'free' || (subModalUser.plan === 'standard' && subModalUser.subscriptionStatus === 'inactive' && (!subModalUser.subscriptionExpiresAt || diffDays(todayKey(), subModalUser.subscriptionExpiresAt) < 0)) ? "Standart Tarifga O'tkazish (Uzaytirish):" : "Tezkor Uzaytirish (Narxi bilan):"}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={savingSub || tariffs.length === 0}
                    onClick={() => handleRenewSub(subModalUser, 1)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition disabled:opacity-50"
                  >
                    <div className="font-bold text-xs text-ink">+1 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{tariffs.length > 0 ? `${fmtMoney(subscriptionPrice * 1)} so'm` : 'Narx yo\'q'}</div>
                  </button>
                  <button
                    type="button"
                    disabled={savingSub || tariffs.length === 0}
                    onClick={() => handleRenewSub(subModalUser, 3)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition disabled:opacity-50"
                  >
                    <div className="font-bold text-xs text-ink">+3 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{tariffs.length > 0 ? `${fmtMoney(subscriptionPrice * 3)} so'm` : 'Narx yo\'q'}</div>
                  </button>
                  <button
                    type="button"
                    disabled={savingSub || tariffs.length === 0}
                    onClick={() => handleRenewSub(subModalUser, 6)}
                    className="rounded-xl border border-line bg-paper p-3 text-left hover:border-safety transition disabled:opacity-50"
                  >
                    <div className="font-bold text-xs text-ink">+6 oy</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{tariffs.length > 0 ? `${fmtMoney(subscriptionPrice * 6)} so'm` : 'Narx yo\'q'}</div>
                  </button>
                  <button
                    type="button"
                    disabled={savingSub || tariffs.length === 0}
                    onClick={() => handleRenewSub(subModalUser, 12)}
                    className="rounded-xl border border-safety/50 bg-safety/10 p-3 text-left hover:bg-safety/20 transition disabled:opacity-50"
                  >
                    <div className="font-bold text-xs text-safety">+1 yil (12 oy)</div>
                    <div className="text-[11px] text-safety font-num font-semibold">{tariffs.length > 0 ? `${fmtMoney(subscriptionPrice * 12)} so'm` : 'Narx yo\'q'}</div>
                  </button>
                </div>
                {tariffs.length === 0 && (
                  <p className="mt-1 text-[11px] text-rust">⚠️ Tariflar yuklanmagani uchun uzaytirish o'chirilgan.</p>
                )}
              </div>

              {/* 2) Tezkor qisqartirish (pulsiz) - Standard active only */}
              {subModalUser.plan !== 'free' && !(subModalUser.plan === 'standard' && subModalUser.subscriptionStatus === 'inactive' && (!subModalUser.subscriptionExpiresAt || diffDays(todayKey(), subModalUser.subscriptionExpiresAt) < 0)) && (
                <div className="border-t border-line pt-4">
                  <label className="mb-2 block font-head text-xs uppercase tracking-wider text-mute">
                    Tezkor Qisqartirish (Pulsiz):
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[1, 3, 6].map((months) => (
                      <button
                        key={months}
                        type="button"
                        disabled={savingSub}
                        onClick={() => handleOpenShortenConfirm(subModalUser, months)}
                        className="rounded-xl border border-rust/40 bg-rust/10 p-3 text-left hover:bg-rust/20 transition disabled:opacity-50"
                      >
                        <div className="font-bold text-xs text-rust">-{months} oy</div>
                        <div className="text-[10px] text-mute font-num">pulsiz</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3) Aniq sana belgilash - Standard active only */}
              {subModalUser.plan !== 'free' && !(subModalUser.plan === 'standard' && subModalUser.subscriptionStatus === 'inactive' && (!subModalUser.subscriptionExpiresAt || diffDays(todayKey(), subModalUser.subscriptionExpiresAt) < 0)) && (
                <div className="border-t border-line pt-4">
                  <form onSubmit={handleSaveSetDate} className="space-y-3">
                    <label className="block font-head text-xs uppercase tracking-wider text-mute">
                      Aniq sana belgilash
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        required
                        min={todayKey()}
                        value={subForm.expiresAt}
                        onChange={(e) => {
                          setSubForm({ ...subForm, expiresAt: e.target.value });
                          setModalError('');
                        }}
                        className="field rounded-xl p-2.5 font-num text-sm text-ink bg-paper border-line w-full"
                      />

                      {/* Live Preview */}
                      {subForm.expiresAt && (
                        <div className="rounded-xl border border-line bg-paper p-3 text-xs space-y-1">
                          <div>
                            Yangi muddat: <strong className="font-num text-ink">{calculateNewDaysLeft(subForm.expiresAt)} kun qoladi</strong> ({formatUzDate(subForm.expiresAt)} da tugaydi)
                          </div>
                          <div>
                            Hozir: <span className="font-num text-ink">{calculateCurrentDaysLeft(subModalUser.subscriptionExpiresAt) < 0 ? `tugagan (${Math.abs(calculateCurrentDaysLeft(subModalUser.subscriptionExpiresAt))} kun oldin)` : `${calculateCurrentDaysLeft(subModalUser.subscriptionExpiresAt)} kun`}</span> → Keyin: <span className="font-num text-ink">{calculateNewDaysLeft(subForm.expiresAt)} kun</span>{' '}
                            <span className={calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt) < 0 ? 'font-semibold text-rust' : calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt) > 0 ? 'font-semibold text-moss' : 'text-mute'}>
                              ({calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt) === 0 ? "o'zgarmadi" : formatDiffString(calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt))})
                            </span>
                          </div>
                          {calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt) === 0 && (
                            <p className="text-[11px] text-safety italic">O'zgarish yo'q</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingSub || calculateDiffDays(subModalUser.subscriptionExpiresAt, subForm.expiresAt) === 0}
                        className="btn btn-steel rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
                      >
                        {savingSub ? 'Saqlanmoqda...' : 'Saqlash'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setSubModalUser(null);
                  setModalError('');
                }}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Qisqartirishni Tasdiqlash Modali (B1) ── */}
      {shortenConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${shortenConfirmData.isPastOrToday ? 'bg-rust/10 text-rust' : 'bg-safety/10 text-safety'}`}>
                ⚠️
              </div>
              <div>
                <h3 className="font-head text-base font-semibold uppercase text-ink">
                  Obunani Qisqartirish
                </h3>
                <p className="text-xs text-mute mt-1">
                  {shortenConfirmData.isPastOrToday ? (
                    <span className="text-rust font-medium">
                      Qolgan muddat 1 oydan kam. Obuna BUGUN ({formatUzDate(todayKey())}) tugaydi va kassir tizimga kira olmaydi. Davom etasizmi?
                    </span>
                  ) : (
                    <span>
                      Obuna {shortenConfirmData.months} oyga qisqartiriladi. Yangi tugash sanasi: {formatUzDate(shortenConfirmData.previewDate)} ({calculateNewDaysLeft(shortenConfirmData.previewDate)} kun qoladi). Davom etasizmi?
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShortenConfirmData(null)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={savingSub}
                onClick={confirmShortenSub}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {savingSub ? 'Bajarilmoqda...' : 'Tasdiqlash'}
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
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

              {/* Tarif tanlash */}
              <div>
                <label className="mb-2 block font-head text-xs uppercase tracking-wider text-mute">
                  Tarifni Tanlang <span className="text-rust">*</span>
                </label>
                {tariffs.length === 0 ? (
                  <div className="rounded-xl border border-rust/40 bg-rust/10 p-3 text-xs text-rust font-semibold">
                    ⚠️ Tariflar yuklanmadi. Kassir yaratish o'chirilgan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {tariffs.map((t) => (
                        <label
                          key={t.code}
                          onClick={() => setForm({ ...form, plan: t.code })}
                          className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
                            form.plan === t.code
                              ? 'border-steel bg-steel/10 text-ink'
                              : 'border-line bg-paper text-mute hover:border-steel/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-head text-xs font-bold uppercase">{t.name}</span>
                            <input
                              type="radio"
                              name="plan"
                              checked={form.plan === t.code}
                              onChange={() => setForm({ ...form, plan: t.code })}
                              className="accent-steel"
                            />
                          </div>
                          <span className="mt-1 font-num text-xs font-semibold text-ink">
                            {t.code === 'free' ? '11 kun, 0 so\'m' : `${fmtMoney(t.pricePerMonth || 80000)} so'm / oy`}
                          </span>
                          <span className="mt-1 text-[11px] text-mute">
                            {t.code === 'free' ? 'Har bir raqam uchun bir marta.' : 'Oylik standart obuna'}
                          </span>
                        </label>
                      ))}
                    </div>

                    {form.plan === 'standard' && (
                      <div className="space-y-2 rounded-xl border border-line bg-paper p-3.5">
                        <label className="block font-head text-xs uppercase tracking-wider text-mute">
                          Obuna Muddati (Oylar):
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { months: 1, label: '1 oy' },
                            { months: 3, label: '3 oy' },
                            { months: 6, label: '6 oy' },
                            { months: 12, label: '1 yil' },
                          ].map((item) => (
                            <button
                              key={item.months}
                              type="button"
                              onClick={() => setForm({ ...form, subscriptionMonths: item.months })}
                              className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                                form.subscriptionMonths === item.months
                                  ? 'border-safety bg-safety/20 text-safety'
                                  : 'border-line bg-panel text-ink hover:border-safety/50'
                              }`}
                            >
                              <div>{item.label}</div>
                              <div className="text-[10px] font-num text-mute">{fmtMoney(subscriptionPrice * item.months)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-xl border border-line bg-paper p-3 text-xs text-ink">
                      {form.plan === 'free' ? (
                        <span>Bepul davr tugashi: <strong className="font-num text-moss">{formatUzDate(addDaysKey(todayKey(), 11))}</strong></span>
                      ) : (
                        <span>
                          Jami: <strong className="font-num text-safety">{fmtMoney(subscriptionPrice * form.subscriptionMonths)}</strong>. Obuna tugashi:{' '}
                          <strong className="font-num text-moss">{formatUzDate(addMonthsKey(todayKey(), form.subscriptionMonths))}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}
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
                  disabled={creating || tariffs.length === 0}
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

      {/* ── Kassirni O'chirishni Tasdiqlash Modali ── */}
      {deleteUserTarget && (
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
                  Kassirni O'chirish
                </h3>
                <p className="text-xs text-mute mt-1">
                  «{deleteUserTarget.name}» kassirini o'chirishni tasdiqlaysizmi?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Ha (O'chirish)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Markazni O'chirishni Tasdiqlash Modali ── */}
      {deleteMarkazTarget && (
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
                  Markazni O'chirish
                </h3>
                <p className="text-xs text-mute mt-1">
                  «{deleteMarkazTarget.name}» markazini o'chirishni tasdiqlaysizmi?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteMarkazTarget(null)}
                className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDeleteMarkaz}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Ha (O'chirish)
              </button>
            </div>
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
