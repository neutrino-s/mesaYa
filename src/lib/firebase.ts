import { type FirebaseOptions, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { type Functions, getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// La apiKey de Firebase es pública por diseño: quien protege los datos son
// las reglas de Firestore/Storage, no este archivo. Igual se lee de env para
// no atar el código fuente a un proyecto de Firebase puntual.
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

// A diferencia de `getFirestore`/`getStorage`, `getAuth` valida la apiKey al
// llamarse y tira una excepción síncrona si falta o es inválida — eso se
// hereda al primer import de este módulo y tira abajo toda la app. Mientras
// no haya variables VITE_FIREBASE_* cargadas (todavía no se creó el proyecto
// de Firebase de mesaYa), se deja en `null`; `authRepository` avisa con un
// error de pantalla en vez de romper el render.
export const auth: Auth | null = isFirebaseConfigured ? getAuth(app) : null

// Mismo motivo/guard que `auth`: se necesita para invocar Cloud Functions
// callables (ej. `crearStaff`) desde el cliente.
export const functions: Functions | null = isFirebaseConfigured ? getFunctions(app) : null
