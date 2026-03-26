import { useState } from 'react';
import { PenSquare, CheckCircle2 } from 'lucide-react';
import { Mood, DiaryEntry } from '../types';

const MOODS: { id: Mood; emoji: string; label: string; desc: string }[] = [
  { id: 'Difficile', emoji: '😔', label: 'Difficile', desc: 'Oggi è una sfida, ma passerà.' },
  { id: 'Arrabbiato', emoji: '😤', label: 'Arrabbiato', desc: 'Sento tensione e frustrazione.' },
  { id: 'Neutro', emoji: '😐', label: 'Neutro', desc: 'In equilibrio, senza scossoni.' },
  { id: 'Meglio', emoji: '🌱', label: 'Meglio', desc: 'Vedo la luce e sento speranza.' },
  { id: 'Forte', emoji: '✨', label: 'Forte', desc: 'Ho il controllo e mi sento bene.' },
];

interface CheckInProps {
  onSave: (entry: Omit<DiaryEntry, 'id' | 'timestamp' | 'date' | 'time' | 'uid'>) => void;
}

export function CheckIn({ onSave }: CheckInProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!selectedMood) return;
    onSave({ mood: selectedMood, note });
    setSelectedMood(null);
    setNote('');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-2">
        <p className="text-primary font-medium tracking-wide text-sm uppercase">Check-in quotidiano</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">Come ti senti oggi?</h2>
        <p className="text-on-surface-variant text-base leading-relaxed">
          Prenditi un momento per ascoltare le tue emozioni. Non c'è una risposta sbagliata.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4">
        {MOODS.map((mood) => {
          const isActive = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`group flex items-center p-5 rounded-lg transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-surface-container-highest border-2 border-primary/40 ring-4 ring-primary-container/10'
                  : 'bg-surface-container-low border-2 border-transparent hover:bg-surface-container'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mr-4 transition-transform ${
                isActive ? 'bg-white scale-110' : 'bg-surface-container-highest group-hover:scale-110'
              }`}>
                {mood.emoji}
              </div>
              <div className="text-left flex-1">
                <span className={`block font-bold text-lg ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                  {mood.label}
                </span>
                <span className={`text-sm ${isActive ? 'text-on-surface-variant font-medium' : 'text-on-surface-variant'}`}>
                  {mood.desc}
                </span>
              </div>
              {isActive && (
                <CheckCircle2 className="text-primary ml-auto" size={24} fill="currentColor" />
              )}
            </button>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <PenSquare className="text-primary" size={24} />
          <h3 className="font-bold text-on-surface">Vuoi aggiungere una nota?</h3>
        </div>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-surface-container-highest border-0 rounded-lg p-5 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 focus:bg-surface-container-lowest transition-all resize-none h-32"
            placeholder="Cosa sta succedendo nel tuo cuore oggi?"
          />
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">FACOLTATIVO</span>
          </div>
        </div>
      </section>

      <section className="pt-4">
        <button
          onClick={handleSave}
          disabled={!selectedMood}
          className="w-full h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg shadow-[0_12px_32px_rgba(140,78,55,0.25)] hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100"
        >
          Salva check-in
        </button>
        <p className="text-center text-xs text-on-surface-variant mt-4 px-8 leading-relaxed italic">
          "Ogni piccolo passo è un pezzo della tua rinascita."
        </p>
      </section>
    </div>
  );
}
