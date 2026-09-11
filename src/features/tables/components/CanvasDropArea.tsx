import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

export const CANVAS_DROPPABLE_ID = 'canvas-area'
export const CANVAS_WIDTH = 1200
export const CANVAS_HEIGHT = 800

interface CanvasDropAreaProps {
  /** El padre resuelve su propio ref acá en vez de recibir un `Ref` como
   * prop y mutarlo (evita mutar un valor recibido por props). */
  onCanvasNode: (node: HTMLDivElement | null) => void
  children: ReactNode
}

/** Lienzo del salón: al menos `CANVAS_WIDTH x CANVAS_HEIGHT` (con scroll si
 * no entra), pero crece a ocupar el 100% del contenedor cuando este es más
 * grande — así la grilla de fondo siempre cubre todo el área visible, sin
 * dejar una franja en blanco más allá de donde termina el tamaño fijo. */
export function CanvasDropArea({ onCanvasNode, children }: CanvasDropAreaProps) {
  const { setNodeRef } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
      <div
        ref={(node) => {
          setNodeRef(node)
          onCanvasNode(node)
        }}
        className="relative"
        style={{
          width: `max(100%, ${CANVAS_WIDTH}px)`,
          height: `max(100%, ${CANVAS_HEIGHT}px)`,
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {children}
      </div>
    </div>
  )
}
