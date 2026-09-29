// Kategoriyalar va o'lchov birliklari.
// Backend ulanganda bu ro'yxatlar /categories va /units endpointlaridan kelishi mumkin.

export const CATEGORIES = [
  { key: 'qurilish', label: 'Qurilish', icon: '🧱', accent: '#4E97C4' },
  { key: 'elektrika', label: 'Elektrika', icon: '🔌', accent: '#E8B23B' },
  { key: 'santexnika', label: 'Santexnika', icon: '🚰', accent: '#3FB6AE' },
  { key: 'avto', label: 'Avto-detal', icon: '🚗', accent: '#C9564B' },
];

let customCategories = null;

export function getActiveCategories() {
  return customCategories || CATEGORIES;
}

export function setActiveCategories(list) {
  if (Array.isArray(list) && list.length > 0) {
    customCategories = list;
  }
}

// fractional: true  -> kasr son bilan sotiladi (1,5 metr, 0,75 kg)
// fractional: false -> faqat butun son (3 dona, 2 quti)
export const UNITS = [
  { key: 'dona', fractional: false },
  { key: 'metr', fractional: true },
  { key: 'kg', fractional: true },
  { key: 'litr', fractional: true },
  { key: 'quti', fractional: false },
  { key: 'quop', fractional: false },
  { key: 'rulon', fractional: false },
];

export function getCategory(key) {
  const list = getActiveCategories();
  return (
    list.find((c) => c.key === key) ?? {
      key,
      label: key,
      icon: '📦',
      accent: '#888888',
    }
  );
}

export function getUnit(key) {
  return UNITS.find((u) => u.key === key) ?? { key, fractional: true };
}
