import { Circle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EstadoStaff } from '@/types/staff'

import { estadoBadgeClasses, estadoLabel } from '../domain/staffRules'

export function EstadoBadge({
  estado,
  className,
}: {
  estado: EstadoStaff
  className?: string
}) {
  return (
    <Badge className={cn(estadoBadgeClasses(estado), className)}>
      <Circle className="size-2" fill="currentColor" strokeWidth={0} />
      {estadoLabel(estado)}
    </Badge>
  )
}
