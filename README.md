# Mustahkam — Kassa (POS) va Ombor boshqaruvi

React + Vite + Tailwind CSS. Qurilish mollari, elektrika, santexnika va avto-detal do'koni uchun.

## Ishga tushirish

Node.js 18 yoki yangiroq kerak (`node -v` bilan tekshiring).

```powershell
npm install
npm run dev
```

Brauzerda: http://localhost:5173

Boshqa buyruqlar: `npm run build` (production yig'ish), `npm run preview` (yig'ilganini ko'rish).

## Struktura

```
src/
├─ App.jsx                  Asosiy sahifa: tablar (Kassa / Ombor), savat, chek
├─ components/
│  ├─ Kassa.jsx             Qidiruv, savat, "Ombor holati" jadvali
│  ├─ Ombor.jsx             Mahsulotlar ro'yxati, qoldiqlar, qo'shish/tahrirlash/o'chirish
│  ├─ ChekModal.jsx         Chek oynasi + window.print()
│  ├─ ProductModal.jsx      Mahsulot formasi
│  ├─ QtyModal.jsx          Savatga qo'shishdan oldin miqdor so'rash
│  └─ Header, Modal, QtyInput, CategoryChips, Badges
├─ hooks/                   useProducts, useSales, useCart, useLocalStorage
├─ services/
│  ├─ api.js                UI faqat shu obyekt bilan ishlaydi
│  ├─ localDriver.js        localStorage (hozirgi holat)
│  └─ httpDriver.js         REST API (kelajak uchun tayyor)
├─ data/                    Kategoriyalar, birliklar, demo mahsulotlar
└─ utils/                   Formatlash, qidiruv, qoldiq tekshiruvi
```

## Kassada tezkor ishlash

- Qidiruv maydoni ochilishi bilan tayyor turadi. `↑` `↓` — tanlash, `Enter` — miqdor so'rash, `Esc` — tozalash.
- Artikulni aniq yozib (yoki shtrix-kod skaner bilan) `Enter` bosilsa, shu mahsulot birinchi bo'lib chiqadi.
- Miqdorda `2,5` ham, `2.5` ham yoziladi. Metr, kg, litr — kasr bilan; dona, quti, quop, rulon — faqat butun son.
- "Sotishni yakunlash" bosilganda qoldiq kamayadi, chek ochiladi va chop etish oynasi chiqadi.

## Backendga ulash

Ma'lumotlar hozir brauzer `localStorage`'ida turadi. Backend tayyor bo'lganda UI'ni o'zgartirmasdan ulanadi:

1. `.env.example` ni `.env.local` ga nusxalang va `VITE_USE_API=true` qiling.
2. `VITE_API_URL` ga backend manzilini yozing (yoki `vite.config.js` dagi `proxy` ni yoqing).
3. Backend `src/services/httpDriver.js` boshida yozilgan endpointlarni berishi kerak.

`POST /sales` da UI faqat `{ items: [{ productId, quantity }] }` yuboradi. Narxni, qoldiq tekshiruvini,
qoldiqni kamaytirishni va chek raqamini server o'zi bajarishi kerak.

## Demo ma'lumotlarni tiklash

Brauzerda F12 → Application → Local Storage → `multipos:` bilan boshlanuvchi kalitlarni o'chirib, sahifani yangilang.
