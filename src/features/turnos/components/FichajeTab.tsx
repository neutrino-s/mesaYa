import { useMemo } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { fechaId, puedeGestionarTurnos } from '../domain/cuadranteRules'
import { useCuadranteRange } from '../hooks/useCuadranteRange'
import { useFichajesDia } from '../hooks/useFichajesDia'
import { FichajesHoyTabla } from './FichajesHoyTabla'
import { MiFichajeCard } from './MiFichajeCard'

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

/** Pestaña "Fichaje" de Jornadas: fichaje propio (cualquier rol — el único
 * requisito es tener sesión iniciada, ver `types/fichaje.ts`) y, para quien
 * gestiona el cuadrante, la comparativa del equipo completo del día. */
export function FichajeTab() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: staff, isPending: isLoadingStaff } = useStaffList(restauranteId)
  const { data: miStaff, isPending: isLoadingMiStaff } = useMyStaff()

  const hoy = fechaId(new Date())
  const { data: turnosDeHoy, isPending: isLoadingTurnos } = useCuadranteRange(restauranteId, hoy, hoy)
  const { data: fichajesDeHoy, isPending: isLoadingFichajes } = useFichajesDia(restauranteId, hoy)

  const staffActivo = useMemo(() => (staff ?? []).filter((member) => member.estado === 'activo'), [staff])
  const puedeGestionar = miStaff ? puedeGestionarTurnos(miStaff.rol) : false

  const isLoading =
    isLoadingRestaurante || isLoadingStaff || isLoadingMiStaff || isLoadingTurnos || isLoadingFichajes

  if (isLoading) return <TabSkeleton />
  if (!miStaff) return null

  return (
    <div className="flex flex-col gap-6">
      <MiFichajeCard
        restauranteId={restauranteId}
        miStaff={miStaff}
        turnosDeHoy={turnosDeHoy ?? []}
        fichajesDeHoy={fichajesDeHoy ?? []}
      />

      {puedeGestionar ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg text-foreground">Equipo hoy</h2>
          <FichajesHoyTabla staff={staffActivo} turnosDeHoy={turnosDeHoy ?? []} fichajesDeHoy={fichajesDeHoy ?? []} />
        </div>
      ) : null}
    </div>
  )
}
