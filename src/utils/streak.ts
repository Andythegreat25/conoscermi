import { DiaryEntry } from '../types';

/**
 * Serie di giorni con check-in, con un giorno di pausa a settimana.
 *
 * Regola: una volta per settimana (da lunedì a domenica) un solo giorno senza check-in non
 * azzera la serie. Due giorni di fila mancanti la azzerano comunque, e una seconda lacuna
 * nella stessa settimana pure. Il giorno di pausa non fa salire il numero: la serie conta
 * solo i giorni in cui hai fatto il check-in.
 *
 * Il calcolo va in avanti, dal primo giorno a oggi, così una pausa già usata non cambia
 * significato quando passano i giorni.
 */

const DAY_MS = 86_400_000;

/** Numero progressivo del giorno di calendario locale. Passa da UTC, quindi l'ora legale non pesa. */
function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** Numero del lunedì della settimana a cui appartiene il giorno. */
function weekOf(day: number): number {
  const weekday = new Date(day * DAY_MS).getUTCDay(); // 0 = domenica
  return day - ((weekday + 6) % 7);
}

const WEEKDAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

/** Nome del giorno della settimana, in italiano. */
export function weekdayName(day: number): string {
  return WEEKDAYS[new Date(day * DAY_MS).getUTCDay()];
}

/** I giorni di calendario con almeno un check-in vero (le sole note serali non contano). */
function checkinDays(entries: DiaryEntry[]): number[] {
  const days = new Set<number>();
  for (const e of entries ?? []) {
    if (e.eveningNoteOnly) continue;
    days.add(dayNumber(new Date(e.timestamp)));
  }
  return [...days].sort((a, b) => a - b);
}

export interface StreakDetails {
  /** Serie in corso. */
  streak: number;
  /** Serie più lunga di sempre. */
  record: number;
  /** Il giorno di pausa già usato questa settimana (se la serie è viva), come numero di giorno. */
  pauseDay: number | null;
  /** Ieri non c'è stato il check-in e la pausa lo copre: oggi si riparte. */
  pausedYesterday: boolean;
  /** Questa settimana la pausa si può ancora usare. */
  pauseAvailable: boolean;
}

export function streakDetails(entries: DiaryEntry[], now: Date = new Date()): StreakDetails {
  const days = checkinDays(entries);
  const today = dayNumber(now);
  const empty: StreakDetails = { streak: 0, record: 0, pauseDay: null, pausedYesterday: false, pauseAvailable: true };
  if (days.length === 0) return empty;

  const pauseByWeek = new Map<number, number>(); // lunedì della settimana → giorno perdonato
  let run = 0;
  let record = 0;
  let last = days[0];

  days.forEach((d, i) => {
    if (i === 0) {
      run = 1;
    } else {
      const gap = d - last - 1;
      if (gap === 0) {
        run += 1;
      } else if (gap === 1 && !pauseByWeek.has(weekOf(d - 1))) {
        pauseByWeek.set(weekOf(d - 1), d - 1);
        run += 1;
      } else {
        run = 1;
      }
    }
    record = Math.max(record, run);
    last = d;
  });

  // Com'è la serie oggi? Oggi può essere ancora aperto: la giornata non è finita.
  const gapToday = today - last - 1;
  let streak = 0;
  let pausedYesterday = false;
  if (gapToday <= 0) {
    streak = run;
  } else if (gapToday === 1 && !pauseByWeek.has(weekOf(today - 1))) {
    // Ieri è mancato, oggi non ancora: la pausa lo copre se è libera
    streak = run;
    pausedYesterday = true;
    pauseByWeek.set(weekOf(today - 1), today - 1);
  }

  const thisWeek = weekOf(today);
  const pauseDay = streak > 0 ? (pauseByWeek.get(thisWeek) ?? null) : null;
  return {
    streak,
    record: Math.max(record, streak),
    pauseDay,
    pausedYesterday,
    pauseAvailable: !pauseByWeek.has(thisWeek),
  };
}

/** Serie in corso (con il giorno di pausa a settimana). */
export function calculateStreak(entries: DiaryEntry[]): number {
  return streakDetails(entries).streak;
}

/**
 * Serie più lunga di sempre, calcolata su tutta la storia.
 * I traguardi usano questo valore: una volta ottenuti non si perdono mai.
 */
export function calculateMaxStreak(entries: DiaryEntry[]): number {
  return streakDetails(entries).record;
}

/** True se oggi hai già fatto un check-in vero. */
export function hasCheckedInToday(entries: DiaryEntry[]): boolean {
  const today = dayNumber(new Date());
  return checkinDays(entries).includes(today);
}
