import { Moon, X, Send } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EveningNoteProps {
  existingNote?: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

const EVENING_PROMPTS = [
  "Com'è andata oggi?",
  "Cosa ti ha sorpreso oggi?",
  "Di cosa sei grata oggi?",
  "Qual è stato il momento più bello della giornata?",
  "C'è qualcosa che ti pesa ancora?",
  "Cosa vorresti lasciare andare prima di dormire?",
  "Cosa hai imparato oggi su di te?",
  "Come ti senti adesso, in questo momento?",
];

export function EveningNote({ existingNote, onSave, onClose }: EveningNoteProps) {
  const [note, setNote] = useState(existingNote || '');

  const today = new Date();
  const promptIndex = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) % EVENING_PROMPTS.length;
  const prompt = EVENING_PROMPTS[promptIndex];

  const handleSave = () => {
    const trimmed = note.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-[430px] bg-surface rounded-t-3xl p-6 pb-10 space-y-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-container/40 flex items-center justify-center text-tertiary">
                <Moon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Nota Serale</h3>
                <p className="text-xs text-on-surface-variant">
                  {today.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Prompt */}
          <p className="text-on-surface-variant italic text-base leading-relaxed">
            "{prompt}"
          </p>

          {/* Textarea */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
            rows={5}
            placeholder="Scrivi liberamente come stai..."
            className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface placeholder:text-outline/50 resize-none border-none focus:ring-2 focus:ring-tertiary/40 outline-none leading-relaxed"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold text-sm active:scale-95 transition-transform"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={!note.trim()}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-tertiary to-secondary text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {existingNote ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
