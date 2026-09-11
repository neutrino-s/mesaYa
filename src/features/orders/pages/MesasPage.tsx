import { Table2 } from 'lucide-react'
import { useMemo } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { MesasBoard } from '../components/MesasBoard'
import { usePedidosEnVivo } from '../hooks/usePedidosEnVivo'

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  )
}

/** Vista "Mesas": una card por mesa activa con todos sus pedidos en curso
 * agrupados — antes era un filtro más dentro de "Pedidos en vivo", ahora
 * vive como sección propia del sidebar (`MesasBoard`/`MesaPedidosDialog`
 * hacen el trabajo real, se reutilizan tal cual desde `orders`). */
export function MesasPage() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: pedidos, isPending } = usePedidosEnVivo(restauranteId)
  const { data: staff } = useStaffList(restauranteId)

  const mozoNombrePorId = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of staff ?? []) map.set(member.id, member.nombre)
    return map
  }, [staff])

  const isLoading = isLoadingRestaurante || isPending
  const hayPedidos = (pedidos?.length ?? 0) > 0

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl text-foreground">Mesas en vivo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado en vivo de cada mesa activa y sus pedidos en curso.
        </p>
      </header>

      {isLoading ? (
        <BoardSkeleton />
      ) : !hayPedidos ? (
        <EmptyState
          icon={Table2}
          title="No hay mesas activas"
          description="En cuanto una mesa tenga un pedido en curso, va a aparecer acá."
        />
      ) : (
        <MesasBoard pedidos={pedidos ?? []} mozoNombrePorId={mozoNombrePorId} />
      )}
    </div>
  )
}
