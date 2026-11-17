/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// La nuova versione si attiva subito, senza aspettare che l'app venga chiusa del tutto.
// Su telefono una PWA può restare "aperta" in background per giorni: se la nuova
// versione aspettasse, resterebbe in coda e vedresti sempre quella vecchia.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Resta anche il comando esplicito, usato dal pulsante "Controlla aggiornamenti".
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

// I file dell'esportazione PDF (circa 600 KB) non si scaricano con l'installazione: si scaricano
// la prima volta che esporti e da lì restano in cache, quindi poi funzionano anche offline.
registerRoute(
  ({ url }) => /\/assets\/(jspdf|html2canvas|purify|index\.es)[^/]*\.js$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'pdf-export',
    plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 24 * 60 * 60 })],
  }),
);

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
