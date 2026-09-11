/**
 * Utilidades de aleatoriedad puras (sin dependencias externas) para el
 * generador de pedidos de prueba (`scripts/lib/pedidoGenerator.ts`).
 */

/** Sin `seed`, usa `Math.random`. Con `seed`, un PRNG determinístico
 * (mulberry32) — mismo `seed` siempre genera el mismo set de pedidos, útil
 * para reproducir un caso puntual. */
export function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random

  let a = seed >>> 0
  return function mulberry32() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entero aleatorio en `[min, max]`, ambos extremos incluidos. */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function pickRandom<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Elige hasta `cantidad` elementos distintos de `items` (Fisher-Yates
 * parcial). Si `cantidad >= items.length`, devuelve todos en orden barajado. */
export function elegirNSinRepetir<T>(rng: () => number, items: readonly T[], cantidad: number): T[] {
  const copia = [...items]
  const limite = Math.min(cantidad, copia.length)
  for (let i = copia.length - 1; i > copia.length - 1 - limite; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia.slice(copia.length - limite)
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}
