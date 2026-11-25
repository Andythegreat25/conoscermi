import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, RotateCcw, Wind, Volume2, VolumeX, Vibrate, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';
import {
  PATTERNS,
  MINUTE_OPTIONS,
  PREP_SECONDS,
  getPattern,
  cyclesFor,
  computeView,
  orbLook,
  formatRemaining,
  loadPrefs,
  savePrefs,
  type BreathView,
  type BreathingPrefs,
  type PatternId,
  type Phase,
  type SessionMinutes,
} from '../utils/breathing';
import {
  BreathingSound,
  canVibrate,
  canWakeLock,
  vibrate,
  type SignalKind,
} from '../utils/breathingSignals';

type Status = 'idle' | 'prep' | 'running' | 'paused' | 'done';

interface BreathingProps {
  onClose: () => void;
}

function ToggleChip({
  on,
  onClick,
  Icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`min-h-[44px] px-4 rounded-full flex items-center gap-2 text-sm font-semibold transition-colors duration-200 active:scale-95 ${
        on ? 'bg-tertiary text-surface' : 'bg-surface-container-highest text-on-surface-variant'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

export function Breathing({ onClose }: BreathingProps) {
  const [prefs, setPrefs] = useState<BreathingPrefs>(loadPrefs);
  const pattern = getPattern(prefs.pattern);
  const phases = pattern.phases;
  const totalCycles = cyclesFor(prefs.minutes, phases);

  const [status, setStatus] = useState<Status>('idle');
  const [view, setView] = useState<BreathView>(() => computeView(0, phases, totalCycles));
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);

  // Valori letti dal ciclo di animazione senza doverlo riavviare a ogni cambio
  const live = useRef({ phases, totalCycles, prefs });
  live.current = { phases, totalCycles, prefs };
  const statusRef = useRef<Status>('idle');
  const setStatusBoth = (next: Status) => {
    statusRef.current = next;
    setStatus(next);
  };

  // Il tempo si misura con l'orologio: `acc` è il tempo già trascorso prima dell'ultima ripresa,
  // `start` l'istante dell'ultima ripresa. Se il telefono rallenta i timer, non si perde il ritmo.
  const startRef = useRef(0);
  const accRef = useRef(0);
  const prepEndRef = useRef(0);
  const lastPhaseRef = useRef('');
  const orbRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<BreathingSound | null>(null);
  const reducedMotion = useRef(false);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useScrollLock(true);

  // Preferenze ricordate per la volta dopo
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  // "Riduci movimento": il cerchio non si allarga, cambia solo la trasparenza
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    reducedMotion.current = query.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Esc chiude la vista
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Alla chiusura si spegne l'audio
  useEffect(() => () => soundRef.current?.dispose(), []);

  const signal = (kind: SignalKind) => {
    const p = live.current.prefs;
    if (p.sound) soundRef.current?.play(kind);
    if (p.vibration) vibrate(kind);
  };

  const paintOrb = (v: BreathView) => {
    const el = orbRef.current;
    if (!el) return;
    const { scale, opacity } = orbLook(v, live.current.phases, reducedMotion.current);
    el.style.transform = `scale(${scale})`;
    el.style.opacity = String(opacity);
  };

  // Ciclo di animazione: attivo solo durante il conto iniziale e l'esercizio
  useEffect(() => {
    if (status !== 'prep' && status !== 'running') return;
    let raf = 0;

    const frame = () => {
      const now = performance.now();

      if (statusRef.current === 'prep') {
        const left = Math.ceil((prepEndRef.current - now) / 1000);
        if (left <= 0) {
          startRef.current = now;
          accRef.current = 0;
          lastPhaseRef.current = '';
          setStatusBoth('running'); // il ciclo riparte da solo quando cambia lo stato
          return;
        }
        setPrepLeft(left);
      } else if (statusRef.current === 'running') {
        const { phases: ph, totalCycles: cycles } = live.current;
        const v = computeView(accRef.current + (now - startRef.current), ph, cycles);
        paintOrb(v);

        const key = `${v.cycle}:${v.phaseIndex}`;
        if (!v.done && key !== lastPhaseRef.current) {
          lastPhaseRef.current = key;
          signal(ph[v.phaseIndex].key);
        }
        setView((prev) =>
          prev.done === v.done &&
          prev.cycle === v.cycle &&
          prev.phaseIndex === v.phaseIndex &&
          prev.secondsLeft === v.secondsLeft
            ? prev
            : v,
        );

        if (v.done) {
          signal('end');
          setStatusBoth('done');
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // A riposo o a fine esercizio il cerchio torna piccolo, con una transizione morbida
  useEffect(() => {
    if (status !== 'idle' && status !== 'done') return;
    const el = orbRef.current;
    if (!el) return;
    el.style.transform = 'scale(1)';
    el.style.opacity = '0.9';
  }, [status]);

  // Schermo acceso mentre si respira (dove il telefono lo permette)
  // Dipende da "attivo" e non dallo stato, così nel passaggio dal conto all'esercizio non si rilascia e riprende
  const sessionActive = status === 'prep' || status === 'running';
  useEffect(() => {
    if (!prefs.wakeLock || !canWakeLock() || !sessionActive) return;
    let cancelled = false;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request('screen')
      .then((l) => {
        if (cancelled) void l.release().catch(() => {});
        else lock = l;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      void lock?.release().catch(() => {});
    };
  }, [sessionActive, prefs.wakeLock]);

  const resetTo = (ph: Phase[], cycles: number) => {
    accRef.current = 0;
    lastPhaseRef.current = '';
    setView(computeView(0, ph, cycles));
    setPrepLeft(PREP_SECONDS);
    setStatusBoth('idle');
  };

  const pause = () => {
    if (statusRef.current !== 'running') return;
    accRef.current += performance.now() - startRef.current;
    setStatusBoth('paused');
  };

  // Se esci dall'app l'esercizio si ferma: così al ritorno non è andato avanti da solo
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (statusRef.current === 'running') pause();
      else if (statusRef.current === 'prep') resetTo(live.current.phases, live.current.totalCycles);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const start = () => {
    // L'audio si può attivare solo dentro un tocco: questo lo è
    if (prefs.sound) {
      soundRef.current ??= new BreathingSound();
      soundRef.current.prepare();
    }
    accRef.current = 0;
    lastPhaseRef.current = '';
    setView(computeView(0, phases, totalCycles));
    prepEndRef.current = performance.now() + PREP_SECONDS * 1000;
    setPrepLeft(PREP_SECONDS);
    setStatusBoth('prep');
  };

  const resume = () => {
    if (prefs.sound) soundRef.current?.prepare();
    startRef.current = performance.now();
    setStatusBoth('running');
  };

  const handlePrimary = () => {
    if (status === 'idle' || status === 'done') start();
    else if (status === 'prep') resetTo(phases, totalCycles);
    else if (status === 'running') pause();
    else if (status === 'paused') resume();
  };

  const selectPattern = (id: PatternId) => {
    if (id === prefs.pattern) return;
    setPrefs((p) => ({ ...p, pattern: id }));
    const next = getPattern(id).phases;
    resetTo(next, cyclesFor(prefs.minutes, next));
  };

  const selectMinutes = (minutes: SessionMinutes) => {
    if (minutes === prefs.minutes) return;
    setPrefs((p) => ({ ...p, minutes }));
    resetTo(phases, cyclesFor(minutes, phases));
  };

  const toggleSound = () => {
    const next = !prefs.sound;
    if (next) {
      // Un tono di prova, dentro il tocco: si sente subito se funziona
      soundRef.current ??= new BreathingSound();
      soundRef.current.prepare();
      soundRef.current.play('inhale');
    }
    setPrefs((p) => ({ ...p, sound: next }));
  };

  const toggleVibration = () => {
    const next = !prefs.vibration;
    if (next) vibrate('inhale');
    setPrefs((p) => ({ ...p, vibration: next }));
  };

  const toggleWakeLock = () => setPrefs((p) => ({ ...p, wakeLock: !p.wakeLock }));

  const inSession = status === 'prep' || status === 'running' || status === 'paused';
  const orbMoves = status === 'prep' || status === 'running';
  const phase = phases[view.phaseIndex];

  const orbNumber =
    status === 'prep' ? prepLeft : inSession ? view.secondsLeft : status === 'done' ? '✓' : '';
  const headline =
    status === 'done'
      ? 'Sessione completata'
      : status === 'prep'
        ? 'Mettiti comodo'
        : status === 'paused'
          ? 'In pausa'
          : status === 'running'
            ? phase.label
            : 'Pronto';
  const minutesLabel = `${prefs.minutes} ${prefs.minutes === 1 ? 'minuto' : 'minuti'}`;
  const subline =
    status === 'done'
      ? `${totalCycles} cicli in circa ${minutesLabel}. Prenditi un attimo prima di riprendere.`
      : status === 'prep'
        ? 'Rilassa le spalle. Si parte tra poco.'
        : status === 'paused'
          ? 'Premi Riprendi quando sei pronto'
          : status === 'running'
            ? 'Segui il ritmo del cerchio'
            : `Circa ${totalCycles} cicli, ${minutesLabel}`;

  const primaryLabel =
    status === 'prep'
      ? 'Annulla'
      : status === 'running'
        ? 'Pausa'
        : status === 'paused'
          ? 'Riprendi'
          : status === 'done'
            ? 'Ripeti'
            : 'Avvia';
  const PrimaryIcon = status === 'running' ? Pause : status === 'prep' ? X : Play;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Respirazione guidata"
      className="fixed inset-0 z-[70] bg-surface text-on-surface overflow-y-auto overscroll-contain animate-in fade-in duration-200"
    >
      <div
        className="mx-auto w-full max-w-[430px] min-h-full flex flex-col px-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        <header className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2 text-tertiary">
            <Wind size={20} />
            <h2 className="font-bold tracking-tight text-lg">Respirazione guidata</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 active:scale-95"
          >
            <X size={24} />
          </button>
        </header>

        {inSession ? (
          <p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-outline">
            {pattern.name} · {prefs.minutes} min
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-2" role="radiogroup" aria-label="Ritmo">
              {PATTERNS.map((p) => {
                const active = p.id === prefs.pattern;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => selectPattern(p.id)}
                    className={`min-h-[56px] text-left rounded-2xl px-4 py-2.5 border-2 transition-colors duration-200 active:scale-[0.99] ${
                      active
                        ? 'bg-surface-container-lowest border-tertiary'
                        : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                    }`}
                  >
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-outline">Durata</span>
              <div className="flex gap-2" role="radiogroup" aria-label="Durata in minuti">
                {MINUTE_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={m === prefs.minutes}
                    onClick={() => selectMinutes(m)}
                    className={`min-w-[56px] min-h-[44px] rounded-full text-sm font-bold tabular-nums transition-colors duration-200 active:scale-95 ${
                      m === prefs.minutes
                        ? 'bg-tertiary text-surface'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3" role="group" aria-label="Segnali">
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  on={prefs.sound}
                  onClick={toggleSound}
                  Icon={prefs.sound ? Volume2 : VolumeX}
                  label="Suono"
                />
                {canVibrate() && (
                  <ToggleChip on={prefs.vibration} onClick={toggleVibration} Icon={Vibrate} label="Vibrazione" />
                )}
                {canWakeLock() && (
                  <ToggleChip on={prefs.wakeLock} onClick={toggleWakeLock} Icon={Sun} label="Schermo acceso" />
                )}
              </div>
              {prefs.sound && (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Con il tasto silenzioso del telefono attivo, il suono non si sente.
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-tertiary/20" />
            <div
              ref={orbRef}
              className={`breath-orb w-40 h-40 rounded-full bg-tertiary shadow-[0_0_48px_rgba(20,105,100,0.35),inset_0_8px_24px_rgba(255,255,255,0.18)] ${
                orbMoves ? '' : 'transition-[transform,opacity] duration-500 ease-in-out'
              }`}
              style={{ transform: 'scale(1)', opacity: 0.9 }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-extrabold tabular-nums text-surface">{orbNumber}</span>
            </div>
          </div>

          <div className="mt-6 text-center" aria-live="polite">
            <p className="text-2xl font-extrabold tracking-tight">{headline}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{subline}</p>
            {(status === 'running' || status === 'paused') && (
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-outline tabular-nums">
                Ciclo {view.cycle} di {totalCycles} · restano {formatRemaining(view.remainingMs)}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => resetTo(phases, totalCycles)}
            disabled={status === 'idle'}
            className="flex-1 min-h-[56px] rounded-full bg-surface-container-highest text-on-surface font-bold flex items-center justify-center gap-2 transition-[transform,opacity] duration-200 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            <RotateCcw size={20} />
            Ripristina
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            className="flex-[1.4] min-h-[56px] rounded-full bg-primary text-on-primary font-bold flex items-center justify-center gap-2 transition-transform duration-200 active:scale-95"
          >
            <PrimaryIcon size={20} />
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
