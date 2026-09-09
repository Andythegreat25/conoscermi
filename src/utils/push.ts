import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

const CLIENT_ID_KEY = 'push_client_id';

export interface PushPreferences {
  morningEnabled: boolean;
  morningHour: number;
  eveningEnabled: boolean;
  eveningHour: number;
}

type PushConfigResponse = { publicKey: string };

function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_PUSH_API_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error('Servizio notifiche non configurato.');
  return `${baseUrl}${path}`;
}

function getClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const clientId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) await signInAnonymously(auth);
}

async function authenticatedRequest(path: string, body: unknown): Promise<void> {
  await ensureAuthenticated();
  const token = await auth.currentUser!.getIdToken();
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Il servizio notifiche non è raggiungibile.');
  }
}

function assertPushSupport(): void {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Le notifiche push non sono supportate su questo dispositivo.');
  }
}

async function getOrCreateSubscription(): Promise<PushSubscription> {
  assertPushSupport();
  await ensureAuthenticated();

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const response = await fetch(apiUrl('/config'));
  if (!response.ok) throw new Error('Configurazione Web Push non disponibile.');
  const config = await response.json() as PushConfigResponse;
  if (!config.publicKey) throw new Error('Chiave Web Push non configurata sul server.');

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(config.publicKey),
  });
}

/** Saves the device subscription and reminder schedule on the server. */
export async function syncPushPreferences(preferences: PushPreferences): Promise<void> {
  assertPushSupport();
  await ensureAuthenticated();

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if ((preferences.morningEnabled || preferences.eveningEnabled) && !subscription) {
    subscription = await getOrCreateSubscription();
  }

  // Nothing has ever been subscribed on this device, so there is no server state to disable.
  if (!subscription) return;

  await authenticatedRequest('/preferences', {
    clientId: getClientId(),
    subscription: subscription.toJSON(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
    ...preferences,
  });
}

export async function recordReminderActivity(
  type: 'checkin' | 'evening-note',
  date: string,
): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await ensureAuthenticated();
  await authenticatedRequest('/activity', { clientId: getClientId(), type, date });
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
