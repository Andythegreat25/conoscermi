/**
 * Gestione del PIN.
 *
 * Il PIN non si salva più in chiaro: si conserva un hash con sale (PBKDF2, 150.000
 * giri). I vecchi PIN in chiaro si convertono da soli al primo accesso riuscito.
 * Dopo 5 errori di fila scatta una pausa che raddoppia a ogni nuovo errore.
 *
 * Limite onesto: il PIN tiene fuori chi prende il telefono sbloccato per pochi minuti.
 * Non cifra il diario, che resta nel browser: chi ha accesso ai dati del dispositivo
 * può leggerli comunque.
 */

const HASH_KEY = 'user_pin_hash';
const SALT_KEY = 'user_pin_salt';
const LEGACY_KEY = 'user_pin'; // PIN in chiaro delle versioni precedenti
const THROTTLE_KEY = 'pin_throttle';
const AUTO_LOCK_KEY = 'auto_lock_minutes';
const ITERATIONS = 150_000;

export const PIN_KEYS = [HASH_KEY, SALT_KEY, LEGACY_KEY, THROTTLE_KEY];

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/** Confronto a tempo costante, per non rivelare quante cifre coincidono. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const hasCrypto = () => typeof crypto !== 'undefined' && !!crypto.subtle;

export function hasPin(): boolean {
  return !!localStorage.getItem(HASH_KEY) || !!localStorage.getItem(LEGACY_KEY);
}

export async function savePin(pin: string): Promise<void> {
  if (!hasCrypto()) {
    // Contesti senza Web Crypto (per esempio http non locale): si resta sul formato semplice
    localStorage.setItem(LEGACY_KEY, pin);
    return;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, toBase64(salt));
  localStorage.setItem(HASH_KEY, await derive(pin, salt));
  localStorage.removeItem(LEGACY_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = localStorage.getItem(HASH_KEY);
  const salt = localStorage.getItem(SALT_KEY);
  if (hash && salt && hasCrypto()) {
    return sameString(await derive(pin, fromBase64(salt)), hash);
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy !== null && sameString(legacy, pin)) {
    // Primo accesso con un PIN salvato in chiaro: lo si converte subito in hash
    if (hasCrypto()) await savePin(pin);
    return true;
  }
  return false;
}

export function removePin(): void {
  PIN_KEYS.forEach((key) => localStorage.removeItem(key));
}

// ── Pausa dopo troppi errori ─────────────────────────────────────────────────

interface Throttle {
  fails: number;
  until: number;
}

const FREE_ATTEMPTS = 5;
const BASE_PAUSE_MS = 30_000;
const MAX_PAUSE_MS = 15 * 60_000;

function readThrottle(): Throttle {
  try {
    const parsed = JSON.parse(localStorage.getItem(THROTTLE_KEY) || 'null');
    if (parsed && Number.isFinite(parsed.fails) && Number.isFinite(parsed.until)) return parsed;
  } catch {
    /* noop */
  }
  return { fails: 0, until: 0 };
}

/** Millisecondi che restano prima di poter riprovare (0 se si può provare). */
export function pinPauseRemaining(): number {
  return Math.max(0, readThrottle().until - Date.now());
}

/** Registra un errore. Restituisce la pausa in millisecondi che ne deriva (0 se ancora liberi). */
export function registerPinFailure(): number {
  const state = readThrottle();
  const fails = state.fails + 1;
  let pause = 0;
  if (fails >= FREE_ATTEMPTS) {
    pause = Math.min(BASE_PAUSE_MS * 2 ** (fails - FREE_ATTEMPTS), MAX_PAUSE_MS);
  }
  localStorage.setItem(THROTTLE_KEY, JSON.stringify({ fails, until: pause ? Date.now() + pause : 0 }));
  return pause;
}

export function registerPinSuccess(): void {
  localStorage.removeItem(THROTTLE_KEY);
}

// ── Blocco automatico ────────────────────────────────────────────────────────

export const AUTO_LOCK_OPTIONS = [
  { minutes: 0, label: 'Subito' },
  { minutes: 1, label: 'Dopo 1 minuto' },
  { minutes: 5, label: 'Dopo 5 minuti' },
  { minutes: -1, label: 'Mai' },
] as const;

/** Minuti fuori dall'app dopo i quali serve di nuovo il PIN. 0 = subito, -1 = mai. */
export function getAutoLockMinutes(): number {
  const value = Number(localStorage.getItem(AUTO_LOCK_KEY));
  return localStorage.getItem(AUTO_LOCK_KEY) !== null && AUTO_LOCK_OPTIONS.some((o) => o.minutes === value) ? value : 1;
}

export function setAutoLockMinutes(minutes: number): void {
  localStorage.setItem(AUTO_LOCK_KEY, String(minutes));
}
