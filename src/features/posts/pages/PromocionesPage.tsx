import { Megaphone } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de la sección Promociones: las publicaciones y ofertas del
 * restaurante se arman en una fase aparte. */
export function PromocionesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Promociones</h1>
      </header>
      <EmptyState
        icon={Megaphone}
        title="Todavía no hay nada acá"
        description="Las publicaciones y promociones del restaurante van a estar disponibles próximamente."
      />
    </div>
  )
}
