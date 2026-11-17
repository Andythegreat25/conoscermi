# Conoscermi

Web app personale con diario, statistiche, serie di giorni consecutivi e promemoria push.

## Sviluppo locale

Prerequisito: Node.js.

1. Installa le dipendenze con `npm install`.
2. Copia `.env.example` in `.env.local` e configura le variabili necessarie.
3. Avvia l'app con `npm run dev`.

## Promemoria push in background

I promemoria usano Web Push, un Cloudflare Worker con esecuzione programmata e un
database D1. Il Worker controlla ogni ora l'orario locale del dispositivo e non
invia il promemoria se l'attività corrispondente è già stata registrata. Testo del
diario e umore restano nel browser e non vengono inviati al servizio push.

### Configurazione

1. Abilita l'accesso **Anonimo** in Firebase Authentication.
2. In `worker/wrangler.jsonc`, collega il database D1 e imposta le variabili pubbliche.
3. Salva la chiave VAPID privata come secret Cloudflare `VAPID_PRIVATE_KEY`: non va mai committata.
4. Salva la chiave di Gemini, usata dagli Echi del Cuore, come secret Cloudflare:
   `npx wrangler secret put GEMINI_API_KEY` dalla cartella `worker`. Non va mai nel codice
   dell'app, né in una variabile `VITE_…` o nelle variabili di Vercel: tutto ciò che
   finisce nell'app è leggibile da chiunque apra il sito. Il modello si può cambiare
   con la variabile `GEMINI_MODEL` in `worker/wrangler.jsonc`.
5. Distribuisci il Worker dalla cartella `worker` con `npm run deploy`.
6. Imposta `VITE_PUSH_API_URL` sull'indirizzo pubblico del Worker, quindi esegui
   `npm run build` e pubblica l'app (oggi su Vercel). Il Worker accetta solo gli indirizzi
   elencati in `ALLOWED_ORIGINS`.

Su iPhone/iPad serve iOS/iPadOS 16.4 o successivo e la web app deve essere aggiunta
alla schermata Home. Il permesso va richiesto usando l'interruttore nell'app.
