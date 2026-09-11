import { useDraggable } from '@dnd-kit/core'

import { cn } from '@/lib/utils'
import type { FormaMesa } from '@/types/mesa'

import { SHAPE_ICONS } from './shapeIcons'
import { SHAPE_LABELS, SHAPE_OPTIONS } from '../domain/tableShapes'

function PaletteItem({ forma }: { forma: FormaMesa }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${forma}`,
    data: { source: 'palette', forma },
  })
  const Icon = SHAPE_ICONS[forma]

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-sm transition-opacity',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
    >
      <Icon className="size-6 text-primary" />
      {SHAPE_LABELS[forma]}
    </button>
  )
}

/** Panel izquierdo del lienzo: una figura arrastrable por forma. Soltarla
 * sobre el lienzo crea una mesa nueva (ver `SalonCanvasPage.onDragEnd`). */
export function ShapePalette() {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-40">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Elementos
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
        {SHAPE_OPTIONS.map((forma) => (
          <PaletteItem key={forma} forma={forma} />
        ))}
      </div>
    </div>
  )
}
