/**
 * Controllo versione indipendente dal service worker.
 *
 * A ogni build il sito pubblica /version.json con l'identificativo di quella build.
 * L'app confronta quell'identificativo con il proprio: se sono diversi, online c'è
 * una versione nuova. Non dipende dallo stato del service worker, che su telefono
 * può restare "in attesa" anche per ore.
 */

export interface BuildInfo {
  id: string;
  label: string;
  time: string;
}

export const CURRENT_BUILD: BuildInfo = {
  id: typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev',
  label: typeof __BUILD_LABEL__ === 'string' ? __BUILD_LABEL__ : 'dev',
  time: typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : '',
};

/** In sviluppo non esiste un version.json da confrontare. */
export const UPDATES_ENABLED = !import.meta.env.DEV;

/** Legge la versione pubblicata online. Restituisce null se offline o se la risposta non è valida. */
export async function fetchLatestBuild(timeoutMs = 8000): Promise<BuildInfo | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Parametro unico + no-store: mai una copia vecchia dalla cache del browser o del telefono
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.id !== 'string') return null;
    return { id: data.id, label: String(data.label ?? ''), time: String(data.time ?? '') };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

const ATTEMPT_KEY = 'update_attempt';
const ATTEMPT_COOLDOWN_MS = 3 * 60 * 1000;

/**
 * Evita un ciclo di ricaricamenti se, subito dopo un deploy, la rete serve ancora
 * i file vecchi: per la stessa versione non si riprova prima di 3 minuti.
 * Il pulsante manuale può ignorare questo limite.
 */
export function shouldAttemptUpdate(targetId: string): boolean {
  try {
    const last = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || 'null');
    if (last && last.id === targetId && Date.now() - last.at < ATTEMPT_COOLDOWN_MS) return false;
  } catch {
    /* sessionStorage non disponibile: si procede */
  }
  return true;
}

export function markUpdateAttempt(targetId: string) {
  try {
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ id: targetId, at: Date.now() }));
  } catch {
    /* noop */
  }
}

/**
 * Aggiornamento forzato: toglie il service worker e svuota le cache dell'app, poi ricarica
 * dalla rete. Non tocca localStorage, quindi diario, impostazioni e PIN restano.
 */
export async function hardUpdate(beforeReload?: () => void): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (error) {
    console.warn('Pulizia cache non riuscita, ricarico comunque', error);
  }
  beforeReload?.();
  window.location.reload();
}

export function formatBuildTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
