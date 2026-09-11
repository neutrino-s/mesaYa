import { useMemo, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { useStaffList } from '@/features/staff/hooks/useStaffList'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import {
  diasDeGrillaMensual,
  diasDeSemana,
  fechaId,
  filtrarStaffParaCuadrante,
  filtrarTurnos,
  puedeGestionarTurnos,
} from '../domain/cuadranteRules'
import { CUADRANTE_FILTROS_VACIO, type CuadranteFiltros, type CuadranteVista } from '../domain/types'
import { useCuadranteRange } from '../hooks/useCuadranteRange'
import { CuadranteDiaLista } from './CuadranteDiaLista'
import { CuadranteMesGrid } from './CuadranteMesGrid'
import { CuadranteSemanaGrid } from './CuadranteSemanaGrid'
import { CuadranteToolbar } from './CuadranteToolbar'
import { TurnoAsignadoFormDialog } from './TurnoAsignadoFormDialog'

function rangoParaVista(vista: CuadranteVista, fechaAncla: Date): { fechaDesde: string; fechaHasta: string } {
  if (vista === 'dia') {
    const fecha = fechaId(fechaAncla)
    return { fechaDesde: fecha, fechaHasta: fecha }
  }
  if (vista === 'semana') {
    const dias = diasDeSemana(fechaAncla)
    return { fechaDesde: fechaId(dias[0]), fechaHasta: fechaId(dias[dias.length - 1]) }
  }
  const dias = diasDeGrillaMensual(fechaAncla)
  return { fechaDesde: fechaId(dias[0]), fechaHasta: fechaId(dias[dias.length - 1]) }
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 rounded-xl" />
      ))}
    </div>
  )
}

/** Pestaña "Cuadrantes" de Jornadas: calendario de turnos por día/semana/mes,
 * filtrable por rol/área/empleado, con alta/edición vía diálogo. */
export function CuadrantesTab() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: staff, isPending: isLoadingStaff } = useStaffList(restauranteId)
  const { data: miStaff } = useMyStaff()
  const puedeGestionar = miStaff ? puedeGestionarTurnos(miStaff.rol) : false

  const [vista, setVista] = useState<CuadranteVista>('semana')
  const [fechaAncla, setFechaAncla] = useState(() => new Date())
  const [filtros, setFiltros] = useState<CuadranteFiltros>(CUADRANTE_FILTROS_VACIO)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<TurnoAsignado | null>(null)
  const [valoresIniciales, setValoresIniciales] = useState<{ staffId?: string; fecha?: string } | null>(null)

  const { fechaDesde, fechaHasta } = rangoParaVista(vista, fechaAncla)
  const { data: turnosDelRango, isPending: isLoadingTurnos } = useCuadranteRange(restauranteId, fechaDesde, fechaHasta)

  const staffActivo = useMemo(() => (staff ?? []).filter((member) => member.estado === 'activo'), [staff])
  const turnosFiltrados = useMemo(() => filtrarTurnos(turnosDelRango ?? [], filtros), [turnosDelRango, filtros])
  const staffFiltrado = useMemo(() => filtrarStaffParaCuadrante(staff ?? [], filtros), [staff, filtros])

  const isLoading = isLoadingRestaurante || isLoadingStaff || isLoadingTurnos

  function handleNuevoTurno(valores?: { staffId?: string; fecha?: string }) {
    if (!puedeGestionar) return
    setEditingTurno(null)
    setValoresIniciales(valores ?? { fecha: vista === 'mes' ? fechaId(new Date()) : fechaId(fechaAncla) })
    setDialogOpen(true)
  }

  function handleEditarTurno(turno: TurnoAsignado) {
    if (!puedeGestionar) return
    setEditingTurno(turno)
    setValoresIniciales(null)
    setDialogOpen(true)
  }

  function handleSeleccionarDia(fecha: Date) {
    setFechaAncla(fecha)
    setVista('dia')
  }

  return (
    <div className="flex flex-col gap-5">
      <CuadranteToolbar
        vista={vista}
        onVistaChange={setVista}
        fechaAncla={fechaAncla}
        onFechaAnchaChange={setFechaAncla}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        staff={staffActivo}
        onNuevoTurno={() => handleNuevoTurno()}
        puedeGestionar={puedeGestionar}
      />

      {isLoading ? (
        <GridSkeleton />
      ) : vista === 'semana' ? (
        <CuadranteSemanaGrid
          fechaAncla={fechaAncla}
          staff={staffFiltrado}
          turnos={turnosFiltrados}
          onNuevoTurno={handleNuevoTurno}
          onEditarTurno={handleEditarTurno}
          puedeGestionar={puedeGestionar}
        />
      ) : vista === 'dia' ? (
        <CuadranteDiaLista
          restauranteId={restauranteId}
          staff={staffActivo}
          turnos={turnosFiltrados}
          onEditarTurno={handleEditarTurno}
          puedeGestionar={puedeGestionar}
        />
      ) : (
        <CuadranteMesGrid fechaAncla={fechaAncla} turnos={turnosFiltrados} onSeleccionarDia={handleSeleccionarDia} />
      )}

      <TurnoAsignadoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        restauranteId={restauranteId}
        staff={staffActivo}
        turnos={turnosDelRango ?? []}
        turno={editingTurno}
        valoresIniciales={valoresIniciales}
      />
    </div>
  )
}
