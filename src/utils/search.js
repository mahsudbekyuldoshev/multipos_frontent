import { isOut } from './stock';

/** Kichik harf + turli apostroflarni bitta ko'rinishga keltiradi (g‘isht = g'isht). */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BB\u02BC`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const tokensOf = (query) => normalize(query).split(' ').filter(Boolean);

/** Qidiruv so'zlarining hammasi nom yoki artikulda bo'lsa true. Bo'sh so'rov — hammasi mos. */
export function matchesQuery(product, query) {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return true;
  const haystack = `${normalize(product.name)} ${normalize(product.sku)}`;
  return tokens.every((t) => haystack.includes(t));
}

/**
 * Kassa uchun aqlli qidiruv:
 *  - bir nechta so'z (masalan "kabel 2.5") — hammasi mos kelishi kerak
 *  - artikul aniq mos kelsa (shtrix-kod skaner) — eng tepada
 *  - nomi so'rovdan boshlansa — yuqoriroq
 *  - omborda tugaganlar — pastroqda
 */
export function searchProducts(products, query, { category = 'all', limit = 8 } = {}) {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return [];
  const whole = tokens.join(' ');

  const scored = [];
  for (const p of products) {
    if (category !== 'all' && p.category !== category) continue;
    if (!matchesQuery(p, whole)) continue;

    const name = normalize(p.name);
    let score = 0;
    if (normalize(p.sku) === whole) score += 100;
    if (name.startsWith(tokens[0])) score += 10;
    else if (name.split(' ').some((w) => w.startsWith(tokens[0]))) score += 5;
    if (isOut(p)) score -= 20;
    scored.push({ p, score });
  }

  scored.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name, 'uz'));
  return scored.slice(0, limit).map((s) => s.p);
}
