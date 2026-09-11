import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CartaProductoEtiqueta } from '@/types/cartaProducto'

import { ETIQUETA_CLASSNAME, ETIQUETA_LABEL } from '../domain/cartaProductoEtiquetas'

interface CartaProductoEtiquetaBadgeProps {
  etiqueta: CartaProductoEtiqueta
  className?: string
}

export function CartaProductoEtiquetaBadge({ etiqueta, className }: CartaProductoEtiquetaBadgeProps) {
  return <Badge className={cn(ETIQUETA_CLASSNAME[etiqueta], className)}>{ETIQUETA_LABEL[etiqueta]}</Badge>
}
