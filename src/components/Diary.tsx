import { Search, MoreHorizontal, Plus, Filter, X, Edit2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DiaryEntry, Mood } from '../types';

interface DiaryProps {
  entries: DiaryEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

const MOODS: Mood[] = ['Forte', 'Meglio', 'Neutro', 'Arrabbiato', 'Difficile'];

export function Diary({ entries, onAddEntry, onEditEntry }: DiaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | 'Tutti'>('Tutti');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.note?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           entry.mood.toLowerCase().includes(searchQuery.toLowerCase());
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
            type="text" 
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
                ? 'bg-primary text-white shadow-md' 
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
                  ? `${getMoodColor(mood)} text-white shadow-md` 
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
              
              {dayEntries.map((entry) => (
                <div key={entry.id} className="relative pl-10 z-10 group mb-6 last:mb-0">
                  <div className={`absolute left-[13px] top-1 w-2.5 h-2.5 rounded-full ${getMoodColor(entry.mood)} ring-4 ring-surface`}></div>
                  <div className="bg-surface-container rounded-lg p-5 transition-all hover:bg-surface-container-high">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary">{entry.mood}</span>
                        <span className="text-xs text-on-surface-variant/60 font-medium">{entry.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onEditEntry(entry)}
                          className="p-1.5 text-outline-variant hover:text-primary hover:bg-surface-container-highest rounded-full transition-all"
                          title="Modifica"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-on-surface leading-snug">
                      {entry.note || "Nessuna nota aggiunta."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-28 left-0 right-0 w-full max-w-[430px] mx-auto z-40 pointer-events-none flex justify-end px-6">
        <button 
          onClick={onAddEntry}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
}
