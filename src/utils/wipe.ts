import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { removePushSubscriptionFromServer } from './push';

/** Databases noti dell'app e di Firebase, usati se il browser non sa elencarli. */
const KNOWN_DATABASES = ['conoscermi-db', 'firebaseLocalStorageDb', 'firebase-heartbeat-database'];

/** Tutti i database IndexedDB di questo sito: appartengono solo all'app e a Firebase. */
async function listDatabases(): Promise<string[]> {
  try {
    const found = await indexedDB.databases?.();
    const names = (found ?? []).map((db) => db.name).filter((name): name is string => !!name);
    return Array.from(new Set([...KNOWN_DATABASES, ...names]));
  } catch {
    return KNOWN_DATABASES;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => window.setTimeout(resolve, ms))]);
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(name);
      // Anche se è bloccato o fallisce non si resta fermi: il resto è già stato cancellato
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Cancella tutto ciò che l'app ha su questo dispositivo e sul servizio notifiche:
 * diario, impostazioni, PIN, chat e profilo degli Echi, preferiti, abbonamento alle
 * notifiche (anche sul server) e l'accesso anonimo. Ogni passaggio prosegue anche se
 * uno precedente fallisce, per esempio senza rete.
 */
export async function wipeAllData(): Promise<void> {
  // 1) Abbonamento alle notifiche sul server (se serve la rete, al massimo 5 secondi)
  try {
    await withTimeout(removePushSubscriptionFromServer(), 5000);
  } catch (error) {
    console.warn('Abbonamento non eliminato dal server', error);
  }

  // 2) Abbonamento alle notifiche in questo browser
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch (error) {
    console.warn('Disiscrizione dalle notifiche non riuscita', error);
  }

  // 3) Accesso anonimo
  try {
    await withTimeout(signOut(auth), 3000);
  } catch {
    /* noop */
  }

  // 4) Tutto ciò che l'app ha salvato
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* noop */
  }
  await Promise.all((await listDatabases()).map(deleteDatabase));
}
