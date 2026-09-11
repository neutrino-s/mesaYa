import { Ban, MessageSquare, PackageCheck, Pencil, Trash2, UtensilsCrossed } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CartaProducto } from '@/types/cartaProducto'

import { formatPrecio } from '../domain/cartaRules'
import { contarOpcionesConfigurables } from '../domain/opcionesRules'
import { CartaProductoEtiquetaBadge } from './CartaProductoEtiquetaBadge'

interface CartaProductoCardProps {
  producto: CartaProducto
  onEdit: (producto: CartaProducto) => void
  onDelete: (producto: CartaProducto) => void
  onToggleAgotado: (producto: CartaProducto) => void
}

export function CartaProductoCard({ producto, onEdit, onDelete, onToggleAgotado }: CartaProductoCardProps) {
  const precio = formatPrecio(producto.precio)
  const cantidadOpciones = contarOpcionesConfigurables(producto.gruposOpciones)

  return (
    <div
      className={cn(
        'flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm',
        producto.agotado && 'opacity-60',
      )}
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 text-muted-foreground">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt="" className="size-full object-cover" />
        ) : (
          <UtensilsCrossed size={22} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate font-heading text-base text-foreground">
            {producto.nombre || <span className="text-muted-foreground italic">Sin nombre</span>}
          </h4>
          {producto.agotado ? <Badge className="bg-destructive/10 text-destructive">Agotado</Badge> : null}
          {producto.etiquetas.map((etiqueta) => (
            <CartaProductoEtiquetaBadge key={etiqueta} etiqueta={etiqueta} />
          ))}
          {producto.gruposOpciones.length > 0 ? (
            <Badge
              className="bg-muted text-muted-foreground"
              title={`${cantidadOpciones} opción${cantidadOpciones === 1 ? '' : 'es'} configurable${cantidadOpciones === 1 ? '' : 's'} en total`}
            >
              {producto.gruposOpciones.length} grupo{producto.gruposOpciones.length === 1 ? '' : 's'} de opciones
            </Badge>
          ) : null}
          {producto.permiteComentarios ? (
            <Badge className="gap-1 bg-muted text-muted-foreground" title="El comensal puede dejar un comentario">
              <MessageSquare size={12} />
              Comentario
            </Badge>
          ) : null}
        </div>
        {producto.descripcion ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{producto.descripcion}</p>
        ) : null}
        <span className="mt-auto text-sm font-semibold text-foreground">
          {precio ?? <span className="font-normal text-muted-foreground">Sin precio</span>}
        </span>
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => onToggleAgotado(producto)}
          aria-label={producto.agotado ? 'Marcar disponible' : 'Marcar agotado'}
          title={producto.agotado ? 'Marcar disponible' : 'Marcar agotado'}
          className={cn(
            'rounded-md p-1.5 hover:bg-muted/60',
            producto.agotado
              ? 'text-primary hover:text-primary'
              : 'text-muted-foreground hover:text-destructive',
          )}
        >
          {producto.agotado ? <PackageCheck size={18} /> : <Ban size={18} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit(producto)}
          aria-label="Editar plato"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(producto)}
          aria-label="Eliminar plato"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
