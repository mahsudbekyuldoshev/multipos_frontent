// Raqam va sana formatlash. Qo'lda yozilgan, shuning uchun brauzer/locale
// sozlamalariga bog'liq emas (chekda ham bir xil ko'rinadi).

const NBSP = '\u00A0';

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const groupThousands = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** 1234567 -> "1 234 567" */
export function fmtMoney(n) {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? '-' : '') + groupThousands(String(Math.abs(v)));
}

/** 1234567 -> "1 234 567 so'm" */
export const money = (n) => `${fmtMoney(n)} so'm`;

/** 340.5 -> "340,5"   1200 -> "1 200"   (ko'pi bilan 2 xona kasr) */
export function fmtQty(n) {
  const [int, frac] = String(round2(Number(n) || 0)).split('.');
  return frac ? `${groupThousands(int)},${frac}` : groupThousands(int);
}

/** "2,5" | "2.5" | "1 200" -> son. Noto'g'ri bo'lsa NaN. */
export function parseNumber(value) {
  const cleaned = String(value ?? '').replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

const pad = (n) => String(n).padStart(2, '0');

/** Mahalliy sana kaliti: 'YYYY-MM-DD' (UTC emas!) */
export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayKey = () => dateKey(new Date());

export function dateKeyOf(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateKey(d);
}

/** '2026-08-14' -> '14.08.2026' */
export function formatDate(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key ?? '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : key || '—';
}

/** Date | ISO -> '14.08.2026 15:42' (yoki soniya bilan) */
export function formatDateTime(value, withSeconds = false) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? `:${pad(d.getSeconds())}` : ''}`;
  return `${date} ${time}`;
}
