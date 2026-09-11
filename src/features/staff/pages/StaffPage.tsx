import { Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import type { Staff } from '@/types/staff'

import { StaffFormDialog } from '../components/StaffFormDialog'
import { StaffQuickFilters } from '../components/StaffQuickFilters'
import { StaffSummaryCards } from '../components/StaffSummaryCards'
import { StaffTable } from '../components/StaffTable'
import { filterStaffByQuick, staffSummary } from '../domain/staffRules'
import type { StaffQuickFilter } from '../domain/types'
import { useMyRestauranteId } from '../hooks/useMyRestauranteId'
import { useSetStaffEstado } from '../hooks/useSetStaffEstado'
import { useStaffList } from '../hooks/useStaffList'

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="hidden h-6 w-16 rounded-md sm:block" />
        </div>
      ))}
    </div>
  )
}

export function StaffPage() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { restaurante } = useMyRestaurante()
  const { data: staff, isPending } = useStaffList(restauranteId)
  const setEstado = useSetStaffEstado(restauranteId)

  const [quickFilter, setQuickFilter] = useState<StaffQuickFilter>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const summary = useMemo(() => staffSummary(staff ?? []), [staff])
  const filteredStaff = useMemo(
    () => filterStaffByQuick(staff ?? [], quickFilter),
    [staff, quickFilter],
  )

  const isLoading = isLoadingRestaurante || isPending
  const hasStaff = (staff?.length ?? 0) > 0

  function handleNuevo() {
    setEditingStaff(null)
    setDialogOpen(true)
  }

  function handleEdit(member: Staff) {
    setEditingStaff(member)
    setDialogOpen(true)
  }

  function handleToggleEstado(member: Staff) {
    setEstado.mutate({
      staffId: member.id,
      estado: member.estado === 'activo' ? 'inactivo' : 'activo',
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná el personal de {restaurante?.nombre ?? 'tu restaurante'}.
          </p>
        </div>
        <Button onClick={handleNuevo} className="sm:w-auto">
          <Plus className="size-[18px]" />
          Nuevo empleado
        </Button>
      </header>

      <StaffSummaryCards summary={summary} isLoading={isLoading} />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg text-foreground">Personal</h2>
          <StaffQuickFilters value={quickFilter} onChange={setQuickFilter} />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !hasStaff ? (
          <EmptyState
            icon={Users}
            title="Todavía no hay colaboradores"
            description="Agregá al primer miembro de tu equipo con el botón «Nuevo empleado»."
          />
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin resultados"
            description="Ningún colaborador coincide con el filtro aplicado."
          />
        ) : (
          <StaffTable
            data={filteredStaff}
            onEdit={handleEdit}
            onToggleEstado={handleToggleEstado}
          />
        )}
      </div>

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        restauranteId={restauranteId}
        staff={editingStaff}
      />
    </div>
  )
}
