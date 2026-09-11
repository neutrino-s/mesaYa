import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Pedido } from '@/types/pedido'

import type { PedidoBoardColumna } from '../domain/pedidoBoardRules'
import { PedidoCard } from './PedidoCard'

interface PedidoColumnProps {
  columna: PedidoBoardColumna
  pedidos: Pedido[]
  mozoNombrePorId: Map<string, string>
}

export function PedidoColumn({ columna, pedidos, mozoNombrePorId }: PedidoColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cn('size-2.5 rounded-full', columna.dotClassName)} />
        <h2 className="font-heading text-base text-foreground">{columna.titulo}</h2>
        <Badge className="bg-muted text-muted-foreground">{pedidos.length}</Badge>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          Sin pedidos
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              mozoNombre={pedido.mozoAsignadoId ? (mozoNombrePorId.get(pedido.mozoAsignadoId) ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
