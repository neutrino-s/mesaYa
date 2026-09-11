import { UserCog } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

/** Placeholder de "Mi perfil": la edición de los datos propios del usuario
 * con sesión iniciada (nombre, foto, contraseña) se arma en una fase
 * aparte. Es un concepto distinto de Configuración (ajustes del
 * restaurante), por eso vive en su propia ruta. */
export function PerfilPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 pb-2">
        <h1 className="font-heading text-2xl text-foreground">Mi perfil</h1>
      </header>
      <EmptyState
        icon={UserCog}
        title="Todavía no hay nada acá"
        description="La edición de tus datos de perfil va a estar disponible próximamente."
      />
    </div>
  )
}
