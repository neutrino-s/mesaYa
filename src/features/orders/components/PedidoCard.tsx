import { format } from 'date-fns'
import { AlertTriangle, ChevronDown, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatPrecio } from '@/features/menu/domain/cartaRules'
import { cn } from '@/lib/utils'
import type { Pedido } from '@/types/pedido'

import { detalleDeItem, estaPagadoOnline, observacionesDePedido } from '../domain/pedidoBoardRules'
import { precioTotalItem } from '../domain/pedidoRules'

interface PedidoCardProps {
  pedido: Pedido
  /** `null` tanto si no hay mozo asignado como si el asignado ya no está
   * en la lista de staff cargada (no debería pasar en operación normal). */
  mozoNombre: string | null
}

/** Una comanda en el tablero de "Pedidos en vivo". Colapsada muestra solo el
 * resumen (mesa, mozo, hora, total) para que el tablero no crezca sin
 * límite con muchos pedidos activos a la vez; un click despliega el detalle
 * de lo pedido (items, opciones elegidas y observación del comensal). */
export function PedidoCard({ pedido, mozoNombre }: PedidoCardProps) {
  const [expandido, setExpandido] = useState(false)
  const observaciones = observacionesDePedido(pedido)
  const pagado = estaPagadoOnline(pedido)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpandido((prev) => !prev)}
        aria-expanded={expandido}
        className="flex w-full flex-col gap-2 p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base text-foreground">Mesa {pedido.mesaNumero}</h3>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <span className="text-xs text-muted-foreground">
              {format(pedido.createdAt.toDate(), 'HH:mm')}
            </span>
            <ChevronDown
              size={16}
              className={cn('text-muted-foreground transition-transform', expandido && 'rotate-180')}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User size={14} />
            {mozoNombre ?? 'Sin mozo asignado'}
          </span>
          <div className="flex items-center gap-2">
            {pagado && <Badge className="bg-primary/10 text-primary">Pagado</Badge>}
            <span className="text-sm font-medium text-foreground">{formatPrecio(pedido.total)}</span>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-border px-4 pt-3 pb-4">
              <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                {pedido.items.map((item) => {
                  const detalle = detalleDeItem(item)
                  return (
                    <li key={item.id} className="flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <span className="text-muted-foreground">{item.cantidad}x</span>
                          {item.productoNombre}
                        </div>
                        <span className="shrink-0 text-muted-foreground">
                          {formatPrecio(precioTotalItem(item))}
                        </span>
                      </div>
                      {detalle && <p className="pl-5 text-xs text-muted-foreground">{detalle}</p>}
                    </li>
                  )
                })}
              </ul>

              {observaciones.length > 0 && (
                <div className="flex items-start gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{observaciones.join(' • ')}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
