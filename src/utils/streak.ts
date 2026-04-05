import { DiaryEntry } from '../types';

/** Returns true if the entry counts as a real check-in (not an evening-note-only entry). */
function isRealCheckin(entry: DiaryEntry): boolean {
  return !entry.eveningNoteOnly;
}

function hasEntryForDay(entries: DiaryEntry[], d: Date): boolean {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return entries.some(
    e => isRealCheckin(e) && e.timestamp >= start.getTime() && e.timestamp <= end.getTime()
  );
}

/** Current consecutive-day streak (resets if you miss a day). */
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

/**
 * Maximum streak ever achieved — computed from the full entry history.
 * Badges use this value so they are NEVER taken away once earned.
 */
export function calculateMaxStreak(entries: DiaryEntry[]): number {
  const realEntries = entries.filter(isRealCheckin);
  if (realEntries.length === 0) return 0;

  // Collect unique calendar days as 'yyyy-mm-dd' strings
  const dateSet = new Set<string>();
  realEntries.forEach(e => {
    const d = new Date(e.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateSet.add(key);
  });

  const dates = Array.from(dateSet).sort(); // ascending

  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }

  // Also compare with current streak (handles today's check-in)
  const currentStreak = calculateStreak(entries);
  return Math.max(maxStreak, currentStreak);
}

/** True if the user has already done a real check-in today. */
export function hasCheckedInToday(entries: DiaryEntry[]): boolean {
  const today = new Date();
  return hasEntryForDay(entries, today);
}
