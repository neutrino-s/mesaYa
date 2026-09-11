import { Settings } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de la sección Configuración: datos del restaurante, marca
 * y preferencias del panel se arman en una fase aparte. */
export function ConfiguracionPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Configuración</h1>
      </header>
      <EmptyState
        icon={Settings}
        title="Todavía no hay nada acá"
        description="Las preferencias del restaurante y del panel van a estar disponibles próximamente."
      />
    </div>
  )
}
