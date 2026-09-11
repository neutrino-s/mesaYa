import { useMemo, useState } from 'react'

import type { Pedido } from '@/types/pedido'

import { agruparPedidosPorMesa } from '../domain/pedidoBoardRules'
import { MesaPedidosCard } from './MesaPedidosCard'
import { MesaPedidosDialog } from './MesaPedidosDialog'

interface MesasBoardProps {
  pedidos: Pedido[]
  mozoNombrePorId: Map<string, string>
}

/** Vista "Mesas" del tablero de "Pedidos en vivo": una card por mesa activa
 * (agrupando todos sus pedidos en curso) que al clickearla abre el detalle
 * completo — estado y timeline de cada pedido — en `MesaPedidosDialog`. */
export function MesasBoard({ pedidos, mozoNombrePorId }: MesasBoardProps) {
  const grupos = useMemo(() => agruparPedidosPorMesa(pedidos), [pedidos])
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string | null>(null)
  // Se busca por id en cada render (no se guarda el grupo entero en el
  // estado) para que el diálogo siga reflejando los cambios en vivo de la
  // mesa mientras está abierto.
  const grupoSeleccionado = grupos.find((grupo) => grupo.mesaId === mesaSeleccionadaId) ?? null

  function mozoNombre(mozoAsignadoId: string | null): string | null {
    return mozoAsignadoId ? mozoNombrePorId.get(mozoAsignadoId) ?? null : null
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {grupos.map((grupo) => (
          <MesaPedidosCard
            key={grupo.mesaId}
            grupo={grupo}
            mozoNombre={mozoNombre(grupo.mozoAsignadoId)}
            onClick={() => setMesaSeleccionadaId(grupo.mesaId)}
          />
        ))}
      </div>

      <MesaPedidosDialog
        grupo={grupoSeleccionado}
        mozoNombre={grupoSeleccionado ? mozoNombre(grupoSeleccionado.mozoAsignadoId) : null}
        onOpenChange={(open) => !open && setMesaSeleccionadaId(null)}
      />
    </>
  )
}
