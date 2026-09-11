import { Armchair, Plus } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import type { Salon } from '@/types/salon'

import { AsignarMozoDialog } from '../components/AsignarMozoDialog'
import { SalonCard } from '../components/SalonCard'
import { SalonFormDialog } from '../components/SalonFormDialog'
import { useSalonesList } from '../hooks/useSalonesList'
import { useSetSalonActivo } from '../hooks/useSetSalonActivo'

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  )
}

export function SalonPage() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { data: salones, isPending } = useSalonesList(restauranteId)
  const setActivo = useSetSalonActivo(restauranteId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null)
  const [asignarMozoSalon, setAsignarMozoSalon] = useState<Salon | null>(null)

  const isLoading = isLoadingRestaurante || isPending
  const hasSalones = (salones?.length ?? 0) > 0

  function handleNuevo() {
    setEditingSalon(null)
    setDialogOpen(true)
  }

  function handleEdit(salon: Salon) {
    setEditingSalon(salon)
    setDialogOpen(true)
  }

  function handleToggleActivo(salon: Salon) {
    setActivo.mutate({ salonId: salon.id, activo: !salon.activo })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Salón</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná los salones y el armado de mesas de tu restaurante.
          </p>
        </div>
        <Button onClick={handleNuevo} className="sm:w-auto">
          <Plus className="size-[18px]" />
          Nuevo salón
        </Button>
      </header>

      {isLoading ? (
        <GridSkeleton />
      ) : !hasSalones ? (
        <EmptyState
          icon={Armchair}
          title="Todavía no hay salones"
          description="Agregá el primero con el botón «Nuevo salón» para empezar a armar las mesas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salones!.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              onEdit={handleEdit}
              onToggleActivo={handleToggleActivo}
              onAsignarMozo={setAsignarMozoSalon}
            />
          ))}
        </div>
      )}

      <SalonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        restauranteId={restauranteId}
        salon={editingSalon}
      />

      <AsignarMozoDialog
        open={asignarMozoSalon !== null}
        onOpenChange={(open) => !open && setAsignarMozoSalon(null)}
        restauranteId={restauranteId}
        salonId={asignarMozoSalon?.id ?? null}
        salonNombre={asignarMozoSalon?.nombre ?? ''}
      />
    </div>
  )
}
