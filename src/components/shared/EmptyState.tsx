import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  /** CTA opcional debajo de la descripción (ej. un botón "Crear carta"). */
  action?: ReactNode
}

/** Estado vacío genérico: ícono + título + descripción, centrado. Lo usan
 * las secciones que todavía no tienen contenido real que listar. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
        <Icon size={28} className="text-primary" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-xl text-foreground">{title}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
