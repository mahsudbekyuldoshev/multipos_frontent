import { useEffect, useState } from 'react';
import { money, formatDateTime } from '../utils/format';

const TABS = [
  { key: 'kassa', label: 'Kassa' },
  { key: 'ombor', label: 'Ombor boshqaruvi' },
];

// Alohida komponent: har soniyada faqat shu qism qayta chiziladi, butun ilova emas
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <div className="font-num text-xs text-mute">{formatDateTime(now, true)}</div>;
}

export default function Header({
  storeName,
  onStoreNameChange,
  tab,
  onTabChange,
  salesCount,
  salesSum,
  user,
  onLogout,
  onOpenProfile,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-panel">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center bg-steel font-head text-lg text-onaccent"
            >
              M
            </div>
            <div>
              <div className="grid w-fit max-w-full">
                {/* Ko'rinmas nusxa matn kengligini belgilaydi, input shu kenglikni oladi */}
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 whitespace-pre font-head text-xl font-semibold tracking-wide"
                >
                  {storeName || ' '}
                </span>
                <input
                  aria-label="Do'kon nomi"
                  value={storeName}
                  onChange={(e) => onStoreNameChange(e.target.value)}
                  className="col-start-1 row-start-1 w-full min-w-0 bg-transparent p-0 font-head text-xl font-semibold tracking-wide focus:underline focus:outline-none"
                />
              </div>
              <Clock />
            </div>
          </div>

          <nav role="tablist" aria-label="Bo'limlar" className="flex items-center gap-5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => onTabChange(t.key)}
                className={`tab ${tab === t.key ? 'tab-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5 font-num text-sm">
            <div className="text-right">
              <div className="text-xs text-mute">Bugungi savdo</div>
              <div className="font-semibold">{salesCount} ta chek</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-mute">Bugungi tushum</div>
              <div className="font-semibold">{money(salesSum)}</div>
            </div>

            {/* Foydalanuvchi profili va tizimdan chiqish */}
            {user && (
              <div className="flex items-center gap-2 border-l border-line pl-5">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title="Profilni ko'rish va tahrirlash"
                  className="group flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-left transition hover:border-steel/50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-steel/10 text-sm text-steel">
                    👤
                  </span>
                  <div>
                    <div className="max-w-[130px] truncate text-xs font-semibold text-ink group-hover:text-steel">
                      {user.fullName || user.name || 'Kassir'}
                    </div>
                    <div className="text-[10px] text-mute truncate max-w-[130px]">
                      {user.centerName || 'Profil'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Tizimdan chiqish"
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mute transition-colors hover:border-rust/50 hover:bg-rust/10 hover:text-rust"
                  aria-label="Tizimdan chiqish"
                >
                  ⏻
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chiqishni tasdiqlash modali (bir bosganda chiqib ketmaydi) */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
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
                <p className="text-xs text-mute">Kassa tizimidan chiqishni xohlaysizmi?</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-mute">
              Chiqishdan so'ng bosh sahifaga o'tasiz. Qayta kirish uchun telefon raqam va parolingiz kerak bo'ladi.
            </p>

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
                onClick={handleConfirmLogout}
                className="btn bg-rust text-onaccent hover:bg-rust/90 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Ha (Chiqish)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
