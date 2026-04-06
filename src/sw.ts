import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Inject the precache manifest (filled by vite-plugin-pwa at build time)
precacheAndRoute(self.__WB_MANIFEST);

// ---------------------------------------------------------------------------
// In-memory state – updated by messages from the React app
// ---------------------------------------------------------------------------
let reminderEnabled = false;
let reminderHour = 9;
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let notifiedToday = '';   // "YYYY-MM-DD" of the last day a morning notification was shown

// Evening reminder state
let eveningReminderEnabled = false;
let eveningReminderHour = 21;
let eveningScheduledTimer: ReturnType<typeof setTimeout> | null = null;
let eveningNotifiedToday = '';   // "YYYY-MM-DD" of the last day an evening notification was shown

// ---------------------------------------------------------------------------
// Helper: today's date as "YYYY-MM-DD" (local time)
// ---------------------------------------------------------------------------
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Helper: read IndexedDB (available in SW context)
// ---------------------------------------------------------------------------
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.open('conoscermi-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('reminder-settings')) db.createObjectStore('reminder-settings');
      if (!db.objectStoreNames.contains('checkin-dates')) db.createObjectStore('checkin-dates');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCheckinDates(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('checkin-dates', 'readonly');
    const req = tx.objectStore('checkin-dates').get('dates');
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => resolve([]);
  });
}

async function getReminderSettings(): Promise<{ enabled: boolean; hour: number } | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('reminder-settings', 'readonly');
    const req = tx.objectStore('reminder-settings').get('main');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

async function getEveningReminderSettings(): Promise<{ enabled: boolean; hour: number } | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('reminder-settings', 'readonly');
    const req = tx.objectStore('reminder-settings').get('evening');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

// ---------------------------------------------------------------------------
// Core: decide whether to show the morning notification
// ---------------------------------------------------------------------------
async function maybeNotify(): Promise<void> {
  const settings = await getReminderSettings();
  if (!settings?.enabled) return;

  const today = todayKey();
  if (notifiedToday === today) return;   // Already notified today

  const checkinDates = await getCheckinDates();
  if (checkinDates.includes(today)) return;   // User already checked in today

  const now = new Date();
  if (now.getHours() < settings.hour) return;   // Too early

  notifiedToday = today;
  await self.registration.showNotification('Conoscermi', {
    body: 'Non hai ancora fatto il check-in oggi. Prenditi un momento per te. 🌱',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'checkin-reminder',
    renotify: false,
  });
}

// ---------------------------------------------------------------------------
// Core: decide whether to show the evening notification
// ---------------------------------------------------------------------------
async function maybeNotifyEvening(): Promise<void> {
  // Read settings from IndexedDB so they survive SW restarts
  const settings = await getEveningReminderSettings();
  if (!settings?.enabled) return;

  const today = todayKey();
  if (eveningNotifiedToday === today) return;   // Already notified today (in this SW lifetime)

  const now = new Date();
  if (now.getHours() < settings.hour) return;   // Too early

  eveningNotifiedToday = today;
  await self.registration.showNotification('Conoscermi', {
    body: 'Com\'è andata oggi? Prenditi un momento per riflettere. 🌙',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'evening-reminder',
    renotify: false,
  });
}

// ---------------------------------------------------------------------------
// Schedule a setTimeout for the next morning reminder (fires while SW is alive)
// ---------------------------------------------------------------------------
function scheduleTimer(hour: number, checkedInToday: boolean): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  if (checkedInToday) return;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);

  let msUntil = target.getTime() - now.getTime();
  if (msUntil < 0) {
    // Already past today's hour – schedule for tomorrow
    target.setDate(target.getDate() + 1);
    msUntil = target.getTime() - now.getTime();
  }

  scheduledTimer = setTimeout(() => {
    maybeNotify();
  }, msUntil);
}

// ---------------------------------------------------------------------------
// Schedule a setTimeout for the next evening reminder (fires while SW is alive)
// ---------------------------------------------------------------------------
function scheduleEveningTimer(hour: number): void {
  if (eveningScheduledTimer !== null) {
    clearTimeout(eveningScheduledTimer);
    eveningScheduledTimer = null;
  }

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);

  let msUntil = target.getTime() - now.getTime();
  if (msUntil < 0) {
    // Already past today's hour – schedule for tomorrow
    target.setDate(target.getDate() + 1);
    msUntil = target.getTime() - now.getTime();
  }

  eveningScheduledTimer = setTimeout(() => {
    maybeNotifyEvening();
  }, msUntil);
}

// ---------------------------------------------------------------------------
// Message handler – receives state from the React app
// ---------------------------------------------------------------------------
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;
  if (!data || data.type !== 'UPDATE_REMINDER') return;

  reminderEnabled = data.enabled ?? false;
  reminderHour = data.hour ?? 9;
  eveningReminderEnabled = data.eveningEnabled ?? false;
  eveningReminderHour = data.eveningHour ?? 21;
  const checkedInToday: boolean = data.checkedInToday ?? false;

  // Morning reminder
  if (reminderEnabled) {
    scheduleTimer(reminderHour, checkedInToday);
    // Check immediately in case we missed the notification while the SW was terminated
    maybeNotify();
  } else if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  // Evening reminder
  if (eveningReminderEnabled) {
    scheduleEveningTimer(eveningReminderHour);
    // Check immediately in case we missed the notification while the SW was terminated
    maybeNotifyEvening();
  } else if (eveningScheduledTimer !== null) {
    clearTimeout(eveningScheduledTimer);
    eveningScheduledTimer = null;
  }
});

// ---------------------------------------------------------------------------
// Periodic Background Sync handler (Android Chrome PWA)
// ---------------------------------------------------------------------------
self.addEventListener('periodicsync', (event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === 'checkin-reminder') {
    syncEvent.waitUntil(maybeNotify());
  }
  if (syncEvent.tag === 'evening-reminder') {
    syncEvent.waitUntil(maybeNotifyEvening());
  }
});

// ---------------------------------------------------------------------------
// Notification click – open or focus the app
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return (client as WindowClient).focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
