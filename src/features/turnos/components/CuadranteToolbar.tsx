import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ROL_OPTIONS } from '@/features/staff/domain/staffRules'
import type { Staff } from '@/types/staff'

import {
  AREA_OPTIONS,
  diasDeSemana,
  mesAnterior,
  mesSiguiente,
  semanaAnterior,
  semanaSiguiente,
} from '../domain/cuadranteRules'
import type { CuadranteFiltros, CuadranteVista } from '../domain/types'

const VISTA_OPTIONS: { value: CuadranteVista; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
]

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function etiquetaRango(vista: CuadranteVista, fechaAncla: Date): string {
  if (vista === 'dia') return capitalizar(format(fechaAncla, "EEEE d 'de' MMMM", { locale: es }))
  if (vista === 'mes') return capitalizar(format(fechaAncla, 'MMMM yyyy', { locale: es }))

  const [primerDia, ...resto] = diasDeSemana(fechaAncla)
  const ultimoDia = resto[resto.length - 1]
  return `${format(primerDia, 'd MMM', { locale: es })} – ${format(ultimoDia, 'd MMM yyyy', { locale: es })}`
}

interface CuadranteToolbarProps {
  vista: CuadranteVista
  onVistaChange: (vista: CuadranteVista) => void
  fechaAncla: Date
  onFechaAnchaChange: (fecha: Date) => void
  filtros: CuadranteFiltros
  onFiltrosChange: (filtros: CuadranteFiltros) => void
  staff: Staff[]
  onNuevoTurno: () => void
  /** `false` para el personal sin permiso de armar el cuadrante (ver
   * `puedeGestionarTurnos`): oculta la acción "Nuevo turno", deja el resto
   * de la pantalla en solo lectura. */
  puedeGestionar: boolean
}

export function CuadranteToolbar({
  vista,
  onVistaChange,
  fechaAncla,
  onFechaAnchaChange,
  filtros,
  onFiltrosChange,
  staff,
  puedeGestionar,
  onNuevoTurno,
}: CuadranteToolbarProps) {
  function irAnterior() {
    if (vista === 'mes') return onFechaAnchaChange(mesAnterior(fechaAncla))
    if (vista === 'semana') return onFechaAnchaChange(semanaAnterior(fechaAncla))
    onFechaAnchaChange(new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), fechaAncla.getDate() - 1))
  }

  function irSiguiente() {
    if (vista === 'mes') return onFechaAnchaChange(mesSiguiente(fechaAncla))
    if (vista === 'semana') return onFechaAnchaChange(semanaSiguiente(fechaAncla))
    onFechaAnchaChange(new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), fechaAncla.getDate() + 1))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-border bg-card p-0.5">
            {VISTA_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onVistaChange(option.value)}
                aria-pressed={vista === option.value}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  vista === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={irAnterior}
              aria-label="Período anterior"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => onFechaAnchaChange(new Date())}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={irSiguiente}
              aria-label="Período siguiente"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {puedeGestionar ? (
          <Button size="sm" onClick={onNuevoTurno} className="sm:w-auto">
            <Plus size={18} />
            Nuevo turno
          </Button>
        ) : null}
      </div>

      <p className="font-heading text-lg text-foreground">{etiquetaRango(vista, fechaAncla)}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filtros.rol}
          onValueChange={(value) => onFiltrosChange({ ...filtros, rol: value as CuadranteFiltros['rol'] })}
        >
          <SelectTrigger className="h-10 w-auto min-w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            {ROL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.area}
          onValueChange={(value) => onFiltrosChange({ ...filtros, area: value as CuadranteFiltros['area'] })}
        >
          <SelectTrigger className="h-10 w-auto min-w-40">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las áreas</SelectItem>
            {AREA_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.staffId}
          onValueChange={(value) => onFiltrosChange({ ...filtros, staffId: value })}
        >
          <SelectTrigger className="h-10 w-auto min-w-40">
            <SelectValue placeholder="Empleado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo el equipo</SelectItem>
            {staff.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
