import { Martini, RectangleHorizontal, Square, Circle as CircleIcon, Toilet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { FormaMesa } from '@/types/mesa'

/** Compartido entre `ShapePalette` y `PaletteDragPreview` — en su propio
 * módulo porque un archivo con componentes solo puede exportar
 * componentes (react-refresh/only-export-components). */
export const SHAPE_ICONS: Record<FormaMesa, LucideIcon> = {
  cuadrada: Square,
  rectangular: RectangleHorizontal,
  redonda: CircleIcon,
  banos: Toilet,
  barra: Martini,
}
