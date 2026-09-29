// crypto.randomUUID faqat xavfsiz kontekstda (https yoki localhost) bor,
// shuning uchun oddiy zaxira variant ham qoldirilgan.
export function makeId(prefix = '') {
  const raw =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw}` : raw;
}
