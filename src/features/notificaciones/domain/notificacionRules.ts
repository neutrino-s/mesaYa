// Lógica pura de notificaciones: sin React, sin Firebase. Se prueba sola.

import type { Notificacion } from '@/types/notificacion'

/** Más nuevas primero — orden de lectura natural en la campana. `createdAt`
 * puede llegar `null` un instante mientras el `serverTimestamp()` de una
 * notificación recién creada todavía no vuelve confirmado del servidor;
 * tratarla como "lo más nuevo" evita un crash sin depender de `Date.now()`
 * (impuro durante el render). */
export function ordenarPorFecha(notificaciones: Notificacion[]): Notificacion[] {
  return [...notificaciones].sort(
    (a, b) => (b.createdAt?.toMillis() ?? Infinity) - (a.createdAt?.toMillis() ?? Infinity),
  )
}

export function contarNoLeidas(notificaciones: Notificacion[]): number {
  return notificaciones.filter((notificacion) => !notificacion.leida).length
}
