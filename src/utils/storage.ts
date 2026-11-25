import { toast } from 'sonner';

/**
 * Tutto ciò che l'app ricorda sta in localStorage, che nel browser ha circa 5 MB.
 * Se lo spazio finisce, setItem lancia un errore: senza protezione l'errore bloccava l'app
 * (pagina bianca) e l'ultima modifica andava persa senza dire niente.
 */
let warned = false;

/** Salva un valore. Se lo spazio è finito lo dice una volta e restituisce false. */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Salvataggio non riuscito per', key, error);
    if (!warned) {
      warned = true;
      toast.error('Spazio esaurito su questo dispositivo', {
        id: 'storage-full',
        description:
          'Le ultime modifiche potrebbero non essere salvate. Esporta un backup dalle Impostazioni e libera spazio.',
        duration: 12000,
      });
    }
    return false;
  }
}

/**
 * Chiede al browser di non cancellare i dati dell'app quando manca spazio o dopo molti giorni
 * senza usarla. Restituisce true se la protezione è attiva.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

// ── Promemoria di backup ─────────────────────────────────────────────────────

const LAST_BACKUP_KEY = 'last_backup_at';
const SNOOZE_KEY = 'backup_snoozed_until';
const BACKUP_EVERY_DAYS = 30;
const MIN_ENTRIES_FOR_REMINDER = 5;
const SNOOZE_DAYS = 7;
const DAY_MS = 86_400_000;

export function markBackupDone(): void {
  safeSetItem(LAST_BACKUP_KEY, String(Date.now()));
  try {
    localStorage.removeItem(SNOOZE_KEY);
  } catch {
    /* noop */
  }
}

export function snoozeBackupReminder(): void {
  safeSetItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * DAY_MS));
}

export interface BackupReminder {
  /** Giorni dall'ultimo backup, o null se non ne hai mai fatto uno. */
  daysSince: number | null;
}

/**
 * Restituisce il promemoria da mostrare oppure null. Compare solo se ci sono abbastanza
 * voci da perdere, è passato un mese dall'ultimo backup e non l'hai rimandato di recente.
 */
export function getBackupReminder(entryCount: number, now = Date.now()): BackupReminder | null {
  if (entryCount < MIN_ENTRIES_FOR_REMINDER) return null;
  const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY)) || 0;
  if (now < snoozedUntil) return null;

  const last = Number(localStorage.getItem(LAST_BACKUP_KEY)) || 0;
  if (!last) return { daysSince: null };

  const daysSince = Math.floor((now - last) / DAY_MS);
  return daysSince >= BACKUP_EVERY_DAYS ? { daysSince } : null;
}
