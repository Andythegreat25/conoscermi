/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Con registerType 'prompt' l'app chiede alla nuova versione di attivarsi con
// questo messaggio. Senza gestore la versione nuova resterebbe in attesa finché
// non si chiudono tutte le schede, e l'app non si aggiornerebbe mai.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

interface ReminderPushPayload {
  title?: string;
  body?: string;
  tag?: string;
  url?: string;
}

function readPushPayload(event: PushEvent): ReminderPushPayload {
  if (!event.data) return {};

  try {
    return event.data.json() as ReminderPushPayload;
  } catch {
    return { body: event.data.text() };
  }
}

/** A push event wakes this worker even when the web app is closed. */
self.addEventListener('push', (event: PushEvent) => {
  const payload = readPushPayload(event);
  const iconUrl = new URL('icon.svg', self.registration.scope).href;

  event.waitUntil(self.registration.showNotification(payload.title || 'Conoscermi', {
    body: payload.body || 'Prenditi un momento per te. 🌱',
    icon: iconUrl,
    badge: iconUrl,
    tag: payload.tag || 'conoscermi-reminder',
    data: {
      url: new URL(payload.url || './', self.registration.scope).href,
    },
  }));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const destination = event.notification.data?.url || self.registration.scope;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if ('navigate' in client) await (client as WindowClient).navigate(destination);
      if ('focus' in client) return (client as WindowClient).focus();
    }
    return self.clients.openWindow(destination);
  })());
});
