import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Staff } from '@/types/staff'

interface MozoMultiSelectProps {
  mozos: Staff[]
  selectedIds: string[]
  onChange: (mozoIds: string[]) => void
  disabled?: boolean
  /** `full`: trigger con el nombre de los mozos asignados, para
   * `MesaEditDialog`. `compact`: solo ícono, para no romper el layout de
   * fila apretada de `BarraEditDialog`. */
  variant?: 'full' | 'compact'
}

/** Una mesa puede tener más de un mozo asignado a la vez (turnos
 * superpuestos, cobertura compartida) — por eso es un multi-select
 * (checkboxes dentro de un `DropdownMenu`) y no un `Select` de una sola
 * opción. Cada click dispara `onChange` con la lista completa ya
 * actualizada; quien lo usa decide cuándo persistirla (ambos diálogos lo
 * hacen al instante, es un campo operativo). */
export function MozoMultiSelect({
  mozos,
  selectedIds,
  onChange,
  disabled,
  variant = 'full',
}: MozoMultiSelectProps) {
  function toggle(mozoId: string, checked: boolean) {
    onChange(checked ? [...selectedIds, mozoId] : selectedIds.filter((id) => id !== mozoId))
  }

  const label =
    selectedIds.length === 0
      ? 'Sin asignar'
      : selectedIds.length === 1
        ? (mozos.find((mozo) => mozo.id === selectedIds[0])?.nombre ?? '1 mozo asignado')
        : `${selectedIds.length} mozos asignados`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'compact' ? (
          <Button
            type="button"
            variant="outline"
            className={cn('size-13 shrink-0 p-0', selectedIds.length > 0 && 'border-primary text-primary')}
            title={`Mozos asignados: ${label}`}
            disabled={disabled}
          >
            <Users className="size-[18px]" />
          </Button>
        ) : (
          <Button type="button" variant="outline" className="w-full justify-start" disabled={disabled}>
            <Users className="size-[18px]" />
            {label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {mozos.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-muted-foreground">No hay mozos activos.</p>
        ) : (
          mozos.map((mozo) => (
            <DropdownMenuCheckboxItem
              key={mozo.id}
              checked={selectedIds.includes(mozo.id)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => toggle(mozo.id, checked === true)}
            >
              {mozo.nombre}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
