import {
  buildPushPayload,
  type PushSubscription,
  type VapidKeys,
} from '@block65/webcrypto-web-push';
import { createRemoteJWKSet, jwtVerify } from 'jose';

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  /** Segreto Cloudflare (wrangler secret put GEMINI_API_KEY). Non va mai nel codice dell'app. */
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

interface StoredSubscription {
  id: string;
  uid: string;
  client_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  morning_enabled: number;
  morning_hour: number;
  evening_enabled: number;
  evening_hour: number;
  last_checkin_date: string | null;
  last_evening_note_date: string | null;
  sent_morning_date: string | null;
  sent_evening_date: string | null;
}

interface LocalClock {
  date: string;
  hour: number;
}

const firebaseKeys = createRemoteJWKSet(new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
));

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): HeadersInit {
  return origin ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  } : {};
}

function response(body: unknown, status: number, origin: string | null): Response {
  return Response.json(body, { status, headers: corsHeaders(origin) });
}

async function authenticate(request: Request, env: Env): Promise<string> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');

  const token = authorization.slice('Bearer '.length);
  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new Error('UNAUTHENTICATED');
    return payload.sub;
  } catch {
    throw new Error('UNAUTHENTICATED');
  }
}

function readClientId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9-]{36}$/i.test(value)) throw new Error('INVALID_CLIENT');
  return value;
}

function readHour(value: unknown, fallback: number): number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 23
    ? Number(value)
    : fallback;
}

function readTimezone(value: unknown): string {
  const timezone = typeof value === 'string' && value.length <= 100 ? value : 'Europe/Rome';
  new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  return timezone;
}

function readSubscription(value: unknown): PushSubscription {
  const candidate = value as Partial<PushSubscription> | null;
  if (
    !candidate ||
    typeof candidate.endpoint !== 'string' ||
    candidate.endpoint.length > 2048 ||
    !candidate.endpoint.startsWith('https://') ||
    !candidate.keys ||
    typeof candidate.keys.p256dh !== 'string' ||
    typeof candidate.keys.auth !== 'string' ||
    candidate.keys.p256dh.length > 512 ||
    candidate.keys.auth.length > 256
  ) throw new Error('INVALID_SUBSCRIPTION');

  return {
    endpoint: candidate.endpoint,
    expirationTime: candidate.expirationTime ?? null,
    keys: { p256dh: candidate.keys.p256dh, auth: candidate.keys.auth },
  };
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('INVALID_JSON');
  return request.json() as Promise<Record<string, unknown>>;
}

async function savePreferences(request: Request, env: Env, origin: string): Promise<Response> {
  const uid = await authenticate(request, env);
  const data = await readJson(request);
  const clientId = readClientId(data.clientId);
  const subscription = readSubscription(data.subscription);
  const id = `${uid}:${clientId}`;

  await env.DB.prepare(`
    INSERT INTO push_subscriptions (
      id, uid, client_id, endpoint, p256dh, auth, timezone,
      morning_enabled, morning_hour, evening_enabled, evening_hour, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      endpoint = excluded.endpoint,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      timezone = excluded.timezone,
      morning_enabled = excluded.morning_enabled,
      morning_hour = excluded.morning_hour,
      evening_enabled = excluded.evening_enabled,
      evening_hour = excluded.evening_hour,
      updated_at = excluded.updated_at
  `).bind(
    id,
    uid,
    clientId,
    subscription.endpoint,
    subscription.keys.p256dh,
    subscription.keys.auth,
    readTimezone(data.timezone),
    data.morningEnabled === true ? 1 : 0,
    readHour(data.morningHour, 9),
    data.eveningEnabled === true ? 1 : 0,
    readHour(data.eveningHour, 21),
    Date.now(),
  ).run();

  return response({ ok: true }, 200, origin);
}

