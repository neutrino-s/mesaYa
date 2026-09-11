import { cn } from '@/lib/utils'
import type { FormaMesa } from '@/types/mesa'

import { SHAPE_ICONS } from './shapeIcons'
import { SHAPE_SIZES } from '../domain/tableShapes'

interface PaletteDragPreviewProps {
  forma: FormaMesa
}

/** Clon flotante que sigue el cursor mientras se arrastra una figura desde
 * `ShapePalette` — dnd-kit no mueve el elemento de origen por sí solo, así
 * que sin esto el arrastre no da ningún feedback visual. Se monta dentro
 * de un `DragOverlay` en `SalonCanvasPage`. */
export function PaletteDragPreview({ forma }: PaletteDragPreviewProps) {
  const Icon = SHAPE_ICONS[forma]
  const size = SHAPE_SIZES[forma]

  return (
    <div
      className={cn(
        'flex items-center justify-center border-2 border-primary bg-secondary text-primary shadow-md',
        forma === 'redonda' ? 'rounded-full' : 'rounded-md',
      )}
      style={{ width: size.width, height: size.height }}
    >
      <Icon className="size-6" />
    </div>
  )
}
