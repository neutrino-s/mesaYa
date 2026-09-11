import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { diasDeSemana, inicioDeMes, mesAnterior, mesSiguiente, semanaAnterior, semanaSiguiente } from '../domain/cuadranteRules'
import type { MetricasVista } from '../domain/types'

const VISTA_OPTIONS: { value: MetricasVista; label: string }[] = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
]

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function etiquetaPeriodo(vista: MetricasVista, fechaAncla: Date): string {
  if (vista === 'mes') return capitalizar(format(fechaAncla, 'MMMM yyyy', { locale: es }))
  const dias = diasDeSemana(fechaAncla)
  return `${format(dias[0], 'd MMM', { locale: es })} – ${format(dias[6], 'd MMM yyyy', { locale: es })}`
}

interface MetricasToolbarProps {
  vista: MetricasVista
  onVistaChange: (vista: MetricasVista) => void
  fechaAncla: Date
  onFechaAnchaChange: (fecha: Date) => void
}

/** Selector de período de Métricas: semana o mes actual, con navegación —
 * sin filtros de rol/área/empleado (el desglose por empleado ya está en el
 * propio gráfico). */
export function MetricasToolbar({ vista, onVistaChange, fechaAncla, onFechaAnchaChange }: MetricasToolbarProps) {
  function irAnterior() {
    onFechaAnchaChange(vista === 'mes' ? mesAnterior(fechaAncla) : semanaAnterior(fechaAncla))
  }

  function irSiguiente() {
    onFechaAnchaChange(vista === 'mes' ? mesSiguiente(fechaAncla) : semanaSiguiente(fechaAncla))
  }

  return (
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
            onClick={() => onFechaAnchaChange(vista === 'mes' ? inicioDeMes(new Date()) : new Date())}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            Actual
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

      <p className="font-heading text-lg text-foreground">{etiquetaPeriodo(vista, fechaAncla)}</p>
    </div>
  )
}
