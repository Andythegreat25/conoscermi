import { useState, useEffect } from 'react';
import { Lock, Check, X, ShieldCheck } from 'lucide-react';

interface PinLockProps {
  onUnlock: () => void;
  isSetup?: boolean;
}

export function PinLock({ onUnlock, isSetup = false }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(isSetup ? 'enter' : 'enter');
  const [error, setError] = useState<string | null>(null);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  useEffect(() => {
    if (pin.length === 6) {
      if (isSetup) {
        if (step === 'enter') {
          setConfirmPin(pin);
          setPin('');
          setStep('confirm');
        } else {
          if (pin === confirmPin) {
            localStorage.setItem('user_pin', pin);
            onUnlock();
          } else {
            setError('I PIN non corrispondono. Riprova.');
            setPin('');
            setStep('enter');
          }
        }
      } else {
        const savedPin = localStorage.getItem('user_pin');
        if (pin === savedPin) {
          onUnlock();
        } else {
          setError('PIN errato. Riprova.');
          setPin('');
        }
      }
    }
  }, [pin, isSetup, step, confirmPin, onUnlock]);

  return (
    <div className="fixed inset-0 bg-surface z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-[320px] space-y-12 text-center">
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            {isSetup ? <ShieldCheck size={32} /> : <Lock size={32} />}
          </div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">
            {isSetup 
              ? (step === 'enter' ? 'Imposta il tuo PIN' : 'Conferma il tuo PIN')
              : 'Bentornato'}
          </h2>
          <p className="text-on-surface-variant text-sm font-medium">
            {isSetup 
              ? 'Scegli un codice a 6 cifre per proteggere il tuo diario.'
              : 'Inserisci il tuo codice per accedere.'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < pin.length 
                    ? 'bg-primary scale-125' 
                    : 'bg-outline-variant'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-error text-sm font-bold animate-bounce">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-full bg-surface-container-low text-2xl font-bold text-on-surface hover:bg-surface-container-high active:scale-90 transition-all flex items-center justify-center mx-auto"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-all flex items-center justify-center mx-auto"
          >
            <X size={24} />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-full bg-surface-container-low text-2xl font-bold text-on-surface hover:bg-surface-container-high active:scale-90 transition-all flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-all flex items-center justify-center mx-auto"
          >
            <Check size={24} className="opacity-0" /> {/* Spacer */}
            <div className="absolute">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </div>
          </button>
        </div>

        {isSetup && step === 'confirm' && (
          <button 
            onClick={() => {
              setStep('enter');
              setPin('');
              setConfirmPin('');
            }}
            className="text-primary font-bold text-sm uppercase tracking-widest"
          >
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}
