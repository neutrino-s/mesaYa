import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { QrCode } from 'lucide-react'

import { cn } from '@/lib/utils'

import { BARRA_HEIGHT, BARRA_SECTION_WIDTH } from '../domain/tableShapes'
import type { MesaLayoutItem } from '../domain/mesaLayoutRules'

interface PlacedBarraProps {
  grupoId: string
  /** Ya ordenadas ascendente por `seccion`. */
  secciones: MesaLayoutItem[]
  onClick: (grupoId: string) => void
  /** `mesaId` -> `qrToken` de las mesas ya persistidas (ver
   * `SalonCanvasPage`), para marcar qué secciones ya tienen código QR. */
  qrTokenByMesaId: Map<string, string>
}

/** Barra ya colocada en el lienzo: un solo arrastrable para todo el grupo
 * (dnd-kit `id: grupo-${grupoId}`, para no confundirse con el `localId` de
 * una mesa suelta), dividida visualmente en tantos segmentos como
 * secciones tenga — cada una con su propio `numero` y su propio código QR
 * (generado a demanda desde "Editar Barra", no al guardar). Todas las
 * secciones comparten `posicion`/`rotacion` ("mirroring" continuo, ver
 * `mesaLayoutRules.ts`), así que cualquiera sirve como referencia para
 * dibujar el rectángulo completo. */
export function PlacedBarra({ grupoId, secciones, onClick, qrTokenByMesaId }: PlacedBarraProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `grupo-${grupoId}`,
    data: { source: 'grupo', grupoId },
  })

  const referencia = secciones[0]
  const horizontal = referencia.rotacion === 0
  const largo = BARRA_SECTION_WIDTH * secciones.length

  // Sin `transform: rotate()`: swappeamos width/height (y la dirección del
  // flex) para que `posicion` siga siendo literalmente la esquina superior
  // izquierda de lo que se ve, y el hit-box de dnd-kit (que mide el rect
  // sin rotar) coincida siempre con el dibujo.
  const width = horizontal ? largo : BARRA_HEIGHT
  const height = horizontal ? BARRA_HEIGHT : largo

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick(grupoId)}
      className={cn(
        'absolute flex overflow-hidden rounded-md border-2 border-primary bg-secondary text-primary shadow-sm',
        horizontal ? 'flex-row' : 'flex-col',
        'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'z-10 opacity-80',
      )}
      style={{
        left: referencia.posicion.x,
        top: referencia.posicion.y,
        width,
        height,
        transform: CSS.Translate.toString(transform),
      }}
      {...attributes}
      {...listeners}
    >
      {secciones.map((seccion, index) => {
        const hasQr = Boolean(seccion.mesaId && qrTokenByMesaId.has(seccion.mesaId))
        return (
          <span
            key={seccion.localId}
            className={cn(
              'flex flex-1 items-center justify-center gap-0.5 text-xs font-medium',
              index < secciones.length - 1 && (horizontal ? 'border-r-2' : 'border-b-2'),
              'border-primary/40',
            )}
          >
            {seccion.numero}
            {hasQr ? <QrCode size={10} /> : null}
          </span>
        )
      })}
    </button>
  )
}
