import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon?: LucideIcon
  label: string
  value?: string | number
  sub?: string
  isLoading?: boolean
  className?: string
}

/** Tarjeta de una métrica del resumen de Inicio: etiqueta + valor (+ ícono
 * opcional). Cuando la sección todavía no tiene fuente de datos real, se usa
 * sin `value` (cae al placeholder "—") y con `sub` indicando "Próximamente". */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  isLoading,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm',
        className,
      )}
    >
      {Icon && (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon size={20} className="text-primary" />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <span className="truncate font-heading text-2xl text-foreground">
            {value ?? '—'}
          </span>
        )}
        {sub && !isLoading && (
          <span className="truncate text-xs text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  )
}
