const DB_NAME = 'conoscermi-db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('reminder-settings')) {
        db.createObjectStore('reminder-settings');
      }
      if (!db.objectStoreNames.contains('checkin-dates')) {
        db.createObjectStore('checkin-dates');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGet<T>(storeName: string, key: string): Promise<T | null> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  }));
}

function dbSet(storeName: string, key: string, value: unknown): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
}

export function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  return dbSet('reminder-settings', 'main', settings);
}

export function getReminderSettings(): Promise<ReminderSettings | null> {
  return dbGet<ReminderSettings>('reminder-settings', 'main');
}

export function saveEveningReminderSettings(settings: ReminderSettings): Promise<void> {
  return dbSet('reminder-settings', 'evening', settings);
}

export function getEveningReminderSettings(): Promise<ReminderSettings | null> {
  return dbGet<ReminderSettings>('reminder-settings', 'evening');
}

/** Store today's date in YYYY-MM-DD format so the SW can verify the check-in. */
export function saveCheckinDate(dateStr: string): Promise<void> {
  return dbGet<string[]>('checkin-dates', 'dates').then(existing => {
    const dates = existing ?? [];
    if (!dates.includes(dateStr)) {
      // Keep only the last 7 dates to avoid unbounded growth
      const updated = [dateStr, ...dates].slice(0, 7);
      return dbSet('checkin-dates', 'dates', updated);
    }
  });
}

export function getCheckinDates(): Promise<string[]> {
  return dbGet<string[]>('checkin-dates', 'dates').then(d => d ?? []);
}
