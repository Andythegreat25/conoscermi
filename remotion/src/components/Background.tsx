import React from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from '../constants';
import type { BackgroundVariant } from '../slides/slideData';

const GRADIENTS: Record<BackgroundVariant, { from: string; mid: string; to: string }> = {
  warm: { from: '#fff8f0', mid: '#fdf0e0', to: '#f5dcc8' },
  sage: { from: '#f0f4ea', mid: '#e4ecda', to: '#d0dcbf' },
  terracotta: { from: '#fdf3ef', mid: '#f7e0d5', to: '#efcbb8' },
  night: { from: '#1c1a17', mid: '#201f1b', to: '#262420' },
};

const ACCENT_COLOR: Record<BackgroundVariant, string> = {
  warm: PALETTE.accent,
  sage: PALETTE.secondary,
  terracotta: PALETTE.primary,
  night: PALETTE.darkPrimary,
};

export const Background: React.FC<{ variant: BackgroundVariant }> = ({ variant }) => {
  const { from, mid, to } = GRADIENTS[variant];
  const accent = ACCENT_COLOR[variant];

  return (
    <svg
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="bg-main" x1="0%" y1="0%" x2="25%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="45%" stopColor={mid} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id="bg-radial-top" cx="78%" cy="12%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-radial-bottom" cx="18%" cy="92%" r="42%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.13" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#bg-main)" />
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#bg-radial-top)" />
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#bg-radial-bottom)" />
    </svg>
  );
};
