import { useState } from 'react';
import { api } from '../services/api';

export default function HomePage({ onGoLogin }) {
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await api.submitContactMessage({
        name: contactForm.name,
        phone: contactForm.phone,
        message: contactForm.message,
      });
      setStatus('success');
      setContactForm({ name: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || "Xatolik yuz berdi. Keyinroq urinib ko'ring.");
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ── Yuqori Navigatsiya ── */}
      <header className="sticky top-0 z-30 border-b border-line bg-panel/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel font-head text-xl font-bold text-onaccent">
              M
            </div>
            <div>
              <span className="font-head text-xl font-bold uppercase tracking-wider text-ink">
                MultiPOS
              </span>
              <span className="ml-2 rounded border border-steel/40 bg-steel/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-steel">
                Kassa & Ombor
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-semibold text-ink transition hover:text-steel"
            >
              Bosh sahifa
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-sm text-mute transition hover:text-ink"
            >
              Loyiha haqida
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-sm text-mute transition hover:text-ink"
            >
              Imkoniyatlar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-semibold text-safety transition hover:text-safety-dark"
            >
              Tarif (80 000 so'm)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-sm text-mute transition hover:text-ink"
            >
              Bog'lanish
            </button>
          </nav>

          <button
            type="button"
            onClick={onGoLogin}
            className="btn btn-steel rounded-lg px-5 py-2 text-xs shadow-lg transition hover:scale-105"
          >
            Tizimga kirish ➔
          </button>
        </div>
      </header>

      {/* ── Hero Bo'limi ── */}
      <section className="relative overflow-hidden border-b border-line py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-steel/15 blur-3xl" />
          <div className="absolute -right-20 top-40 h-96 w-96 rounded-full bg-safety/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-steel/30 bg-steel/10 px-4 py-1.5 text-xs font-semibold text-steel">
            <span>🚀</span> Savdoni yangi bosqichga olib chiqing
          </div>
          <h1 className="font-head text-4xl font-extrabold uppercase tracking-wide text-ink sm:text-5xl md:text-6xl">
            Do'kon va Savdo Markazlari uchun <span className="text-steel">Aqlli Kassa Tizimi</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mute md:text-lg">
            MultiPOS — bu qurilish mollari, santexnika, elektrika va avto-detallar chakana savdosi, ombor qoldig'i hisobi, tezkor chek chiqarish hamda
            keng qamrovli tushum analitikasini bitta qulay platformada birlashtirgan avtomatlashtirilgan tizim.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onGoLogin}
              className="btn btn-steel rounded-xl px-7 py-3.5 text-sm shadow-xl transition hover:scale-105"
            >
              Kassaga kirish ➔
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="btn rounded-xl border border-safety/40 bg-safety/10 px-7 py-3.5 text-sm text-safety transition hover:bg-safety/20"
            >
              Oylik obuna (80 000 so'm)
            </button>
          </div>

          {/* Vizual kichik ma'lumotlar ko'rgazmasi */}
          <div className="mt-14 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <div className="font-num text-2xl font-bold text-steel">0.5 sek</div>
              <div className="mt-1 text-xs text-mute">Tezkor chek chiqarish</div>
            </div>
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <div className="font-num text-2xl font-bold text-safety">100%</div>
              <div className="mt-1 text-xs text-mute">Ombor hisobi aniqligi</div>
            </div>
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <div className="font-num text-2xl font-bold text-moss">4 davr</div>
              <div className="mt-1 text-xs text-mute">Kun/Hafta/Oy/Yil tahlili</div>
            </div>
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <div className="font-num text-2xl font-bold text-ink">80 000 so'm</div>
              <div className="mt-1 text-xs text-mute">Hamyonbop oylik obuna</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Loyiha haqida (About) ── */}
      <section id="about" className="border-b border-line bg-panel/40 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <h2 className="font-head text-xs uppercase tracking-widest text-steel">Loyiha haqida</h2>
            <h3 className="mt-2 font-head text-3xl font-bold uppercase tracking-wide text-ink">
              MultiPOS nima va u qanday foyda beradi?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-mute">
              Ushbu tizim qurilish mollari, santexnika va elektrika savdo markazlari hamda do'konlari ishini maksimal darajada soddalashtirish,
              savdoni tezlashtirish va mahsulot kamomadini oldini olish maqsadida yaratilgan.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-paper p-6 transition hover:border-steel/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-steel/10 text-2xl text-steel">
                🛍️
              </div>
              <h4 className="font-head text-lg font-semibold uppercase text-ink">Tezkor Savdo Nuqtasi</h4>
              <p className="mt-2 text-xs leading-relaxed text-mute">
                Kassir qidirish, filtr yoki artikul orqali tovarlarni bir necha soniyada savatga soladi,
                chegirma va miqdorlarni (metr, kg, litr, dona) qulay belgilaydi va avtomatik ravishda to'liq chek chop etadi.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6 transition hover:border-safety/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-safety/10 text-2xl text-safety">
                📦
              </div>
              <h4 className="font-head text-lg font-semibold uppercase text-ink">Real Vaqt Ombori</h4>
              <p className="mt-2 text-xs leading-relaxed text-mute">
                Har bir sotuvdan so'ng ombor qoldig'i avtomatik kamayadi. Qoldiq belgilangan minimumdan tushganda
                qizil indikator orqali zudlik bilan xabardor qiladi.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6 transition hover:border-moss/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-moss/10 text-2xl text-moss">
                📈
              </div>
              <h4 className="font-head text-lg font-semibold uppercase text-ink">Moliyaviy Nazorat</h4>
              <p className="mt-2 text-xs leading-relaxed text-mute">
                Savdo markazi rahbari kunlik tushum, sotilgan tovarlar soni va daromadni
                interaktiv grafiklar orqali bir qarashda ko'ra oladi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Imkoniyatlar (Features) ── */}
      <section id="features" className="border-b border-line py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <h2 className="font-head text-xs uppercase tracking-widest text-safety">Imkoniyatlar</h2>
            <h3 className="mt-2 font-head text-3xl font-bold uppercase tracking-wide text-ink">
              MultiPOS Tizimining Asosiy Funksiyalari
            </h3>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-line bg-panel p-5">
              <span className="text-2xl">🧾</span>
              <div>
                <h4 className="font-head text-base font-semibold uppercase text-ink">
                  Standart 80mm Chek Chop Etish
                </h4>
                <p className="mt-1 text-xs text-mute">
                  Termoprinterlarga mos 80mm qog'oz formatida barcha tovarlar, bo'limlar va jami summalar bilan to'liq chek chiqadi.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-line bg-panel p-5">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-head text-base font-semibold uppercase text-ink">
                  Grafik Tahlil (Chart)
                </h4>
                <p className="mt-1 text-xs text-mute">
                  Kunlik, haftalik, oylik va yillik tushum, cheklar soni va sotilgan dona mahsulotlarni qulay solishtirish.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-line bg-panel p-5">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-head text-base font-semibold uppercase text-ink">
                  Kassirlar Uchun Shaxsiy Kirish
                </h4>
                <p className="mt-1 text-xs text-mute">
                  Telefon raqam va maxfiy parol orqali tizimga xavfsiz kirish. Tasodifiy chiqib ketishlarning oldini oluvchi tasdiqlash oynasi.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-line bg-panel p-5">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-head text-base font-semibold uppercase text-ink">
                  Ofline va Online Rejimlar
                </h4>
                <p className="mt-1 text-xs text-mute">
                  Internet uzilgan taqdirda ham brauzer keshida uzluksiz ishlash, keyinchalik backend bilan sinxronlash imkoniyati.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Oylik Obuna va Narxlar (Pricing) ── */}
      <section id="pricing" className="border-b border-line bg-panel/50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <span className="rounded-full border border-safety/40 bg-safety/10 px-3.5 py-1 text-xs font-semibold text-safety uppercase tracking-wider">
              Hamyonbop Tarif
            </span>
            <h2 className="mt-3 font-head text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
              Oylik Obuna Rejasi
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-mute">
              Hech qanday yashirin to'lovlarsiz, to'liq funksional kassa va ombor tizimiga ega bo'ling.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-md">
            <div className="relative rounded-3xl border-2 border-safety/60 bg-paper p-8 shadow-2xl transition hover:border-safety">
              <div className="absolute -top-3.5 right-8 rounded-full bg-safety px-3.5 py-0.5 text-xs font-bold uppercase tracking-wider text-onaccent shadow">
                Standart Paket
              </div>

              <div className="text-left">
                <h3 className="font-head text-xl font-bold uppercase text-ink">MultiPOS To'liq Versiya</h3>
                <p className="mt-1 text-xs text-mute">Barcha savdo va ombor imkoniyatlari kiritilgan</p>
              </div>

              <div className="my-6 border-b border-line pb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-num text-4xl font-extrabold text-safety">80 000</span>
                  <span className="text-base text-mute">so'm / oy</span>
                </div>
                <p className="mt-1 text-xs text-mute">Istalgan paytda to'xtatish yoki yangilash mumkin</p>
              </div>

              {/* Nimalar qila olishi (Imkoniyatlar) */}
              <div className="space-y-3.5 text-xs text-ink/90">
                <div className="font-head text-xs uppercase tracking-wider text-mute mb-2">
                  Tarif ichida nimalar mavjud:
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Cheksiz savdo va cheklar:</strong> Chek chiqarishda hech qanday limit yo'q</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>80mm Standart Termo Chek:</strong> Qog'ozni to'liq qoplovchi professional chek</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Aqlli Ombor Hisobi:</strong> Mahsulot qoldig'ini avtomatik kamaytirish va hisoblash</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Kam qolgan tovarlar nazorati:</strong> Qoldiq tugaganda qizil belgi bilan darhol ogohlantirish</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>4 davrli Grafik Tahlil:</strong> Kunlik, haftalik, oylik va yillik tushum diagrammalari</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Savdo markazlari hisobi:</strong> Bir nechta savdo markazi yoki filiallar uchun mustaqil ishlash</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Xodimlar kabineti & Profil:</strong> Telefon raqam va parolni o'zgartirish imkoniyati</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>Oflayn rejimda ishlash:</strong> Internet uzilsa ham savdo to'xtab qolmaydi</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-moss font-bold text-sm">✓</span>
                  <span><strong>24/7 Qo'llab-quvvatlash:</strong> Texnik xizmat va tizim yangilanishlari</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  className="btn btn-safety w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg transition hover:scale-105"
                >
                  Obunani faollashtirish ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bog'lanish (Contact) ── */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <h2 className="font-head text-xs uppercase tracking-widest text-moss">Aloqa</h2>
            <h3 className="mt-2 font-head text-3xl font-bold uppercase tracking-wide text-ink">
              Biz Bilan Bog'laning
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-mute">
              Tizimni o'rnatish, obunani faollashtirish yoki savollar bo'yicha biz bilan bog'laning.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Aloqa ma'lumotlari */}
            <div className="space-y-4 rounded-2xl border border-line bg-panel p-6">
              <h4 className="font-head text-lg font-semibold uppercase text-ink">Bog'lanish Ma'lumotlari</h4>
              <p className="text-xs text-mute">
                Tezkor ulanish va ma'lumot olish uchun quyidagi kontaktlardan foydalaning:
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10 text-lg text-steel">
                    📞
                  </div>
                  <div>
                    <div className="text-xs text-mute">Telefon raqam</div>
                    <a href="tel:+998901234567" className="font-num font-semibold hover:text-steel">
                      +998 (90) 123-45-67
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10 text-lg text-steel">
                    💬
                  </div>
                  <div>
                    <div className="text-xs text-mute">Telegram qo'llab-quvvatlash</div>
                    <a href="https://t.me/" target="_blank" rel="noreferrer" className="font-semibold hover:text-steel">
                      @MultiPOS_Support
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10 text-lg text-steel">
                    📍
                  </div>
                  <div>
                    <div className="text-xs text-mute">Manzil</div>
                    <div className="font-semibold">Toshkent shahri, O'zbekiston</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10 text-lg text-steel">
                    🕒
                  </div>
                  <div>
                    <div className="text-xs text-mute">Ish vaqti</div>
                    <div className="font-semibold">Har kuni 08:00 dan 22:00 gacha</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="btn btn-steel w-full rounded-xl py-3 text-xs"
                >
                  Kassa tizimiga o'tish ➔
                </button>
              </div>
            </div>

            {/* Xabar yuborish formasi */}
            <div className="rounded-2xl border border-line bg-panel p-6">
              <h4 className="font-head text-lg font-semibold uppercase text-ink">Xabar qoldirish</h4>
              <p className="mt-1 text-xs text-mute">
                Savollaringiz bo'lsa formani to'ldiring, biz siz bilan tezda bog'lanamiz.
              </p>

              {status === 'success' && (
                <div className="mt-4 rounded-xl border border-moss/50 bg-moss/10 p-4 text-center text-moss text-xs font-semibold">
                  Xabaringiz yuborildi, tez orada bog'lanamiz!
                </div>
              )}

              {status === 'error' && (
                <div className="mt-4 rounded-xl border border-rust/50 bg-rust/10 p-4 text-center text-rust text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block font-head text-xs uppercase tracking-wide text-mute">
                    Ismingiz
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Azizbek"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="field rounded-lg"
                    disabled={status === 'sending'}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-head text-xs uppercase tracking-wide text-mute">
                    Telefon raqamingiz
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="field rounded-lg"
                    disabled={status === 'sending'}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-head text-xs uppercase tracking-wide text-mute">
                    Xabar yoki savol
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qo'shimcha ma'lumot yoki taklif..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="field rounded-lg"
                    disabled={status === 'sending'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn btn-steel w-full rounded-xl py-3 text-xs disabled:opacity-50"
                >
                  {status === 'sending' ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line bg-panel/80 py-8 text-center text-xs text-mute">
        <div className="mx-auto max-w-5xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-steel text-xs font-bold text-onaccent">
              M
            </span>
            <span className="font-head text-sm font-semibold uppercase text-ink">MultiPOS</span>
            <span>— Kassa va Savdo Avtomatlashtirish</span>
          </div>
          <div>© {new Date().getFullYear()} MultiPOS. Barcha huquqlar himoyalangan.</div>
        </div>
      </footer>
    </div>
  );
}
