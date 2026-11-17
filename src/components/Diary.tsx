import { Search, Plus, Filter, X, Edit2, Moon, Trash2 } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DiaryEntry, Mood } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface DiaryProps {
  entries: DiaryEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const MOODS: Mood[] = ['Forte', 'Meglio', 'Neutro', 'Arrabbiato', 'Difficile'];

export function Diary({ entries, onAddEntry, onEditEntry, onDeleteEntry }: DiaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | 'Tutti'>('Tutti');
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Arrivo da un link che indica una voce precisa (es. la capsula del tempo della Home):
  // azzera i filtri, scorre fino a quella voce e la evidenzia per qualche secondo.
  const location = useLocation();
  const navigate = useNavigate();
  const handledFocusRef = useRef<string | null>(null);
  useEffect(() => {
    const focusId = (location.state as { focusEntryId?: string } | null)?.focusEntryId;
    if (!focusId || handledFocusRef.current === focusId) return;
    handledFocusRef.current = focusId;

    setSearchQuery('');
    setSelectedMood('Tutti');
    // Consuma lo stato: tornando indietro o ricaricando non si ripete lo scorrimento
    navigate(location.pathname, { replace: true, state: null });

    // Aspetta che la pagina sia disegnata e che App abbia riportato lo scroll in cima
    window.setTimeout(() => {
      const el = document.getElementById(`entry-${focusId}`);
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlightId(focusId);
      window.setTimeout(() => setHighlightId(null), 4000);
    }, 350);
  }, [location.state, location.pathname, navigate]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.eveningNote?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = selectedMood === 'Tutti' || entry.mood === selectedMood;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Forte': return 'bg-primary';
      case 'Meglio': return 'bg-secondary';
      case 'Neutro': return 'bg-secondary-container';
      case 'Arrabbiato': return 'bg-error';
      case 'Difficile': return 'bg-outline';
      default: return 'bg-secondary';
    }
  };

  // Colore del testo abbinato allo sfondo di ogni umore, valido in tema chiaro e scuro
  const getMoodTextColor = (mood: string) => {
    switch (mood) {
      case 'Forte': return 'text-on-primary';
      case 'Meglio': return 'text-on-secondary';
      case 'Neutro': return 'text-on-secondary-container';
      case 'Arrabbiato': return 'text-on-error';
      case 'Difficile': return 'text-surface';
      default: return 'text-on-secondary';
    }
  };

  const entryPreview = entryToDelete
    ? (entryToDelete.note || entryToDelete.eveningNote || 'Nessuna nota aggiunta.')
    : '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Il Tuo Diario</h2>
        <p className="text-on-surface-variant leading-relaxed opacity-70">
          Uno spazio sicuro per i tuoi pensieri e la tua crescita.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-outline" size={20} />
          </div>
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-12 bg-surface-container-highest border-none rounded-full focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
            placeholder="Cerca nei tuoi pensieri..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-2">
          <button
            onClick={() => setSelectedMood('Tutti')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedMood === 'Tutti'
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            Tutti
          </button>
          {MOODS.map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedMood === mood
                  ? `${getMoodColor(mood)} ${getMoodTextColor(mood)} shadow-md`
                  : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 relative">
        {/* Timeline vertical connector */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-outline-variant/30 z-0"></div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant relative z-10 bg-surface rounded-xl border border-dashed border-outline-variant/30">
            <Filter className="mx-auto mb-4 opacity-20" size={48} />
            <p className="font-medium">Nessun pensiero trovato per questa ricerca.</p>
            {(searchQuery || selectedMood !== 'Tutti') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedMood('Tutti'); }}
                className="mt-4 text-primary font-bold text-sm underline underline-offset-4"
              >
                Resetta filtri
              </button>
            )}
          </div>
        ) : (
          (Object.entries(groupedEntries) as [string, DiaryEntry[]][]).map(([date, dayEntries]) => (
            <div key={date}>
              <div className="relative pl-10 py-2 bg-surface z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{date}</span>
              </div>

              {/* ── #15 Animazioni entry con AnimatePresence ─────────────── */}
              <AnimatePresence initial={false}>
                {dayEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    id={`entry-${entry.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22, delay: i * 0.05 }}
                    className="relative pl-10 z-10 group mb-6 last:mb-0"
                  >
                    <div className={`absolute left-[13px] top-1 w-2.5 h-2.5 rounded-full ${getMoodColor(entry.mood)} ring-4 ring-surface`}></div>
                    <div
                      className={`bg-surface-container rounded-lg p-5 transition-all hover:bg-surface-container-high ${
                        highlightId === entry.id ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary">{entry.mood}</span>
                          <span className="text-xs text-on-surface-variant/60 font-medium">{entry.time}</span>
                        </div>
                        <div className="flex items-center -mr-2 -mt-2">
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            className="w-11 h-11 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-highest rounded-full transition-[background-color,color] duration-200"
                            title="Modifica"
                            aria-label="Modifica pensiero"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            className="w-11 h-11 flex items-center justify-center text-outline hover:text-error hover:bg-error-container/40 rounded-full transition-[background-color,color] duration-200"
                            title="Elimina"
                            aria-label="Elimina pensiero"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-on-surface leading-snug">
                        {entry.note || "Nessuna nota aggiunta."}
                      </p>

                      {/* ── #22 Evening note display ─────────────────────── */}
                      {entry.eveningNote && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Moon size={12} className="text-tertiary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">Sera</span>
                          </div>
                          <p className="text-on-surface/80 leading-snug text-sm italic">
                            {entry.eveningNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div
        className="fixed left-0 right-0 w-full max-w-[430px] mx-auto z-40 pointer-events-none flex justify-end px-6"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6.5rem)' }}
      >
        <button
          onClick={onAddEntry}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-soft text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={32} />
        </button>
      </div>

      <ConfirmDialog
        open={entryToDelete !== null}
        title="Eliminare questo pensiero?"
        message="Il pensiero verrà rimosso dal diario. L'azione non si può annullare."
        confirmLabel="Elimina"
        destructive
        onCancel={() => setEntryToDelete(null)}
        onConfirm={() => {
          if (entryToDelete) onDeleteEntry(entryToDelete.id);
          setEntryToDelete(null);
        }}
      >
        {entryToDelete && (
          <div className="rounded-2xl bg-surface-container p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
              {entryToDelete.date} · {entryToDelete.time}
            </p>
            <p className="mt-1 text-sm text-on-surface line-clamp-3">{entryPreview}</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