async function recordActivity(request: Request, env: Env, origin: string): Promise<Response> {
  const uid = await authenticate(request, env);
  const data = await readJson(request);
  const clientId = readClientId(data.clientId);
  const type = data.type;
  const date = data.date;
  if ((type !== 'checkin' && type !== 'evening-note') || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('INVALID_ACTIVITY');
  }

  const column = type === 'checkin' ? 'last_checkin_date' : 'last_evening_note_date';
  await env.DB.prepare(`UPDATE push_subscriptions SET ${column} = ?, updated_at = ? WHERE id = ? AND uid = ?`)
    .bind(date, Date.now(), `${uid}:${clientId}`, uid)
    .run();

  return response({ ok: true }, 200, origin);
}

/** Elimina dal server l'abbonamento di questo dispositivo (usato da "Cancella tutto" nell'app). */
async function removeSubscription(request: Request, env: Env, origin: string): Promise<Response> {
  const uid = await authenticate(request, env);
  const data = await readJson(request);
  const clientId = readClientId(data.clientId);

  await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ? AND uid = ?')
    .bind(`${uid}:${clientId}`, uid)
    .run();

  return response({ ok: true }, 200, origin);
}

function localClock(timestamp: number, timezone: string): LocalClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || '';
  return { date: `${part('year')}-${part('month')}-${part('day')}`, hour: Number(part('hour')) };
}

async function claimReminder(env: Env, device: StoredSubscription, kind: 'morning' | 'evening', date: string): Promise<boolean> {
  const column = kind === 'morning' ? 'sent_morning_date' : 'sent_evening_date';
  const result = await env.DB.prepare(
    `UPDATE push_subscriptions SET ${column} = ? WHERE id = ? AND (${column} IS NULL OR ${column} != ?)`,
  ).bind(date, device.id, date).run();
  return (result.meta.changes ?? 0) === 1;
}

async function releaseClaim(env: Env, id: string, kind: 'morning' | 'evening', date: string): Promise<void> {
  const column = kind === 'morning' ? 'sent_morning_date' : 'sent_evening_date';
  await env.DB.prepare(`UPDATE push_subscriptions SET ${column} = NULL WHERE id = ? AND ${column} = ?`)
    .bind(id, date).run();
}

async function sendReminder(env: Env, device: StoredSubscription, kind: 'morning' | 'evening'): Promise<Response> {
  const notification = kind === 'morning'
    ? {
        title: 'Conoscermi',
        body: 'Non hai ancora fatto il check-in oggi. Prenditi un momento per te. 🌱',
        tag: 'checkin-reminder',
        url: './#/checkin',
      }
    : {
        title: 'Conoscermi',
        body: 'Com’è andata oggi? Prenditi un momento per riflettere. 🌙',
        tag: 'evening-reminder',
        url: './',
      };
  const subscription: PushSubscription = {
    endpoint: device.endpoint,
    expirationTime: null,
    keys: { p256dh: device.p256dh, auth: device.auth },
  };
  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const payload = await buildPushPayload(
    { data: JSON.stringify(notification), options: { ttl: 60 * 60 } },
    subscription,
    vapid,
  );
  return fetch(subscription.endpoint, payload);
}

async function dispatchReminders(timestamp: number, env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM push_subscriptions WHERE morning_enabled = 1 OR evening_enabled = 1',
  ).all<StoredSubscription>();

  for (const device of results) {
    const clock = localClock(timestamp, device.timezone || 'Europe/Rome');
    const morningDue = device.morning_enabled === 1 && device.morning_hour === clock.hour && device.last_checkin_date !== clock.date;
    const eveningDue = device.evening_enabled === 1 && device.evening_hour === clock.hour && device.last_evening_note_date !== clock.date;

    for (const kind of (['morning', 'evening'] as const)) {
      if ((kind === 'morning' && !morningDue) || (kind === 'evening' && !eveningDue)) continue;
      if (!await claimReminder(env, device, kind, clock.date)) continue;

      try {
        const pushResponse = await sendReminder(env, device, kind);
        if (pushResponse.status === 404 || pushResponse.status === 410) {
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(device.id).run();
        } else if (!pushResponse.ok) {
          await releaseClaim(env, device.id, kind, clock.date);
          console.error('Push provider rejected notification', pushResponse.status, await pushResponse.text());
        }
      } catch (error) {
        await releaseClaim(env, device.id, kind, clock.date);
        console.error('Unable to send push notification', error);
      }
    }
  }
}

