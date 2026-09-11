import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { QrCode } from 'lucide-react'

import { cn } from '@/lib/utils'

import { SHAPE_SIZES } from '../domain/tableShapes'
import type { MesaLayoutItem } from '../domain/mesaLayoutRules'

interface PlacedMesaProps {
  item: MesaLayoutItem
  onClick: (item: MesaLayoutItem) => void
  /** `true` si la mesa ya tiene código QR generado (ver `SalonCanvasPage`,
   * que lo resuelve contra el `Mesa` persistido — `MesaLayoutItem` no lleva
   * este campo, es del ciclo operativo, no del diseño). */
  hasQr?: boolean
}

/** Mesa ya colocada en el lienzo: arrastrable para reposicionarla (el
 * `delta` final lo aplica `SalonCanvasPage.onDragEnd`), clickeable para
 * editar número/capacidad. */
export function PlacedMesa({ item, onClick, hasQr }: PlacedMesaProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.localId,
    data: { source: 'placed' },
  })
  const size = SHAPE_SIZES[item.forma]

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        'absolute flex flex-col items-center justify-center border-2 border-primary bg-secondary text-center text-primary shadow-sm',
        'cursor-grab touch-none active:cursor-grabbing',
        item.forma === 'redonda' ? 'rounded-full' : 'rounded-md',
        isDragging && 'z-10 opacity-80',
      )}
      style={{
        left: item.posicion.x,
        top: item.posicion.y,
        width: size.width,
        height: size.height,
        transform: CSS.Translate.toString(transform),
      }}
      {...attributes}
      {...listeners}
    >
      {hasQr && item.forma !== 'banos' ? (
        <span
          className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
          title="Tiene código QR"
        >
          <QrCode size={10} />
        </span>
      ) : null}
      {item.forma === 'banos' ? (
        <>
          <span className="absolute inset-x-2 top-1/2 h-px bg-primary" aria-hidden />
          <span className="text-xs leading-none font-medium">Baños</span>
        </>
      ) : (
        <>
          <span className="font-heading text-base leading-none">{item.numero}</span>
          <span className="text-xs leading-none">{item.capacidad}p</span>
        </>
      )}
    </button>
  )
}
