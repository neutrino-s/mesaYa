// Lógica pura del feature de auth: sin React, sin Firebase. Se prueba sola.

/** Deriva un nombre presentable de la parte local del correo:
 * `maria.gomez@resto.com` queda como "Maria Gomez". */
export function deriveDisplayNameFromEmail(rawEmail: string): string {
  const email = rawEmail.trim()
  if (email.length === 0) return 'Invitado'

  const words = email
    .split('@')[0]
    .split(/[._\-+]+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())

  return words.length === 0 ? 'Invitado' : words.join(' ')
}

/** Las iniciales del avatar. Dos letras como máximo. */
export function deriveInitials(displayName: string): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (words.length === 0) return '?'
  if (words.length === 1) {
    const word = words[0]
    return (word.length >= 2 ? word.slice(0, 2) : word).toUpperCase()
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

/** Traduce los códigos de error de Firebase Auth a algo que se pueda leer en
 * pantalla. Los mensajes dicen qué pasó y qué hacer, nada de "ocurrió un
 * error". */
export function mapAuthErrorCode(code: string | null): string {
  switch (code) {
    case 'app/not-configured':
      return 'Todavía no se configuró Firebase para este proyecto. Completá las variables VITE_FIREBASE_* en .env.local.'
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.'
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada. Hablá con el administrador del local.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Esperá unos minutos y volvé a probar.'
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisá la red y volvé a intentar.'
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Falta habilitar el ingreso con correo y contraseña en la consola de Firebase.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo. Iniciá sesión en su lugar.'
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usá al menos 6 caracteres.'
    default:
      return 'No pudimos completar la operación. Probá de nuevo.'
  }
}

/** Extrae el `code` de un error de Firebase sin importar el SDK acá: el
 * dominio no depende de Firebase, así que solo confía en la forma del
 * objeto. */
export function firebaseErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code
  }
  return null
}
