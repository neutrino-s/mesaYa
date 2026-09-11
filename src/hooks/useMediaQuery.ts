import { useSyncExternalStore } from 'react'

/** Se suscribe a un media query y devuelve si matchea, sin duplicar el
 * árbol de widgets para cada breakpoint (a diferencia de ocultar con CSS,
 * que deja dos formularios montados a la vez con los mismos ids). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
