import React from 'react';

/**
 * VidTube's mark: a "V" chevron that doubles as a play cue, over a stream bar.
 * Same geometry as /favicon.svg.
 *
 * `variant="transparent"` (the default in-app) drops the backdrop and paints
 * the strokes in the brand gradient, so the mark sits cleanly on any surface
 * in either theme. `variant="badge"` keeps the filled squircle for places that
 * need a solid app icon.
 *
 * Gradient ids are suffixed per instance so multiple logos on one page can't
 * collide.
 */
export const LogoMark = ({ className = 'w-8 h-8', id = 'default', variant = 'transparent' }) => {
  const gradientId = `vt-grad-${id}`;
  const isBadge = variant === 'badge';
  const strokeColor = isBadge ? '#fff' : `url(#${gradientId})`;

  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="VidTube">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4D6D" />
          <stop offset="55%" stopColor="#FF0033" />
          <stop offset="100%" stopColor="#D1002B" />
        </linearGradient>
      </defs>

      {isBadge && <rect width="32" height="32" rx="9.5" fill={`url(#${gradientId})`} />}

      {/* The V / play chevron */}
      <path
        d="M9.5 10.75 L16 21.5 L22.5 10.75"
        fill="none"
        stroke={strokeColor}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stream bar */}
      <rect
        x="11.75"
        y="24"
        width="8.5"
        height="2.4"
        rx="1.2"
        fill={strokeColor}
        opacity={isBadge ? 0.75 : 0.85}
      />
    </svg>
  );
};

export const Logo = ({
  className = '',
  markClassName = 'w-10 h-10',
  wordmarkClassName = 'text-[22px]',
  showWordmark = true,
  id = 'default',
  variant = 'transparent',
}) => (
  // `-ml-0.5` pulls the wordmark in: the chevron leaves optical space on its
  // right, so a plain gap reads as too wide.
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <LogoMark className={`${markClassName} shrink-0`} id={id} variant={variant} />
    {showWordmark && (
      <span
        // Nudged down a few pixels so the wordmark's baseline sits slightly
        // below the centre of the mark, which reads as better balanced.
        className={`${wordmarkClassName} font-display font-bold tracking-tight text-white leading-none -ml-0.5 translate-y-[5px]`}
      >
        Vid<span className="text-brand">Tube</span>
      </span>
    )}
  </span>
);
