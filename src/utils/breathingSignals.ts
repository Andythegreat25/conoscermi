import type { PhaseKey } from './breathing';

/**
 * Segnali dell'esercizio di respirazione: suono, vibrazione e schermo acceso.
 * Nessun file audio: i toni si generano con Web Audio, quindi non pesano.
 */

export type SignalKind = PhaseKey | 'end';

export const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const canWakeLock = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/** Vibrazione breve a ogni cambio. Dove non esiste (iPhone) non fa niente. */
export function vibrate(kind: SignalKind): void {
  if (!canVibrate()) return;
  const patterns: Record<SignalKind, number | number[]> = {
    inhale: 35,
    hold: 15,
    exhale: [40, 70, 40],
    rest: 15,
    end: [60, 90, 60],
  };
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* alcuni browser la bloccano senza un tocco recente */
  }
}

interface Tone {
  from: number;
  to?: number;
  start: number;
  length: number;
  gain: number;
}

// Frequenze in hertz. Inspirare sale, espirare scende: il corpo segue la direzione del suono.
const TONES: Record<SignalKind, Tone[]> = {
  inhale: [{ from: 392, to: 523, start: 0, length: 0.9, gain: 0.07 }],
  hold: [{ from: 349, start: 0, length: 0.22, gain: 0.035 }],
  exhale: [{ from: 523, to: 330, start: 0, length: 1.1, gain: 0.07 }],
  rest: [{ from: 349, start: 0, length: 0.22, gain: 0.035 }],
  end: [
    { from: 523, start: 0, length: 1.2, gain: 0.07 },
    { from: 659, start: 0.28, length: 1.2, gain: 0.06 },
    { from: 784, start: 0.56, length: 1.6, gain: 0.05 },
  ],
};

export class BreathingSound {
  private ctx: AudioContext | null = null;

  /**
   * Va chiamato dentro un tocco dell'utente (per esempio su "Avvia"): i browser, iPhone in
   * particolare, tengono l'audio spento finché non c'è un gesto.
   */
  prepare(): void {
    try {
      if (!this.ctx) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  play(kind: SignalKind): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'closed') return;
    const now = ctx.currentTime;

    TONES[kind].forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + tone.start;
      const t1 = t0 + tone.length;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.from, t0);
      if (tone.to) osc.frequency.linearRampToValueAtTime(tone.to, t1);

      // Inviluppo morbido: sale piano e si spegne piano, senza scatti
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(tone.gain, t0 + Math.min(0.12, tone.length / 3));
      gain.gain.linearRampToValueAtTime(0.0001, t1);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.05);
    });
  }

  dispose(): void {
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
  }
}
