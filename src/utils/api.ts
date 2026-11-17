import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

/** Errore restituito dal Worker, con il codice HTTP e un messaggio già leggibile. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_PUSH_API_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error('Servizio non configurato.');
  return `${baseUrl}${path}`;
}

export async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) await signInAnonymously(auth);
}

/** POST JSON al Worker con il token anonimo di Firebase. */
export async function authenticatedPost<T = unknown>(path: string, body: unknown): Promise<T> {
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
    let message = '';
    try {
      const data = await response.json();
      if (typeof data?.error === 'string') message = data.error;
    } catch {
      /* risposta non JSON */
    }
    throw new ApiError(response.status, message || 'Il servizio non è raggiungibile.');
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}
