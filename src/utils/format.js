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

/** 'YYYY-MM-DD' ni mahalliy Date obyektiga aylantiradi (new Date('YYYY-MM-DD') ishlatmasdan) */
export function parseDateKey(str) {
  if (!str) return new Date();
  const parts = String(str).split('-');
  if (parts.length !== 3) return new Date(str);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return new Date(y, m - 1, d);
}

/** Ikki sana kaliti orasidagi kunlar farqi (mahalliy, Math.round bilan) */
export function diffDays(fromKey, toKey) {
  const d1 = parseDateKey(fromKey);
  const d2 = parseDateKey(toKey);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Oy qo'shish yoki ayirish, oy oxiri to'g'ri ishlashi bilan */
export function addMonthsKey(key, months) {
  const d = parseDateKey(key);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0); // oy oxiriga to'g'rilash
  }
  return dateKey(d);
}

/** Sana kalitiga N kun qo'shish */
export function addDaysKey(key, days) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** '2026-10-02' -> '2-oktabr-2026' */
export function formatUzDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return dateStr;
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${parseInt(d, 10)}-${monthName}-${y}`;
}

/** '998901234567' | '901234567' -> '+998 90 123 45 67' */
export function formatPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const last9 = digits.slice(-9);
  if (last9.length !== 9) return phone;
  const m = last9.match(/^(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return `+998 ${last9}`;
  return `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}
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
