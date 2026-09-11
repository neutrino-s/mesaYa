import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { PedidoBoardFilters } from '../components/PedidoBoardFilters'
import { PedidoColumn } from '../components/PedidoColumn'
import { agruparPedidosPorColumna, columnasVisibles } from '../domain/pedidoBoardRules'
import type { PedidoBoardFiltro } from '../domain/types'
import { usePedidosEnVivo } from '../hooks/usePedidosEnVivo'

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

/** Tablero de "Pedidos en vivo": una columna por estado de la comanda
 * (pendiente → en preparación → listo → entregado), con filtro rápido para
 * ver todas en simultáneo o discriminar por una sola. */
export function PedidosPage() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: pedidos, isPending } = usePedidosEnVivo(restauranteId)
  const { data: staff } = useStaffList(restauranteId)

  const [filtro, setFiltro] = useState<PedidoBoardFiltro>('todos')

  const mozoNombrePorId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of staff ?? []) map.set(member.id, member.nombre)
    return map
  }, [staff])

  const pedidosPorColumna = useMemo(() => agruparPedidosPorColumna(pedidos ?? []), [pedidos])
  const columnas = columnasVisibles(filtro)

  const isLoading = isLoadingRestaurante || isPending
  const hayPedidos = (pedidos?.length ?? 0) > 0

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl text-foreground">Pedidos en vivo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seguí cada pedido desde que llega hasta que se entrega en la mesa.
        </p>
      </header>

      <PedidoBoardFilters value={filtro} onChange={setFiltro} />

      {isLoading ? (
        <BoardSkeleton />
      ) : !hayPedidos ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay pedidos en curso"
          description="En cuanto un comensal haga un pedido, va a aparecer acá."
        />
      ) : columnas.length === 1 ? (
        // Un solo estado filtrado: centrado y con ancho de columna, no
        // estirado a todo el ancho de la pantalla (se ve como una card
        // gigante con espacio en blanco de sobra).
        <div className="mx-auto w-full max-w-md">
          <PedidoColumn
            columna={columnas[0]}
            pedidos={pedidosPorColumna[columnas[0].id]}
            mozoNombrePorId={mozoNombrePorId}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {columnas.map((columna) => (
            <PedidoColumn
              key={columna.id}
              columna={columna}
              pedidos={pedidosPorColumna[columna.id]}
              mozoNombrePorId={mozoNombrePorId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
