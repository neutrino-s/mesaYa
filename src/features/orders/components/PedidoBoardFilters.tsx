import { cn } from '@/lib/utils'

import { FILTRO_OPTIONS } from '../domain/pedidoBoardRules'
import type { PedidoBoardFiltro } from '../domain/types'

interface PedidoBoardFiltersProps {
  value: PedidoBoardFiltro
  onChange: (value: PedidoBoardFiltro) => void
}

/** Filtro rápido del tablero de pedidos: ver todos en simultáneo o
 * discriminar por una única columna — mismo patrón visual que
 * `StaffQuickFilters`. */
export function PedidoBoardFilters({ value, onChange }: PedidoBoardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTRO_OPTIONS.map((option) => {
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
                ? 'border-accent bg-accent/10 text-accent'
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
