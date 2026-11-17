import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// L'app usa Firebase solo per l'accesso anonimo, che serve a farsi riconoscere dal Worker.
// - Firestore non è usato: non va importato, perché aggiunge molto peso all'app.
// - getAuth() caricherebbe anche il supporto ad accesso con popup e reindirizzamenti, cioè uno
//   script di Google (apis.google.com) e un frame nascosto a ogni avvio. Qui non servono:
//   con initializeAuth si sceglie solo dove ricordare l'utente, le stesse posizioni di prima.
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
