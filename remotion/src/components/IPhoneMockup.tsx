import React from 'react';
import { staticFile } from 'remotion';
import { MOCKUP } from '../constants';

// ── Overlay types ─────────────────────────────────────────────────────────────

export interface AvatarOverlay {
  kind: 'avatar';
  x: number; y: number;
  size: number;
  shape: 'circle' | 'rounded-rect';
}

export interface DiaryCardOverlay {
  kind: 'diary-card';
  x: number; y: number;
  width: number; height: number;
}

export interface NoteOverlay {
  kind: 'note';
  x: number; y: number;
  width: number; height: number;
  text: string;
}

export interface BlockOverlay {
  kind: 'block';
  x: number; y: number;
  width: number; height: number;
  fill?: string;
}

export type Overlay = AvatarOverlay | DiaryCardOverlay | NoteOverlay | BlockOverlay;

// ── Avatar placeholder ────────────────────────────────────────────────────────

const AvatarPlaceholder: React.FC<{
  x: number; y: number; size: number; shape: 'circle' | 'rounded-rect';
}> = ({ x, y, size, shape }) => {
  const r = size / 2;
  const head = size * 0.28;
  const headCY = y + size * 0.38;
  const bodyW = size * 0.54;
  const bodyY = y + size * 0.60;
  const bodyH = size * 0.30;
  const cx = x + size / 2;

  return (
    <g>
      {shape === 'circle' ? (
        <circle cx={x + r} cy={y + r} r={r} fill="#232120" />
      ) : (
        <rect x={x} y={y} width={size} height={size} rx={size * 0.20} fill="#232120" />
      )}
      {/* head */}
      <circle cx={cx} cy={headCY} r={head} fill="#4a4440" />
      {/* shoulders */}
      <path
        d={`M ${cx - bodyW / 2} ${bodyY + bodyH}
            Q ${cx - bodyW / 2} ${bodyY} ${cx} ${bodyY}
            Q ${cx + bodyW / 2} ${bodyY} ${cx + bodyW / 2} ${bodyY + bodyH}
            Z`}
        fill="#4a4440"
      />
    </g>
  );
};

// ── Diary card mock ───────────────────────────────────────────────────────────

const DiaryCardMock: React.FC<{
  sx: number; sy: number;
  x: number; y: number; width: number; height: number;
  clipId: string;
}> = ({ sx, sy, x, y, width, height, clipId }) => {
  const absX = sx + x;
  const absY = sy + y;

  return (
    <g clipPath={`url(#${clipId})`}>
      {/* Erase the full screen width strip */}
      <rect x={sx} y={absY} width={762} height={height} fill="#161410" />

      <foreignObject x={absX} y={absY} width={width} height={height}>
        <div
          // @ts-ignore
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontFamily: 'system-ui, sans-serif',
            background: '#242018',
            borderRadius: 20,
            padding: '30px 28px',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* emotion badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#3a3028', borderRadius: 8, padding: '6px 14px',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#ffb59d', letterSpacing: '0.06em' }}>
              FORTE
            </span>
            <span style={{ fontSize: 14, color: '#7a6e68', marginLeft: 8 }}>14:30</span>
          </div>

          <p style={{ margin: 0, fontSize: 24, lineHeight: 1.55, color: '#e0d8d0', fontWeight: 400 }}>
            Oggi mi sono sentito davvero in pace con me stesso.
            Ho capito quanto valga la pena fermarsi e ascoltarsi.
            Ogni piccolo passo conta.
          </p>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #2e2b28' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🌙</span>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', color: '#8bd3cc' }}>
                SERA
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 21, fontStyle: 'italic', color: '#9a908a', lineHeight: 1.5 }}>
              Sto imparando a riconoscere cosa mi rende felice davvero.
              La crescita è silenziosa ma costante...
            </p>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

// ── Note overlay (replaces personal text in a card) ───────────────────────────

const NoteMock: React.FC<{
  sx: number; sy: number;
  x: number; y: number; width: number; height: number;
  text: string;
  clipId: string;
}> = ({ sx, sy, x, y, width, height, text, clipId }) => {
  const absX = sx + x;
  const absY = sy + y;

  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x={absX} y={absY} width={width} height={height} fill="#1e1c18" rx={14} />
      <foreignObject x={absX + 16} y={absY + 14} width={width - 32} height={height - 28}>
        <p
          // @ts-ignore
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            margin: 0, fontFamily: 'system-ui, sans-serif',
            fontSize: 22, fontStyle: 'italic',
            color: '#9a908a', lineHeight: 1.45,
          }}
        >
          {text}
        </p>
      </foreignObject>
    </g>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface IPhoneMockupProps {
  screenshotFile: string;
  centerX: number;
  centerY: number;
  overlays?: Overlay[];
}

