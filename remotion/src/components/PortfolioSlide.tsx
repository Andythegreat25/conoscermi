import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background } from './Background';
import { IPhoneMockup } from './IPhoneMockup';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  PALETTE, FONT_FAMILY, MOCKUP,
} from '../constants';
import type { SlideConfig } from '../slides/slideData';

interface PortfolioSlideProps {
  slide: SlideConfig;
}

const TEXT_COLORS: Record<string, { headline: string; sub: string; brand: string }> = {
  warm:        { headline: '#7a3e2a', sub: '#a0746a', brand: 'rgba(140,78,55,0.30)' },
  sage:        { headline: '#3d4e2e', sub: '#6b7e5a', brand: 'rgba(86,99,66,0.28)' },
  terracotta:  { headline: '#7a3e2a', sub: '#a0746a', brand: 'rgba(140,78,55,0.28)' },
  night:       { headline: '#ffb59d', sub: 'rgba(255,181,157,0.60)', brand: 'rgba(255,181,157,0.22)' },
};

export const PortfolioSlide: React.FC<PortfolioSlideProps> = ({ slide }) => {
  const colors = TEXT_COLORS[slide.backgroundVariant];

  const PHONE_CENTER_X = CANVAS_WIDTH / 2;
  const FRAME_H = MOCKUP.frameHeight;
  const FRAME_W = MOCKUP.frameWidth;

  // Phone center Y depending on text position
  const PHONE_CENTER_Y_BELOW = 1180;
  const PHONE_CENTER_Y_ABOVE = 1650;
  const phoneCenterY = slide.textPosition === 'below'
    ? PHONE_CENTER_Y_BELOW
    : PHONE_CENTER_Y_ABOVE;

  const phoneTop    = phoneCenterY - FRAME_H / 2;
  const phoneBottom = phoneCenterY + FRAME_H / 2;

  // Shadow offset for the phone
  const shadowBlur = 120;

  return (
    <AbsoluteFill style={{ background: 'transparent', fontFamily: FONT_FAMILY }}>
      {/* 1. Background */}
      <Background variant={slide.backgroundVariant} />

      {/* 2. Phone drop shadow (SVG ellipse behind the frame) */}
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <radialGradient id="phone-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={PHONE_CENTER_X}
          cy={phoneCenterY}
          rx={FRAME_W / 2 + shadowBlur}
          ry={FRAME_H / 2 + shadowBlur * 0.4}
          fill="url(#phone-shadow)"
        />
        {/* 3. iPhone mockup */}
        <IPhoneMockup
          screenshotFile={slide.imageFile}
          centerX={PHONE_CENTER_X}
          centerY={phoneCenterY}
          overlays={slide.overlays}
        />
      </svg>

      {/* 4. Text block */}
      {slide.textPosition === 'below' ? (
        <div
          style={{
            position: 'absolute',
            left: 90,
            right: 90,
            top: phoneBottom + 70,
            bottom: 160,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            textAlign: 'center',
            gap: 32,
          }}
        >
          <TextBlock
            headline={slide.headline}
            subheadline={slide.subheadline}
            headlineColor={colors.headline}
            subColor={colors.sub}
          />
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 90,
            right: 90,
            top: 130,
            bottom: CANVAS_HEIGHT - phoneTop + 70,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            textAlign: 'center',
            gap: 32,
          }}
        >
          <TextBlock
            headline={slide.headline}
            subheadline={slide.subheadline}
            headlineColor={colors.headline}
            subColor={colors.sub}
          />
        </div>
      )}

      {/* 5. Brand badge */}
      <div
        style={{
          position: 'absolute',
          ...(slide.textPosition === 'below' ? { bottom: 72 } : { top: 72 }),
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: colors.brand,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.30em',
            textTransform: 'uppercase' as const,
          }}
        >
          Conoscermi
        </span>
      </div>
    </AbsoluteFill>
  );
};

const TextBlock: React.FC<{
  headline: string;
  subheadline: string;
  headlineColor: string;
  subColor: string;
}> = ({ headline, subheadline, headlineColor, subColor }) => (
  <>
    <div
      style={{
        fontSize: 84,
        fontWeight: 800,
        color: headlineColor,
        lineHeight: 1.06,
        letterSpacing: '-0.025em',
        whiteSpace: 'pre-line',
      }}
    >
      {headline}
    </div>
    <div
      style={{
        fontSize: 44,
        fontWeight: 400,
        color: subColor,
        lineHeight: 1.45,
        letterSpacing: '-0.01em',
        maxWidth: 980,
      }}
    >
      {subheadline}
    </div>
  </>
);
