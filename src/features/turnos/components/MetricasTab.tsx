import { Lock } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { diasDeSemana, fechaId, finDeMes, inicioDeMes, puedeGestionarTurnos } from '../domain/cuadranteRules'
import {
  ausentismoPorcentaje,
  cumplimientoPorcentaje,
  horasPlanificadasTotales,
  horasPorEmpleado,
  horasTrabajadasTotales,
  turnosAusentesEnRango,
} from '../domain/metricsRules'
import type { MetricasVista } from '../domain/types'
import { useCuadranteRange } from '../hooks/useCuadranteRange'
import { useFichajesRango } from '../hooks/useFichajesRango'
import { MetricasAusentismoLista } from './MetricasAusentismoLista'
import { MetricasHorasChart } from './MetricasHorasChart'
import { MetricasResumenCards } from './MetricasResumenCards'
import { MetricasToolbar } from './MetricasToolbar'

function rangoParaVista(vista: MetricasVista, fechaAncla: Date): { fechaDesde: string; fechaHasta: string } {
  if (vista === 'mes') {
    return { fechaDesde: fechaId(inicioDeMes(fechaAncla)), fechaHasta: fechaId(finDeMes(fechaAncla)) }
  }
  const dias = diasDeSemana(fechaAncla)
  return { fechaDesde: fechaId(dias[0]), fechaHasta: fechaId(dias[dias.length - 1]) }
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/** Pestaña "Métricas" de Jornadas: horas planificadas vs. trabajadas,
 * cumplimiento del cuadrante y ausentismo del período — solo para quien
 * gestiona el cuadrante (`puedeGestionarTurnos`). Se carga vía `React.lazy`
 * desde `TurnosPage` (trae `recharts`, pesado y no visible en el primer
 * render de las otras pestañas — ver CLAUDE.md §5.1). */
export function MetricasTab() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: miStaff, isPending: isLoadingMiStaff } = useMyStaff()
  const { data: staff, isPending: isLoadingStaff } = useStaffList(restauranteId)

  const [vista, setVista] = useState<MetricasVista>('semana')
  const [fechaAncla, setFechaAncla] = useState(() => new Date())

  const puedeGestionar = miStaff ? puedeGestionarTurnos(miStaff.rol) : false
  const { fechaDesde, fechaHasta } = rangoParaVista(vista, fechaAncla)

  const { data: turnos, isPending: isLoadingTurnos } = useCuadranteRange(
    puedeGestionar ? restauranteId : null,
    fechaDesde,
    fechaHasta,
  )
  const { data: fichajes, isPending: isLoadingFichajes } = useFichajesRango(
    puedeGestionar ? restauranteId : null,
    fechaDesde,
    fechaHasta,
  )

  const staffActivo = useMemo(() => (staff ?? []).filter((member) => member.estado === 'activo'), [staff])

  if (isLoadingRestaurante || isLoadingMiStaff) return <TabSkeleton />

  if (!puedeGestionar) {
    return (
      <EmptyState
        icon={Lock}
        title="Sección restringida"
        description="Las métricas de horas y ausentismo del equipo son visibles solo para administradores y encargados."
      />
    )
  }

  const isLoading = isLoadingStaff || isLoadingTurnos || isLoadingFichajes
  const turnosDelPeriodo = turnos ?? []
  const fichajesDelPeriodo = fichajes ?? []
  const ahora = new Date()

  return (
    <div className="flex flex-col gap-6">
      <MetricasToolbar vista={vista} onVistaChange={setVista} fechaAncla={fechaAncla} onFechaAnchaChange={setFechaAncla} />

      {isLoading ? (
        <TabSkeleton />
      ) : (
        <>
          <MetricasResumenCards
            horasPlanificadas={horasPlanificadasTotales(turnosDelPeriodo)}
            horasTrabajadas={horasTrabajadasTotales(fichajesDelPeriodo)}
            cumplimiento={cumplimientoPorcentaje(turnosDelPeriodo, fichajesDelPeriodo)}
            ausentismo={ausentismoPorcentaje(turnosDelPeriodo, fichajesDelPeriodo, ahora)}
          />

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg text-foreground">Horas por empleado</h2>
            <MetricasHorasChart datos={horasPorEmpleado(turnosDelPeriodo, fichajesDelPeriodo)} staff={staffActivo} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg text-foreground">Ausencias del período</h2>
            <MetricasAusentismoLista
              ausencias={turnosAusentesEnRango(turnosDelPeriodo, fichajesDelPeriodo, ahora)}
              staff={staffActivo}
            />
          </div>
        </>
      )}
    </div>
  )
}
