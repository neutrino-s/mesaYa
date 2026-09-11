import { cn } from '@/lib/utils'

import type { StaffQuickFilter } from '../domain/types'

const OPTIONS: { value: StaffQuickFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'mozos', label: 'Mozos' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'inactivos', label: 'Inactivos' },
]

interface StaffQuickFiltersProps {
  value: StaffQuickFilter
  onChange: (value: StaffQuickFilter) => void
}

/** Filtro rápido de la tabla de Staff: pills de un solo click, sin buscador
 * ni selects — el corte que necesita el día a día del panel. */
export function StaffQuickFilters({ value, onChange }: StaffQuickFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted/60',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
