import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { MozoMultiSelect } from './MozoMultiSelect'
import { useAsignarMozosASalon } from '../hooks/useAsignarMozosASalon'

interface AsignarMozoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  salonId: string | null
  salonNombre: string
}

/** Asigna uno o más mozos a todas las mesas de un salón de una sola vez, en
 * vez de abrir "Editar mesa" mesa por mesa — el resultado final es el mismo
 * (cada mesa queda con estos mozos en `mozoIds`). Reemplaza lo que hubiera
 * asignado antes en cada mesa, no lo suma. */
export function AsignarMozoDialog({
  open,
  onOpenChange,
  restauranteId,
  salonId,
  salonNombre,
}: AsignarMozoDialogProps) {
  const { data: staff } = useStaffList(restauranteId)
  const asignarMozos = useAsignarMozosASalon(restauranteId, salonId)
  const mozos = (staff ?? []).filter((s) => s.rol === 'mozo' && s.estado === 'activo')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // Ajuste de estado durante el render (no en un efecto): en cuanto
  // `wasOpen` se pone al día con `open` esta condición no vuelve a
  // dispararse hasta el próximo cambio real.
  const [wasOpen, setWasOpen] = useState(open)

  // Arranca vacío cada vez que se abre: es una asignación nueva para todo
  // el salón, no la edición de un valor compartido existente (las mesas
  // pueden tener hoy mozos distintos entre sí).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setSelectedIds([])
  }

  async function handleConfirm() {
    await asignarMozos.mutateAsync(selectedIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar mozo</DialogTitle>
          <DialogDescription>
            Elegí uno o más mozos para asignar a todas las mesas de «{salonNombre}» de una
            sola vez. Reemplaza los mozos que tuviera asignados cada mesa (Baños queda afuera,
            no es una mesa atendida).
          </DialogDescription>
        </DialogHeader>

        <MozoMultiSelect
          mozos={mozos}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          disabled={asignarMozos.isPending}
        />

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={asignarMozos.isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={asignarMozos.isPending}>
            {asignarMozos.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Asignar a todas las mesas'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
