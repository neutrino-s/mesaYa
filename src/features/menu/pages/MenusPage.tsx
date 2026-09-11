import { LayoutPanelTop } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de la sección Menús: el armado de combos/menús a partir de
 * la carta se arma en una fase aparte. */
export function MenusPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Menús</h1>
      </header>
      <EmptyState
        icon={LayoutPanelTop}
        title="Todavía no hay nada acá"
        description="El armado de menús y combos va a estar disponible próximamente."
      />
    </div>
  )
}
