import { format } from 'date-fns'
import { User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatPrecio } from '@/features/menu/domain/cartaRules'

import type { MesaPedidosGrupo } from '../domain/pedidoBoardRules'

interface MesaPedidosCardProps {
  grupo: MesaPedidosGrupo
  /** `null` tanto si no hay mozo asignado como si el asignado ya no está
   * en la lista de staff cargada. */
  mozoNombre: string | null
  onClick: () => void
}

/** Resumen de una mesa activa en la vista "Mesas" del tablero de "Pedidos
 * en vivo": mismo resumen que `PedidoCard` (mesa, hora, mozo, total), pero
 * agregando todos los pedidos en curso de la mesa en una sola card. El
 * detalle pedido por pedido se ve al clickearla, en `MesaPedidosDialog`. */
export function MesaPedidosCard({ grupo, mozoNombre, onClick }: MesaPedidosCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base text-foreground">Mesa {grupo.mesaNumero}</h3>
          {grupo.pedidos.length > 1 && (
            <Badge className="bg-muted text-muted-foreground">{grupo.pedidos.length} pedidos</Badge>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{format(grupo.creadoEn.toDate(), 'HH:mm')}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User size={14} />
          {mozoNombre ?? 'Sin mozo asignado'}
        </span>
        <span className="text-sm font-medium text-foreground">{formatPrecio(grupo.montoTotal)}</span>
      </div>
    </button>
  )
}
