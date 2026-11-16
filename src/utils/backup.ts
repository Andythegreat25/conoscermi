import { DiaryEntry, Mood } from '../types';

const VALID_MOODS: readonly Mood[] = ['Difficile', 'Arrabbiato', 'Neutro', 'Meglio', 'Forte'];

export interface ParsedBackup {
  valid: DiaryEntry[];
  skipped: number;
}

function toEntry(raw: unknown): DiaryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.id !== 'string' || r.id.length === 0) return null;
  if (typeof r.mood !== 'string' || !VALID_MOODS.includes(r.mood as Mood)) return null;
  if (typeof r.timestamp !== 'number' || !Number.isFinite(r.timestamp)) return null;
  if (typeof r.date !== 'string' || typeof r.time !== 'string') return null;
  if (typeof r.note !== 'string') return null;

  const entry: DiaryEntry = {
    id: r.id,
    mood: r.mood as Mood,
    timestamp: r.timestamp,
    date: r.date,
    time: r.time,
    note: r.note,
    uid: typeof r.uid === 'string' ? r.uid : 'local-user',
  };
  if (typeof r.eveningNote === 'string') entry.eveningNote = r.eveningNote;
  if (typeof r.eveningNoteOnly === 'boolean') entry.eveningNoteOnly = r.eveningNoteOnly;
  return entry;
}

/** Valida il contenuto di un backup JSON. Lancia un errore se non è un array. */
export function parseBackup(raw: unknown): ParsedBackup {
  if (!Array.isArray(raw)) throw new Error('Formato non valido');
  const valid: DiaryEntry[] = [];
  let skipped = 0;
  for (const item of raw) {
    const entry = toEntry(item);
    if (entry) valid.push(entry);
    else skipped += 1;
  }
  return { valid, skipped };
}

/**
 * Unisce le voci importate a quelle presenti senza duplicati (per id),
 * poi ordina dalla più recente alla più vecchia. Le voci esistenti hanno la precedenza.
 */
export function mergeEntries(
  existing: DiaryEntry[],
  incoming: DiaryEntry[],
): { merged: DiaryEntry[]; added: number } {
  const ids = new Set(existing.map((e) => e.id));
  const fresh: DiaryEntry[] = [];
  for (const entry of incoming) {
    if (!ids.has(entry.id)) {
      ids.add(entry.id);
      fresh.push(entry);
    }
  }
  const merged = [...existing, ...fresh].sort((a, b) => b.timestamp - a.timestamp);
  return { merged, added: fresh.length };
}