export const IPhoneMockup: React.FC<IPhoneMockupProps> = ({
  screenshotFile,
  centerX,
  centerY,
  overlays = [],
}) => {
  const { frameWidth, frameHeight, screenWidth, screenHeight,
          cornerRadius, screenRadius,
          dynamicIslandWidth, dynamicIslandHeight } = MOCKUP;

  const fx = centerX - frameWidth / 2;
  const fy = centerY - frameHeight / 2;

  const sx = fx + (frameWidth - screenWidth) / 2;
  const sy = fy + (frameHeight - screenHeight) / 2;

  const diX = sx + screenWidth / 2 - dynamicIslandWidth / 2;
  const diY = sy + 26;

  const uid = screenshotFile.replace(/[^a-z0-9]/gi, '');
  const clipId = `clip-${uid}`;
  const frameGradId = `frame-grad-${uid}`;
  const glareGradId = `glare-${uid}`;

  return (
    <g>
      <defs>
        <linearGradient id={frameGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#d8cec4" />
          <stop offset="30%"  stopColor="#b8a99e" />
          <stop offset="65%"  stopColor="#c9bdb4" />
          <stop offset="100%" stopColor="#a89590" />
        </linearGradient>

        <clipPath id={clipId}>
          <rect x={sx} y={sy} width={screenWidth} height={screenHeight}
                rx={screenRadius} ry={screenRadius} />
        </clipPath>

        <linearGradient id={glareGradId} x1="0%" y1="0%" x2="6%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Side buttons */}
      <rect x={fx - 5} y={fy + 210} width={5} height={40} rx={2.5} fill="#b0a095" />
      <rect x={fx - 5} y={fy + 295} width={5} height={66} rx={2.5} fill="#b0a095" />
      <rect x={fx - 5} y={fy + 378} width={5} height={66} rx={2.5} fill="#b0a095" />
      <rect x={fx + frameWidth} y={fy + 310} width={5} height={96} rx={2.5} fill="#b0a095" />

      {/* Frame body */}
      <rect x={fx} y={fy} width={frameWidth} height={frameHeight}
            rx={cornerRadius} ry={cornerRadius}
            fill="#181614"
            stroke={`url(#${frameGradId})`}
            strokeWidth={2.5} />

      {/* Screenshot */}
      <image
        href={staticFile(`screenshots/${screenshotFile}`)}
        x={sx} y={sy}
        width={screenWidth} height={screenHeight}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* ── Overlays ── */}
      {overlays.map((ov, i) => {
        if (ov.kind === 'avatar') {
          return (
            <g key={i} clipPath={`url(#${clipId})`}>
              <AvatarPlaceholder
                x={sx + ov.x} y={sy + ov.y}
                size={ov.size} shape={ov.shape}
              />
            </g>
          );
        }
        if (ov.kind === 'diary-card') {
          return (
            <DiaryCardMock key={i}
              sx={sx} sy={sy}
              x={ov.x} y={ov.y}
              width={ov.width} height={ov.height}
              clipId={clipId}
            />
          );
        }
        if (ov.kind === 'note') {
          return (
            <NoteMock key={i}
              sx={sx} sy={sy}
              x={ov.x} y={ov.y}
              width={ov.width} height={ov.height}
              text={ov.text}
              clipId={clipId}
            />
          );
        }
        if (ov.kind === 'block') {
          return (
            <g key={i} clipPath={`url(#${clipId})`}>
              <rect
                x={sx + ov.x} y={sy + ov.y}
                width={ov.width} height={ov.height}
                fill={ov.fill ?? '#1a1814'}
              />
            </g>
          );
        }
        return null;
      })}

      {/* Glass glare */}
      <rect x={sx} y={sy} width={screenWidth} height={screenHeight}
            rx={screenRadius}
            fill={`url(#${glareGradId})`}
            clipPath={`url(#${clipId})`} />

      {/* Dynamic Island */}
      <rect x={diX} y={diY}
            width={dynamicIslandWidth} height={dynamicIslandHeight}
            rx={dynamicIslandHeight / 2}
            fill="#000000" />

      {/* USB-C port */}
      <rect x={fx + frameWidth / 2 - 44} y={fy + frameHeight - 16}
            width={88} height={10} rx={5} fill="#2c2c2c" />

      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={`sl-${i}`}
          cx={fx + frameWidth / 2 - 82 + i * 8}
          cy={fy + frameHeight - 11}
          r={1.8} fill="#333" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={`sr-${i}`}
          cx={fx + frameWidth / 2 + 48 + i * 8}
          cy={fy + frameHeight - 11}
          r={1.8} fill="#333" />
      ))}
    </g>
  );
};
