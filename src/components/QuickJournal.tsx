import { useState } from 'react';
import { ArrowLeft, PenSquare, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';
import { Mood, DiaryEntry } from '../types';

const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: 'Difficile', emoji: '😔', label: 'Difficile' },
  { id: 'Arrabbiato', emoji: '😤', label: 'Arrabbiato' },
  { id: 'Neutro', emoji: '😐', label: 'Neutro' },
  { id: 'Meglio', emoji: '🌱', label: 'Meglio' },
  { id: 'Forte', emoji: '✨', label: 'Forte' },
];

const PROMPTS = [
  "Qual è stata la cosa migliore di oggi?",
  "Cosa ti ha preoccupato e come l'hai affrontato?",
  "Per cosa ti senti grato in questo momento?",
  "Cosa hai imparato di nuovo oggi?",
  "Chi ti ha fatto sorridere oggi e perché?",
  "Qual è un piccolo successo che hai ottenuto oggi?",
  "Se potessi cambiare una cosa di oggi, cosa sarebbe?",
  "Cosa non vedi l'ora di fare domani?",
  "Descrivi un momento in cui ti sei sentito in pace oggi.",
  "Quale canzone o musica ha accompagnato la tua giornata?",
  "Cosa ti ha fatto arrabbiare oggi? Come hai reagito?",
  "Hai dedicato del tempo a te stesso oggi? Cosa hai fatto?",
  "Cosa ti sta trattenendo in questo periodo?",
  "Qual è un tuo pregio che hai dimostrato oggi?",
  "Se la tua giornata fosse un film, che titolo avrebbe?"
];

interface QuickJournalProps {
  onSave: (entry: Omit<DiaryEntry, 'id' | 'timestamp' | 'date' | 'time' | 'uid'>) => void;
  onBack: () => void;
  initialEntry?: DiaryEntry | null;
}

export function QuickJournal({ onSave, onBack, initialEntry }: QuickJournalProps) {
  const [note, setNote] = useState(initialEntry?.note || '');
  const [selectedMood, setSelectedMood] = useState<Mood>(initialEntry?.mood || 'Neutro');
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  const handleSave = () => {
    if (!note.trim()) return;
    onSave({ mood: selectedMood, note });
  };

  const handleInspireMe = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setCurrentPrompt(randomPrompt);
    // If the note is empty, we can optionally pre-fill it or just show the prompt above
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8 pb-12">
      <header className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center pr-10">
          <p className="text-primary font-bold tracking-widest uppercase text-[10px]">
            {initialEntry ? "Modifica Pensiero" : "Nuovo Pensiero"}
          </p>
          <h2 className="text-xl font-extrabold text-on-surface">
            {initialEntry ? "Modifica nel Diario" : "Scrivi nel Diario"}
          </h2>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-primary">
          <div className="flex items-center gap-2">
            <PenSquare size={20} />
            <h3 className="font-bold">Cosa hai in mente?</h3>
          </div>
          <button 
            onClick={handleInspireMe}
            className="flex items-center gap-1.5 text-xs font-bold bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity active:scale-95"
          >
            <Lightbulb size={14} className="fill-current" />
            Ispirami
          </button>
        </div>
        
        {currentPrompt && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-medium text-primary italic">"{currentPrompt}"</p>
          </div>
        )}

        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-surface-container-highest border-none rounded-2xl p-6 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none h-64 text-lg leading-relaxed"
          placeholder="Lascia fluire le tue parole..."
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles size={20} />
          <h3 className="font-bold">Come ti senti mentre scrivi?</h3>
        </div>
        <div className="flex justify-between gap-2">
          {MOODS.map((mood) => {
            const isActive = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pt-4">
        <button
          onClick={handleSave}
          disabled={!note.trim()}
          className="w-full h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
        >
          <CheckCircle2 size={22} />
          {initialEntry ? "Salva Modifiche" : "Salva nel diario"}
        </button>
      </section>
    </div>
  );
}
