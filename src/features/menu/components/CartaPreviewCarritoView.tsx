import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { CarritoPreviewItem } from '../domain/cartaPreviewRules'
import { calcularTotalCarrito } from '../domain/cartaPreviewRules'
import { formatPrecio } from '../domain/cartaRules'

interface CartaPreviewCarritoViewProps {
  carrito: CarritoPreviewItem[]
  onCantidadChange: (itemId: string, cantidad: number) => void
  onQuitar: (itemId: string) => void
  onConfirmar: () => void
}

function CarritoItemRow({
  item,
  onCantidadChange,
  onQuitar,
}: {
  item: CarritoPreviewItem
  onCantidadChange: (itemId: string, cantidad: number) => void
  onQuitar: (itemId: string) => void
}) {
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-heading text-sm text-foreground">{item.productoNombre}</span>
        {item.detalle.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
            {item.detalle.map((grupo, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                {grupo.grupoNombre}: {grupo.opciones.map((opcion) => opcion.nombre).join(', ')}
              </li>
            ))}
          </ul>
        ) : null}
        {item.comentario ? (
          <p className="text-xs text-muted-foreground italic">"{item.comentario}"</p>
        ) : null}
        <span className="mt-1 text-sm font-semibold text-foreground">
          {formatPrecio(item.precioUnitario * item.cantidad)}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <button
          type="button"
          onClick={() => onQuitar(item.id)}
          aria-label="Quitar del pedido"
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCantidadChange(item.id, item.cantidad - 1)}
            aria-label="Restar cantidad"
            className="flex size-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted/60"
          >
            <Minus size={14} />
          </button>
          <span className="w-4 text-center text-sm font-semibold text-foreground">{item.cantidad}</span>
          <button
            type="button"
            onClick={() => onCantidadChange(item.id, item.cantidad + 1)}
            aria-label="Sumar cantidad"
            className="flex size-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted/60"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Vista de "tu pedido" dentro de la previsualización de la carta — igual
 * de simulada que el resto: `onConfirmar` no crea ningún `Pedido` real, solo
 * avisa que es una prueba (ver `CartaPreviewDialog`). */
export function CartaPreviewCarritoView({
  carrito,
  onCantidadChange,
  onQuitar,
  onConfirmar,
}: CartaPreviewCarritoViewProps) {
  const total = calcularTotalCarrito(carrito)

  if (carrito.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <ShoppingCart className="text-muted-foreground" size={28} />
        <p className="text-sm text-muted-foreground">Todavía no agregaste ningún plato.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {carrito.map((item) => (
          <CarritoItemRow key={item.id} item={item} onCantidadChange={onCantidadChange} onQuitar={onQuitar} />
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="font-heading text-lg text-foreground">{formatPrecio(total)}</span>
        </div>
        <Button type="button" className="w-full" onClick={onConfirmar}>
          Confirmar pedido
        </Button>
      </div>
    </div>
  )
}
