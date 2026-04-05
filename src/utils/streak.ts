import { DiaryEntry } from '../types';

function hasEntryForDay(entries: DiaryEntry[], d: Date): boolean {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return entries.some(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime());
}

export function calculateStreak(entries: DiaryEntry[]): number {
  if (!entries || entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(today);

  if (hasEntryForDay(entries, today)) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (hasEntryForDay(entries, yesterday)) {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      return 0;
    }
  }

  while (true) {
    if (hasEntryForDay(entries, currentDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function hasCheckedInToday(entries: DiaryEntry[]): boolean {
  const today = new Date();
  return hasEntryForDay(entries, today);
}
