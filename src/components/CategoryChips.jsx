import { getActiveCategories } from '../data/catalog';

const ALL = { key: 'all', label: 'Barchasi', icon: '◆' };

export default function CategoryChips({ value, onChange, children }) {
  const categories = getActiveCategories();
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kategoriyalar">
      {[ALL, ...categories].map((c) => (
        <button
          key={c.key}
          type="button"
          aria-pressed={value === c.key}
          onClick={() => onChange(c.key)}
          className={`chip ${value === c.key ? 'chip-active' : ''}`}
        >
          {c.icon} {c.label}
        </button>
      ))}
      {children}
    </div>
  );
}
