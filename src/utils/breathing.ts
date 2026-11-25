import { safeSetItem } from './storage';

/**
 * Logica dell'esercizio di respirazione, separata dalla schermata così si può provare da sola.
 *
 * Il tempo non si conta più "un secondo alla volta": si misura l'orologio e da quello si ricava
 * in che fase siamo. Se il telefono rallenta i timer, l'esercizio non perde il ritmo.
 */

export type PatternId = '478' | 'box';
export type PhaseKey = 'inhale' | 'hold' | 'exhale' | 'rest';
export type SessionMinutes = 1 | 3 | 5;

export interface Phase {
  key: PhaseKey;
  label: string;
  seconds: number;
  /** Scala del cerchio al termine della fase (1 = piccolo, MAX_SCALE = pieno). */
  scale: number;
}

export interface Pattern {
  id: PatternId;
  name: string;
  description: string;
  phases: Phase[];
}

export const MAX_SCALE = 1.45;
export const PREP_SECONDS = 3;

export const PATTERNS: Pattern[] = [
  {
    id: '478',
    name: 'Rilassante 4-7-8',
    description: 'Inspira 4, trattieni 7, espira 8',
    phases: [
      { key: 'inhale', label: 'Inspira', seconds: 4, scale: MAX_SCALE },
      { key: 'hold', label: 'Trattieni', seconds: 7, scale: MAX_SCALE },
      { key: 'exhale', label: 'Espira', seconds: 8, scale: 1 },
    ],
  },
  {
    id: 'box',
    name: 'Equilibrio 4-4-4-4',
    description: 'Quattro tempi uguali, come un quadrato',
    phases: [
      { key: 'inhale', label: 'Inspira', seconds: 4, scale: MAX_SCALE },
      { key: 'hold', label: 'Trattieni', seconds: 4, scale: MAX_SCALE },
      { key: 'exhale', label: 'Espira', seconds: 4, scale: 1 },
      { key: 'rest', label: 'Trattieni', seconds: 4, scale: 1 },
    ],
  },
];

export const MINUTE_OPTIONS: SessionMinutes[] = [1, 3, 5];

export function getPattern(id: PatternId): Pattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

export function cycleSeconds(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + p.seconds, 0);
}

/** Quanti cicli interi stanno nei minuti scelti (almeno uno). */
export function cyclesFor(minutes: number, phases: Phase[]): number {
  return Math.max(1, Math.round((minutes * 60) / cycleSeconds(phases)));
}

// ── Dal tempo trascorso alla fase ────────────────────────────────────────────

export interface BreathView {
  done: boolean;
  /** Ciclo in corso, da 1. */
  cycle: number;
  phaseIndex: number;
  /** Avanzamento nella fase, da 0 a 1. */
  phaseProgress: number;
  /** Secondi che mancano alla fine della fase (arrotondati per eccesso). */
  secondsLeft: number;
  /** Millisecondi che mancano alla fine dell'esercizio. */
  remainingMs: number;
}

export function computeView(elapsedMs: number, phases: Phase[], totalCycles: number): BreathView {
  const cycleMs = cycleSeconds(phases) * 1000;
  const totalMs = cycleMs * totalCycles;
  const elapsed = Math.max(0, elapsedMs);

  if (elapsed >= totalMs) {
    return {
      done: true,
      cycle: totalCycles,
      phaseIndex: phases.length - 1,
      phaseProgress: 1,
      secondsLeft: 0,
      remainingMs: 0,
    };
  }

  const cycle = Math.floor(elapsed / cycleMs);
  let t = elapsed - cycle * cycleMs;
  let i = 0;
  while (i < phases.length - 1 && t >= phases[i].seconds * 1000) {
    t -= phases[i].seconds * 1000;
    i += 1;
  }
  const phaseMs = phases[i].seconds * 1000;
  return {
    done: false,
    cycle: cycle + 1,
    phaseIndex: i,
    phaseProgress: Math.min(1, t / phaseMs),
    secondsLeft: Math.max(1, Math.ceil((phaseMs - t) / 1000)),
    remainingMs: totalMs - elapsed,
  };
}

const ease = (p: number) => 0.5 - 0.5 * Math.cos(Math.PI * p);

/** Scala e trasparenza del cerchio in questo istante. Con "riduci movimento" la scala resta 1. */
export function orbLook(view: BreathView, phases: Phase[], reducedMotion: boolean) {
  const from = phases[(view.phaseIndex - 1 + phases.length) % phases.length].scale;
  const to = phases[view.phaseIndex].scale;
  const scale = from + (to - from) * ease(view.phaseProgress);
  const fill = (scale - 1) / (MAX_SCALE - 1); // 0 = cerchio piccolo, 1 = pieno
  return {
    scale: reducedMotion ? 1 : scale,
    opacity: reducedMotion ? 0.45 + 0.55 * fill : 0.8 + 0.2 * fill,
  };
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ── Preferenze ────────────────────────────────────────────────────────────────

export interface BreathingPrefs {
  pattern: PatternId;
  minutes: SessionMinutes;
  sound: boolean;
  vibration: boolean;
  wakeLock: boolean;
}

export const DEFAULT_PREFS: BreathingPrefs = {
  pattern: '478',
  minutes: 3,
  // I segnali sono spenti finché non li accendi tu
  sound: false,
  vibration: false,
  wakeLock: false,
};

const PREFS_KEY = 'breathing_prefs';

export function loadPrefs(): BreathingPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return DEFAULT_PREFS;
    return {
      pattern: PATTERNS.some((p) => p.id === raw.pattern) ? raw.pattern : DEFAULT_PREFS.pattern,
      minutes: MINUTE_OPTIONS.includes(raw.minutes) ? raw.minutes : DEFAULT_PREFS.minutes,
      sound: raw.sound === true,
      vibration: raw.vibration === true,
      wakeLock: raw.wakeLock === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: BreathingPrefs): void {
  safeSetItem(PREFS_KEY, JSON.stringify(prefs));
}
