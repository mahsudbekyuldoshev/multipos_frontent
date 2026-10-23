/**
 * PremiumLogo — Premium.uz brend logotipi
 *
 * Props:
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *   badge: boolean (default: true) — "KASSA & OMBOR" nishonini ko'rsatish
 *   iconOnly: boolean (default: false) — faqat 3D oltin P kvadratini ko'rsatish
 *   className: tashqi wrapper uchun CSS klasslar
 */
export default function PremiumLogo({
  size = 'md',
  badge = true,
  iconOnly = false,
  className = '',
  alt = 'Premium — Kassa & Ombor',
}) {
  const heights = {
    xs: 'h-8',       // 32px
    sm: 'h-10',      // 40px
    md: 'h-[50px]',  // 50px — sarlavhalar va header bilan mukammal mos
    lg: 'h-16',      // 64px
    xl: 'h-20',      // 80px
    '2xl': 'h-24',   // 96px
  };

  const hClass = heights[size] || heights.md;

  // Cache-busting (?v=3) yangilangan toza rasmlar darhol yuklanishi uchun
  let src = '/logo-full.webp?v=3';
  let fallbackSrc = '/logo-full.png?v=3';

  if (iconOnly) {
    src = '/logo-icon.webp?v=3';
    fallbackSrc = '/logo-icon.png?v=3';
  } else if (!badge) {
    src = '/logo-no-badge.webp?v=3';
    fallbackSrc = '/logo-no-badge.png?v=3';
  }

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <picture className="inline-flex items-center">
        <source srcSet={src} type="image/webp" />
        <img
          src={fallbackSrc}
          alt={alt}
          className={`${hClass} w-auto max-w-full object-contain transition-all duration-200 hover:brightness-105`}
          style={{ imageRendering: 'auto' }}
          loading="eager"
          decoding="sync"
        />
      </picture>
    </div>
  );
}