// ── Echi del Cuore ────────────────────────────────────────────────────────
// Il browser non riceve mai la chiave di Gemini: manda qui il messaggio e il Worker
// chiama Gemini. Il prompt lo costruisce il Worker, così l'endpoint non si può usare
// come accesso libero a Gemini, e ogni utente ha un limite giornaliero.

const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
// Limiti giornalieri su tre livelli. Il solo limite per utente non basta: l'accesso anonimo
// di Firebase è aperto a tutti, quindi chiunque può crearsi quanti utenti vuole. Il limite
// per indirizzo di rete e quello globale fissano il massimo che questo endpoint può costare.
const ECHO_LIMITS = { user: 100, ip: 300, global: 1500 };
const ECHO_MAX_NAME = 80;
const ECHO_MAX_MESSAGE = 2000;
const ECHO_MAX_CONTEXT = 12000;

let echoTableReady = false;

async function ensureEchoTable(env: Env): Promise<void> {
  if (echoTableReady) return;
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS echo_usage (uid TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (uid, day))',
  ).run();
  echoTableReady = true;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface QuotaEntry {
  /** Chiave del contatore: utente, indirizzo di rete o "global". La colonna si chiama uid per storia. */
  key: string;
  limit: number;
}

function quotaEntries(uid: string, request: Request): QuotaEntry[] {
  // Cloudflare imposta sempre CF-Connecting-IP con l'indirizzo reale del chiamante
  const ip = request.headers.get('CF-Connecting-IP') || 'sconosciuto';
  return [
    { key: `u:${uid}`, limit: ECHO_LIMITS.user },
    { key: `ip:${ip}`, limit: ECHO_LIMITS.ip },
    { key: 'global', limit: ECHO_LIMITS.global },
  ];
}

/**
 * Conta una richiesta su tutti e tre i livelli. Se uno è già al limite non consuma niente
 * (restituisce i conteggi già presi) e risponde false.
 */
async function consumeEchoQuota(env: Env, entries: QuotaEntry[]): Promise<boolean> {
  await ensureEchoTable(env);
  const taken: string[] = [];
  for (const { key, limit } of entries) {
    const result = await env.DB.prepare(
      `INSERT INTO echo_usage (uid, day, count) VALUES (?, ?, 1)
       ON CONFLICT(uid, day) DO UPDATE SET count = count + 1 WHERE count < ?`,
    ).bind(key, today(), limit).run();
    if ((result.meta.changes ?? 0) !== 1) {
      await refundEchoQuota(env, taken);
      return false;
    }
    taken.push(key);
  }
  return true;
}

async function refundEchoQuota(env: Env, keys: string[]): Promise<void> {
  for (const key of keys) {
    await env.DB.prepare('UPDATE echo_usage SET count = MAX(count - 1, 0) WHERE uid = ? AND day = ?')
      .bind(key, today()).run();
  }
}

function readEchoText(value: unknown, max: number, truncateFromStart = false): string {
  if (typeof value !== 'string') throw new Error('INVALID_ECHO');
  const text = value.trim();
  if (!text) throw new Error('INVALID_ECHO');
  if (text.length <= max) return text;
  if (truncateFromStart) return text.slice(-max); // del contesto restano i messaggi più recenti
  throw new Error('INVALID_ECHO');
}

