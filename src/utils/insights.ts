import { DiaryEntry, Mood } from '../types';

/**
 * Calcoli leggeri sul diario, tutti in locale: capsula del tempo, riepilogo settimanale
 * e calendario dell'umore. Nessun dato lascia il dispositivo.
 */

const DAY_MS = 86_400_000;

export const MOOD_SCORES: Record<Mood, number> = {
  Difficile: 20,
  Arrabbiato: 40,
  Neutro: 60,
  Meglio: 80,
  Forte: 100,
};

const MOODS_BY_SCORE: Mood[] = ['Difficile', 'Arrabbiato', 'Neutro', 'Meglio', 'Forte'];

function startOfDay(value: Date | number): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Giorni di calendario tra due date (a - b), robusto al cambio di ora legale. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);
}

function dayKey(value: number | Date): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Una voce conta come check-in vero, a differenza di quelle create solo per la nota serale. */
function isCheckin(entry: DiaryEntry): boolean {
  return !entry.eveningNoteOnly;
}

function scoreToMood(score: number): Mood {
  const index = Math.min(MOODS_BY_SCORE.length - 1, Math.max(0, Math.round((score - 20) / 20)));
  return MOODS_BY_SCORE[index];
}

// ── Capsula del tempo ──────────────────────────────────────────────────────

export interface TimeCapsule {
  entry: DiaryEntry;
  daysAgo: number;
  label: string;
}

/** Dal più raro al più frequente: un anno fa vale più di un mese fa. */
const CAPSULE_TARGETS = [
  { days: 365, label: 'Un anno fa' },
  { days: 90, label: 'Tre mesi fa' },
  { days: 30, label: 'Un mese fa' },
];

/** Si accetta una voce anche a qualche giorno di distanza, perché nessuno scrive ogni giorno. */
const CAPSULE_MARGIN_DAYS = 3;

export function findTimeCapsule(entries: DiaryEntry[], now: Date = new Date()): TimeCapsule | null {
  if (!entries || entries.length === 0) return null;

  for (const target of CAPSULE_TARGETS) {
    let best: { entry: DiaryEntry; distance: number } | null = null;

    for (const entry of entries) {
      // Serve una nota vera: una voce vuota o fatta solo per la nota serale non dice niente
      if (!isCheckin(entry) || !entry.note?.trim()) continue;
      const distance = Math.abs(daysBetween(now, new Date(entry.timestamp)) - target.days);
      if (distance <= CAPSULE_MARGIN_DAYS && (!best || distance < best.distance)) {
        best = { entry, distance };
      }
    }

    if (best) return { entry: best.entry, daysAgo: target.days, label: target.label };
  }

  return null;
}

// ── Riepilogo settimanale ──────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'same';

export interface WeeklySummary {
  /** Giorni degli ultimi 7 (oggi compreso) in cui hai fatto almeno un check-in. */
  daysWithEntry: number;
  mostFrequentMood: Mood | null;
  /** Nome del giorno con l'umore medio più alto, per esempio "lunedì". */
  bestDay: string | null;
  /** Confronto con i 7 giorni precedenti. Null se manca uno dei due periodi. */
  trend: Trend | null;
}

function averageScore(entries: DiaryEntry[]): number | null {
  if (entries.length === 0) return null;
  return entries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / entries.length;
}

export function weeklySummary(entries: DiaryEntry[], now: Date = new Date()): WeeklySummary {
  const checkins = entries.filter(isCheckin);
  const age = (e: DiaryEntry) => daysBetween(now, new Date(e.timestamp));
  const thisWeek = checkins.filter((e) => age(e) >= 0 && age(e) <= 6);
  const lastWeek = checkins.filter((e) => age(e) >= 7 && age(e) <= 13);

  const daysWithEntry = new Set(thisWeek.map((e) => dayKey(e.timestamp))).size;

  // Umore più frequente. A parità vince quello con il punteggio più alto.
  const counts = new Map<Mood, number>();
  thisWeek.forEach((e) => counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1));
  let mostFrequentMood: Mood | null = null;
  counts.forEach((count, mood) => {
    if (
      mostFrequentMood === null ||
      count > (counts.get(mostFrequentMood) ?? 0) ||
      (count === counts.get(mostFrequentMood) && MOOD_SCORES[mood] > MOOD_SCORES[mostFrequentMood])
    ) {
      mostFrequentMood = mood;
    }
  });

  // Giorno migliore: umore medio più alto. A parità vince il più recente.
  const byDay = new Map<string, { scores: number[]; timestamp: number }>();
  thisWeek.forEach((e) => {
    const key = dayKey(e.timestamp);
    const slot = byDay.get(key) ?? { scores: [], timestamp: e.timestamp };
    slot.scores.push(MOOD_SCORES[e.mood]);
    slot.timestamp = Math.max(slot.timestamp, e.timestamp);
    byDay.set(key, slot);
  });
  let bestDay: string | null = null;
  let bestScore = -1;
  let bestTimestamp = 0;
  byDay.forEach(({ scores, timestamp }) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestScore || (avg === bestScore && timestamp > bestTimestamp)) {
      bestScore = avg;
      bestTimestamp = timestamp;
      bestDay = new Date(timestamp).toLocaleDateString('it-IT', { weekday: 'long' });
    }
  });

  const now7 = averageScore(thisWeek);
  const prev7 = averageScore(lastWeek);
  let trend: Trend | null = null;
  if (now7 !== null && prev7 !== null) {
    const diff = now7 - prev7;
    trend = diff >= 5 ? 'up' : diff <= -5 ? 'down' : 'same';
  }

  return { daysWithEntry, mostFrequentMood, bestDay, trend };
}

// ── Calendario dell'umore ──────────────────────────────────────────────────

export interface CalendarDay {
  key: string;
  date: Date;
  mood: Mood | null;
  /** Voce più recente di quel giorno, per aprirla nel Diario. */
  entryId: string | null;
  isToday: boolean;
  isFuture: boolean;
}

/** Ultime 5 settimane, con la settimana che inizia di lunedì. Oggi è sempre nell'ultima riga. */
export function moodCalendar(entries: DiaryEntry[], now: Date = new Date(), weeks = 5): CalendarDay[] {
  const today = startOfDay(now);
  const mondayIndex = (today.getDay() + 6) % 7; // lunedì = 0
  const start = new Date(today);
  start.setDate(start.getDate() - ((weeks - 1) * 7 + mondayIndex));

  const byDay = new Map<string, { scores: number[]; latest: DiaryEntry }>();
  entries.filter(isCheckin).forEach((e) => {
    const key = dayKey(e.timestamp);
    const slot = byDay.get(key);
    if (!slot) byDay.set(key, { scores: [MOOD_SCORES[e.mood]], latest: e });
    else {
      slot.scores.push(MOOD_SCORES[e.mood]);
      if (e.timestamp > slot.latest.timestamp) slot.latest = e;
    }
  });

  const days: CalendarDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dayKey(date);
    const slot = byDay.get(key);
    days.push({
      key,
      date,
      mood: slot ? scoreToMood(slot.scores.reduce((a, b) => a + b, 0) / slot.scores.length) : null,
      entryId: slot?.latest.id ?? null,
      isToday: key === dayKey(today),
      isFuture: date.getTime() > today.getTime(),
    });
  }
  return days;
}
