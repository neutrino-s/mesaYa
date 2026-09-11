import { Circle, LayoutGrid, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { panelSalonLienzoPath } from '@/routes/paths'
import type { Salon } from '@/types/salon'

interface SalonCardProps {
  salon: Salon
  onEdit: (salon: Salon) => void
  onToggleActivo: (salon: Salon) => void
  onAsignarMozo: (salon: Salon) => void
}

export function SalonCard({ salon, onEdit, onToggleActivo, onAsignarMozo }: SalonCardProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg text-foreground">{salon.nombre}</h3>
          {salon.descripcion ? (
            <p className="text-sm text-muted-foreground">{salon.descripcion}</p>
          ) : null}
        </div>
        <Badge
          className={cn(
            salon.activo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Circle className="size-2" fill="currentColor" strokeWidth={0} />
          {salon.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(panelSalonLienzoPath(salon.id))}
        >
          <LayoutGrid className="size-[18px]" />
          Ver disposición
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => onAsignarMozo(salon)}>
          <Users className="size-[18px]" />
          Asignar mozo
        </Button>
      </div>

      <div className="flex items-center justify-end gap-4 text-sm font-semibold">
        <button
          type="button"
          onClick={() => onEdit(salon)}
          className="text-accent hover:underline"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleActivo(salon)}
          className="text-accent hover:underline"
        >
          {salon.activo ? 'Dar de baja' : 'Reactivar'}
        </button>
      </div>
    </div>
  )
}