async function askGemini(env: Env, name: string, context: string, message: string): Promise<string> {
  const prompt = `Sei un'intelligenza artificiale che deve imitare lo stile di scrittura di una persona chiamata ${name}.
Ecco alcuni esempi dei suoi messaggi reali per capire il suo stile (emoji, lunghezza, tono, parole tipiche):
---
${context}
---
Regole:
1. Rispondi in modo breve e naturale, come in una chat WhatsApp.
2. Usa lo stesso tono (formale, informale, dolce, distaccato) degli esempi.
3. Usa le emoji se la persona le usava.
4. Non dire mai che sei un'IA. Sii ${name}.

Messaggio dell'utente: ${message}`;

  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY as string },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 512 },
      }),
    },
  );

  if (!upstream.ok) {
    // Si registra solo l'esito, mai il testo dell'utente
    console.error('Gemini ha risposto con errore', upstream.status, (await upstream.text()).slice(0, 200));
    throw new Error('UPSTREAM');
  }

  const data = await upstream.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();
  return text || '...';
}

async function echo(request: Request, env: Env, origin: string): Promise<Response> {
  const uid = await authenticate(request, env);
  const data = await readJson(request);
  const name = readEchoText(data.name, ECHO_MAX_NAME);
  const context = readEchoText(data.context, ECHO_MAX_CONTEXT, true);
  const message = readEchoText(data.message, ECHO_MAX_MESSAGE);

  if (!env.GEMINI_API_KEY) throw new Error('NOT_CONFIGURED');

  const quota = quotaEntries(uid, request);
  if (!await consumeEchoQuota(env, quota)) {
    return response({ error: 'Hai raggiunto il limite di messaggi di oggi. Riprova domani.' }, 429, origin);
  }

  try {
    return response({ text: await askGemini(env, name, context, message) }, 200, origin);
  } catch (error) {
    await refundEchoQuota(env, quota.map(entry => entry.key)); // un errore del servizio non consuma i limiti
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return origin ? new Response(null, { status: 204, headers: corsHeaders(origin) }) : new Response(null, { status: 403 });
    }
    if (url.pathname === '/health' && request.method === 'GET') return response({ ok: true }, 200, origin);
    if (url.pathname === '/config' && request.method === 'GET') return response({ publicKey: env.VAPID_PUBLIC_KEY }, 200, origin);
    if (!origin) return response({ error: 'Origin non autorizzata.' }, 403, null);

    try {
      if (url.pathname === '/preferences' && request.method === 'POST') return await savePreferences(request, env, origin);
      if (url.pathname === '/activity' && request.method === 'POST') return await recordActivity(request, env, origin);
      if (url.pathname === '/unsubscribe' && request.method === 'POST') return await removeSubscription(request, env, origin);
      if (url.pathname === '/echo' && request.method === 'POST') return await echo(request, env, origin);
      return response({ error: 'Endpoint non trovato.' }, 404, origin);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'UNAUTHENTICATED') {
        return response({ error: 'Autenticazione non valida.' }, 401, origin);
      }
      if (code === 'NOT_CONFIGURED') {
        return response({ error: 'Il servizio delle risposte non è ancora configurato.' }, 503, origin);
      }
      if (code === 'UPSTREAM') {
        return response({ error: 'Il servizio delle risposte non è disponibile in questo momento.' }, 502, origin);
      }
      if (code.startsWith('INVALID_') || error instanceof RangeError) return response({ error: 'Dati non validi.' }, 400, origin);
      console.error('Push API error', error);
      return response({ error: 'Errore interno.' }, 500, origin);
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(dispatchReminders(controller.scheduledTime, env));
    // Ogni ora toglie i conteggi dei giorni passati (ne bastano pochi giorni)
    ctx.waitUntil((async () => {
      try {
        await ensureEchoTable(env);
        const cutoff = new Date(controller.scheduledTime - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        await env.DB.prepare('DELETE FROM echo_usage WHERE day < ?').bind(cutoff).run();
      } catch (error) {
        console.error('Pulizia echo_usage non riuscita', error);
      }
    })());
  },
} satisfies ExportedHandler<Env>;
