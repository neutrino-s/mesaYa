import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Staff } from '@/types/staff'

import type { HorasPorEmpleado } from '../domain/metricsRules'

interface MetricasHorasChartProps {
  datos: HorasPorEmpleado[]
  staff: Staff[]
}

const TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  fontSize: 12,
}

const TICK_STYLE = { fill: 'var(--color-muted-foreground)', fontSize: 12 }

/** Horas planificadas vs. trabajadas por empleado del período — barras
 * horizontales para que los nombres no se amontonen como en un eje X. */
export function MetricasHorasChart({ datos, staff }: MetricasHorasChartProps) {
  const staffPorId = new Map(staff.map((member) => [member.id, member.nombre]))

  const data = datos
    .filter((fila) => fila.horasPlanificadas > 0 || fila.horasTrabajadas > 0)
    .map((fila) => ({
      nombre: staffPorId.get(fila.staffId) ?? 'Empleado',
      Planificadas: Number(fila.horasPlanificadas.toFixed(1)),
      Trabajadas: Number(fila.horasTrabajadas.toFixed(1)),
    }))
    .sort((a, b) => b.Planificadas - a.Planificadas)

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de horas para este período.</p>
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      style={{ height: Math.max(240, data.length * 44 + 60) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" unit="h" tick={TICK_STYLE} />
          <YAxis type="category" dataKey="nombre" width={110} tick={TICK_STYLE} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--color-muted)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Planificadas" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Trabajadas" fill="var(--color-brand-lavender)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
