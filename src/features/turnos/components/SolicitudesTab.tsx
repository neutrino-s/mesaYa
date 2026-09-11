import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { puedeGestionarTurnos } from '../domain/cuadranteRules'
import { useMisSolicitudes } from '../hooks/useMisSolicitudes'
import { useSolicitudesPendientes } from '../hooks/useSolicitudesPendientes'
import { MisSolicitudesList } from './MisSolicitudesList'
import { SolicitudesPendientesPanel } from './SolicitudesPendientesPanel'
import { SolicitudFormDialog } from './SolicitudFormDialog'

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}

/** Pestaña "Solicitudes" de Jornadas: pedidos propios (día libre,
 * vacaciones, licencia — cualquier rol) y, para quien gestiona el
 * cuadrante, la cola de aprobación de todo el equipo. */
export function SolicitudesTab() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: miStaff, isPending: isLoadingMiStaff } = useMyStaff()
  const { data: staff, isPending: isLoadingStaff } = useStaffList(restauranteId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const puedeGestionar = miStaff ? puedeGestionarTurnos(miStaff.rol) : false

  const { data: misSolicitudes, isPending: isLoadingMias } = useMisSolicitudes(restauranteId, miStaff?.id ?? null)
  const { data: pendientes, isPending: isLoadingPendientes } = useSolicitudesPendientes(
    puedeGestionar ? restauranteId : null,
  )

  const staffActivo = (staff ?? []).filter((member) => member.estado === 'activo')

  const isLoading =
    isLoadingRestaurante ||
    isLoadingMiStaff ||
    isLoadingMias ||
    (puedeGestionar && (isLoadingStaff || isLoadingPendientes))

  if (isLoading) return <TabSkeleton />
  if (!miStaff) return null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-foreground">Mis solicitudes</h2>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={18} />
            Nueva solicitud
          </Button>
        </div>
        <MisSolicitudesList restauranteId={restauranteId} staffId={miStaff.id} solicitudes={misSolicitudes ?? []} />
      </div>

      {puedeGestionar ? (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg text-foreground">Pendientes de aprobar</h2>
          <SolicitudesPendientesPanel
            restauranteId={restauranteId}
            resueltoPor={miStaff.id}
            staff={staffActivo}
            solicitudes={pendientes ?? []}
          />
        </div>
      ) : null}

      <SolicitudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        restauranteId={restauranteId}
        staffId={miStaff.id}
      />
    </div>
  )
}
