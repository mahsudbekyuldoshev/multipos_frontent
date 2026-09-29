import { useEffect, useId } from 'react';

/** Umumiy modal oyna: Esc va fon ustiga bosish bilan yopiladi. */
export default function Modal({ title, onClose, maxWidth = 'max-w-md', children }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[calc(100vh-2rem)] w-full ${maxWidth} overflow-y-auto border border-line bg-paper p-5`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="font-head text-lg uppercase tracking-wide">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="text-2xl leading-none text-mute hover:text-ink"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
