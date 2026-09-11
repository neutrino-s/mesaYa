import { LineChart } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de la sección Reportes: los gráficos de métricas de
 * pedidos se arman en una fase aparte. */
export function ReportesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Reportes</h1>
      </header>
      <EmptyState
        icon={LineChart}
        title="Todavía no hay nada acá"
        description="Las métricas y gráficos de pedidos van a estar disponibles próximamente."
      />
    </div>
  )
}
