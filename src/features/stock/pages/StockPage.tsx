import { Package } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de la sección Stock: el control de insumos y alertas de
 * quiebre se arma en una fase aparte. */
export function StockPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Stock</h1>
      </header>
      <EmptyState
        icon={Package}
        title="Todavía no hay nada acá"
        description="El control de stock e insumos va a estar disponible próximamente."
      />
    </div>
  )
}
