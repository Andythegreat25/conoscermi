const CLIENT_ID_KEY = 'push_client_id';
const DEVICE_KEY = 'push_device_key';

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

function getDeviceKey(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const deviceKey = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, deviceKey);
  return deviceKey;
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function deviceRequest(path: string, body: unknown): Promise<void> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
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

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if ((preferences.morningEnabled || preferences.eveningEnabled) && !subscription) {
    subscription = await getOrCreateSubscription();
  }

  // Nothing has ever been subscribed on this device, so there is no server state to disable.
  if (!subscription) return;

  await deviceRequest('/preferences', {
    clientId: getClientId(),
    deviceKey: getDeviceKey(),
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

  await deviceRequest('/activity', {
    clientId: getClientId(),
    deviceKey: getDeviceKey(),
    type,
    date,
  });
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
