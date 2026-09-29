import { useState } from 'react';
import { api } from '../services/api';

/**
 * Profil oynasi:
 * Foydalanuvchining ma'lumotlari:
 * - Ism-familiya (readonly)
 * - Biriktirilgan markaz (readonly)
 * - Telefon raqami (tahrirlanadigan)
 * - Parol (Joriy parol va Yangi parol)
 */
export default function ProfileModal({ user, onClose, onUpdateProfile }) {
  const [phone, setPhone] = useState(user.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Telefon raqamni formatlash: 9 xona
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('998')) val = val.slice(3);
    if (val.length > 9) val = val.slice(0, 9);
    setPhone(val);
  };

  const displayPhone = phone
    ? `+998 ${phone.slice(0, 2)}${phone.length > 2 ? ' ' + phone.slice(2, 5) : ''}${phone.length > 5 ? ' ' + phone.slice(5, 7) : ''}${phone.length > 7 ? ' ' + phone.slice(7, 9) : ''}`
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (phone.length < 9) {
      setError("Telefon raqamni to'liq kiriting.");
      return;
    }

    if (newPassword.trim()) {
      if (!oldPassword.trim()) {
        setError('Joriy parolingizni kiriting.');
        return;
      }
      if (newPassword.trim().length < 3) {
        setError("Yangi parol kamida 3 ta belgidan iborat bo'lishi kerak.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        phone: phone.trim(),
        oldPassword: oldPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      };

      if (onUpdateProfile) {
        await onUpdateProfile(payload);
      } else {
        await api.updateProfile(user.id, payload);
      }

      setSuccess("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-steel/15 text-2xl text-steel">
              👤
            </div>
            <div>
              <h3 className="font-head text-lg font-bold uppercase tracking-wide text-ink">
                Foydalanuvchi Profili
              </h3>
              <p className="text-xs text-mute">Shaxsiy hisob ma'lumotlari</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="text-2xl leading-none text-mute hover:text-ink"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Readonly Ism va Markaz */}
          <div className="rounded-xl border border-line/70 bg-bg/60 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-mute font-head uppercase tracking-wider text-[11px]">Ism:</span>
              <span className="font-medium text-ink">{user.fullName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute font-head uppercase tracking-wider text-[11px]">Markaz:</span>
              <span className="font-medium text-ink">{user.centerName || '—'}</span>
            </div>
          </div>

          {/* Telefon raqam */}
          <div>
            <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
              Telefon raqami (Login)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              required
              value={displayPhone}
              onChange={handlePhoneChange}
              placeholder="+998 XX XXX XX XX"
              className="field rounded-lg"
            />
            <p className="mt-1 text-[11px] text-mute">
              Telefon raqam tizimga kirish uchun login hisoblanadi.
            </p>
          </div>

          {/* Joriy parol */}
          <div>
            <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
              Joriy parol
              <span className="ml-1 text-[10px] lowercase text-mute/70">(parol o'zgartirilganda shart)</span>
            </label>
            <div className="relative">
              <input
                type={showOldPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Joriy parolingiz"
                className="field rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPass((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-mute hover:text-ink"
              >
                {showOldPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Yangi parol */}
          <div>
            <label className="mb-1 block font-head text-xs uppercase tracking-wider text-mute">
              Yangi parol
              <span className="ml-1 text-[10px] lowercase text-mute/70">(o'zgartirish ixtiyoriy)</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Bo'sh qoldirilsa avvalgi parol qoladi"
                className="field rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPass((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-mute hover:text-ink"
              >
                {showNewPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Bildirishnomalar */}
          {error && (
            <div className="rounded-lg border border-rust/40 bg-rust/10 p-3 text-xs text-rust">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-moss/40 bg-moss/10 p-3 text-xs text-moss">
              ✅ {success}
            </div>
          )}

          {/* Tugmalar */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost rounded-lg px-4 py-2 text-xs"
            >
              Yopish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-steel rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
