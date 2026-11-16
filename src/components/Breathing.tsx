import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, RotateCcw, Wind } from 'lucide-react';

type PatternId = '478' | 'box';
type PhaseKey = 'inhale' | 'hold' | 'exhale' | 'rest';

interface Phase {
  key: PhaseKey;
  label: string;
  seconds: number;
  /** Scala dell'orb al termine della fase. */
  scale: number;
}

interface Pattern {
  id: PatternId;
  name: string;
  description: string;
  phases: Phase[];
}

const MAX_SCALE = 1.45;

const PATTERNS: Pattern[] = [
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

const CYCLE_OPTIONS = [3, 5, 8] as const;

interface SessionState {
  started: boolean;
  phaseIndex: number;
  secondsLeft: number;
  completedCycles: number;
}

type SessionAction =
  | { type: 'reset'; phases: Phase[] }
  | { type: 'begin' }
  | { type: 'tick'; phases: Phase[] };

const initialSession = (phases: Phase[]): SessionState => ({
  started: false,
  phaseIndex: 0,
  secondsLeft: phases[0].seconds,
  completedCycles: 0,
});

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'reset':
      return initialSession(action.phases);
    case 'begin':
      return state.started ? state : { ...state, started: true };
    case 'tick': {
      if (state.secondsLeft > 1) return { ...state, secondsLeft: state.secondsLeft - 1 };
      const next = state.phaseIndex + 1;
      if (next < action.phases.length) {
        return { ...state, phaseIndex: next, secondsLeft: action.phases[next].seconds };
      }
      // Fine ciclo: si riparte dalla prima fase. A cicli completati `isDone` ferma il timer.
      return {
        ...state,
        completedCycles: state.completedCycles + 1,
        phaseIndex: 0,
        secondsLeft: action.phases[0].seconds,
      };
    }
  }
}

interface BreathingProps {
  onClose: () => void;
}

export function Breathing({ onClose }: BreathingProps) {
  const [patternId, setPatternId] = useState<PatternId>('478');
  const [totalCycles, setTotalCycles] = useState<number>(5);
  const [isRunning, setIsRunning] = useState(false);

  const pattern = PATTERNS.find((p) => p.id === patternId)!;
  const [session, dispatch] = useReducer(sessionReducer, pattern.phases, initialSession);

  const isDone = session.completedCycles >= totalCycles;
  const phase = pattern.phases[session.phaseIndex];

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Esc chiude la vista
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Timer a 1 secondo mentre la sessione è attiva
  useEffect(() => {
    if (!isRunning || isDone) return;
    const id = window.setInterval(() => {
      dispatch({ type: 'tick', phases: pattern.phases });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, isDone, pattern]);

  // Al completamento dei cicli la sessione si ferma
  useEffect(() => {
    if (isDone) setIsRunning(false);
  }, [isDone]);

  const reset = (phases: Phase[] = pattern.phases) => {
    setIsRunning(false);
    dispatch({ type: 'reset', phases });
  };

  const handlePrimary = () => {
    if (isDone) {
      dispatch({ type: 'reset', phases: pattern.phases });
      dispatch({ type: 'begin' });
      setIsRunning(true);
      return;
    }
    if (isRunning) {
      setIsRunning(false);
    } else {
      dispatch({ type: 'begin' });
      setIsRunning(true);
    }
  };

  const selectPattern = (id: PatternId) => {
    if (id === patternId) return;
    setPatternId(id);
    reset(PATTERNS.find((p) => p.id === id)!.phases);
  };

  const selectCycles = (n: number) => {
    setTotalCycles(n);
    reset();
  };

  const orbScale = session.started && !isDone ? phase.scale : 1;
  const orbOpacity = session.started && !isDone ? (phase.scale > 1 ? 1 : 0.8) : 0.9;
  const headline = isDone ? 'Sessione completata' : session.started ? phase.label : 'Pronto';
  const subline = isDone
    ? `${totalCycles} ${totalCycles === 1 ? 'ciclo' : 'cicli'}. Prenditi un attimo prima di riprendere.`
    : session.started
      ? isRunning
        ? 'Segui il ritmo del cerchio'
        : 'In pausa'
      : 'Scegli un ritmo e premi Avvia';
  const currentCycle = Math.min(session.completedCycles + 1, totalCycles);

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

        <div className="mt-4 grid grid-cols-1 gap-2" role="radiogroup" aria-label="Ritmo">
          {PATTERNS.map((p) => {
            const active = p.id === patternId;
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
          <span className="text-xs font-bold uppercase tracking-widest text-outline">Cicli</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Numero di cicli">
            {CYCLE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === totalCycles}
                onClick={() => selectCycles(n)}
                className={`min-w-[44px] min-h-[44px] rounded-full text-sm font-bold tabular-nums transition-colors duration-200 active:scale-95 ${
                  n === totalCycles
                    ? 'bg-tertiary text-surface'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-tertiary/20" />
            <div
              className="breath-orb w-40 h-40 rounded-full bg-tertiary shadow-[0_0_48px_rgba(20,105,100,0.35),inset_0_8px_24px_rgba(255,255,255,0.18)] transition-[transform,opacity] ease-in-out"
              style={{
                transform: `scale(${orbScale})`,
                opacity: orbOpacity,
                transitionDuration: `${session.started && !isDone ? phase.seconds * 1000 : 400}ms`,
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-extrabold tabular-nums text-surface">
                {session.started && !isDone ? session.secondsLeft : isDone ? '✓' : ''}
              </span>
            </div>
          </div>

          <div className="mt-6 text-center" aria-live="polite">
            <p className="text-2xl font-extrabold tracking-tight">{headline}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{subline}</p>
            {session.started && !isDone && (
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-outline tabular-nums">
                Ciclo {currentCycle} di {totalCycles}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!session.started}
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
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isDone ? 'Ripeti' : isRunning ? 'Pausa' : session.started ? 'Riprendi' : 'Avvia'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
