import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Staff } from '@/types/staff'

import { rolLabel, turnoLabel } from '../domain/staffRules'
import { EstadoBadge } from './EstadoBadge'
import { StaffAvatar } from './StaffAvatar'
import { StaffRowActions } from './StaffRowActions'

interface StaffTableProps {
  data: Staff[]
  onEdit: (staff: Staff) => void
  onToggleEstado: (staff: Staff) => void
}

const HEAD_CLASSES = 'uppercase tracking-wide'

export function StaffTable({ data, onEdit, onToggleEstado }: StaffTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD_CLASSES}>Nombre</TableHead>
            <TableHead className={HEAD_CLASSES}>Rol</TableHead>
            <TableHead className={HEAD_CLASSES}>Turno</TableHead>
            <TableHead className={HEAD_CLASSES}>Estado</TableHead>
            <TableHead className={HEAD_CLASSES}>Contacto</TableHead>
            <TableHead className={HEAD_CLASSES} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((staff) => (
            <TableRow key={staff.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <StaffAvatar nombre={staff.nombre} rol={staff.rol} />
                  <span className="truncate font-medium text-foreground">
                    {staff.nombre}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-foreground">
                {rolLabel(staff.rol)}
              </TableCell>
              <TableCell className="text-foreground">
                {turnoLabel(staff.turno)}
              </TableCell>
              <TableCell>
                <EstadoBadge estado={staff.estado} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {staff.telefono}
              </TableCell>
              <TableCell>
                <StaffRowActions
                  staff={staff}
                  onEdit={onEdit}
                  onToggleEstado={onToggleEstado}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  )
}
