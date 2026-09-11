import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CartaProducto } from '@/types/cartaProducto'
import type { CartaSeccion } from '@/types/cartaSeccion'

import { CartaProductoCard } from './CartaProductoCard'

interface CartaSeccionCardProps {
  seccion: CartaSeccion
  productos: CartaProducto[]
  onEdit: (seccion: CartaSeccion) => void
  onToggleActivo: (seccion: CartaSeccion) => void
  onAddProducto: (seccion: CartaSeccion) => void
  onEditProducto: (producto: CartaProducto) => void
  onDeleteProducto: (producto: CartaProducto) => void
  onToggleAgotadoProducto: (producto: CartaProducto) => void
}

export function CartaSeccionCard({
  seccion,
  productos,
  onEdit,
  onToggleActivo,
  onAddProducto,
  onEditProducto,
  onDeleteProducto,
  onToggleAgotadoProducto,
}: CartaSeccionCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-heading text-lg text-foreground">{seccion.nombre}</h3>
          {!seccion.activo ? (
            <Badge className="bg-muted text-muted-foreground">Inactiva</Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <button
            type="button"
            onClick={() => onEdit(seccion)}
            className="text-accent hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onToggleActivo(seccion)}
            className="text-accent hover:underline"
          >
            {seccion.activo ? 'Dar de baja' : 'Reactivar'}
          </button>
          <Button size="sm" variant="outline" onClick={() => onAddProducto(seccion)}>
            <Plus className="size-[18px]" />
            Agregar plato
          </Button>
        </div>
      </div>

      {productos.length === 0 ? (
        <p className={cn('rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground')}>
          Todavía no hay platos en esta sección.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {productos.map((producto) => (
            <CartaProductoCard
              key={producto.id}
              producto={producto}
              onEdit={onEditProducto}
              onDelete={onDeleteProducto}
              onToggleAgotado={onToggleAgotadoProducto}
            />
          ))}
        </div>
      )}
    </div>
  )
}
