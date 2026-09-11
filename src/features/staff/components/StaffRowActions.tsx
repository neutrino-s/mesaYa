import type { Staff } from '@/types/staff'

interface StaffRowActionsProps {
  staff: Staff
  onEdit: (staff: Staff) => void
  onToggleEstado: (staff: Staff) => void
}

/** Acciones de la fila como links de texto, siguiendo el modelo de la
 * pantalla: no hay overflow menu, "Editar" y el toggle de estado quedan
 * siempre visibles. */
export function StaffRowActions({
  staff,
  onEdit,
  onToggleEstado,
}: StaffRowActionsProps) {
  const isActivo = staff.estado === 'activo'

  return (
    <div className="flex items-center justify-end gap-4 text-sm font-semibold">
      <button
        type="button"
        onClick={() => onEdit(staff)}
        className="text-accent hover:underline"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => onToggleEstado(staff)}
        className="text-accent hover:underline"
      >
        {isActivo ? 'Dar de baja' : 'Reactivar'}
      </button>
    </div>
  )
}
