import { useState } from 'react';

/**
 * Kassa tizimiga kirish sahifasi.
 * Foydalanuvchi telefon raqami va parol bilan kiradi.
 * Tizim o'zi foydalanuvchi hisobini aniqlab, mos sahifaga yo'naltiradi.
 */
export default function LoginPage({ onLogin, loading, error, onBack }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(phone.trim(), password);
  };

  // Telefon raqamni formatlash: +998 XX XXX XX XX
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('998')) val = val.slice(3);
    if (val.length > 9) val = val.slice(0, 9);
    setPhone(val);
  };

  const displayPhone = phone
    ? `+998 ${phone.slice(0, 2)}${phone.length > 2 ? ' ' + phone.slice(2, 5) : ''}${phone.length > 5 ? ' ' + phone.slice(5, 7) : ''}${phone.length > 7 ? ' ' + phone.slice(7, 9) : ''}`
    : '';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      {/* Bosh sahifaga qaytish tugmasi */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-6 flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-xs font-semibold text-mute transition hover:border-steel/50 hover:text-ink"
        >
          <span>←</span> Bosh sahifaga qaytish
        </button>
      )}

      {/* Fon dekoratsiya */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-steel/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-safety/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Tizim nomi */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-steel/20 text-3xl">
            🛒
          </div>
          <h1 className="font-head text-2xl uppercase tracking-widest text-ink">
            MultiPOS Kirish
          </h1>
          <p className="mt-1 text-xs text-mute">
            Tizimga kirish uchun telefon raqam va parolingizni kiriting
          </p>
        </div>

        {/* Login kartasi */}
        <div className="rounded-2xl border border-line bg-panel p-7 shadow-2xl">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Telefon raqam */}
            <div>
              <label className="mb-1.5 block font-head text-xs uppercase tracking-wider text-mute">
                Telefon raqam
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-sm text-mute">
                  📞
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={displayPhone}
                  onChange={handlePhoneChange}
                  placeholder="+998 XX XXX XX XX"
                  autoComplete="tel"
                  autoFocus
                  required
                  className="field rounded-lg pl-9 focus:border-steel focus:outline-none"
                />
              </div>
            </div>

            {/* Parol */}
            <div>
              <label className="mb-1.5 block font-head text-xs uppercase tracking-wider text-mute">
                Parol
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-sm text-mute">
                  🔒
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  autoComplete="current-password"
                  required
                  className="field rounded-lg pl-9 pr-10 focus:border-steel focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-mute hover:text-ink"
                  aria-label={showPass ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Xato xabari */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Kirish tugmasi */}
            <button
              type="submit"
              disabled={loading || phone.length < 9 || password.length < 3}
              className="btn btn-steel w-full rounded-lg py-3 text-base disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Kirish...
                </span>
              ) : (
                'KIRISH'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-mute">
            Kirishda qiyinchilik bo'lsa, ma'muriyat bilan bog'laning.
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-mute/50">
          MultiPOS Kassa Tizimi · v1.0
        </p>
      </div>
    </div>
  );
}
