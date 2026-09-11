import { Camera, PenLine } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface CartaModoSelectorProps {
  onSelectManual: () => void
}

/** Pantalla de elección tras "Crear carta": carga manual (habilitada) o
 * adjuntar un menú ya diseñado. "Adjuntar imagen" está deshabilitado a
 * propósito en esta etapa (pedido explícito): solo se muestra para
 * comunicar que existe, sin ninguna acción ni lógica detrás. */
export function CartaModoSelector({ onSelectManual }: CartaModoSelectorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-xl text-foreground">¿Cómo querés cargar la carta?</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Elegí una forma de empezar. Vas a poder editarla después de cualquier manera.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSelectManual}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary bg-card p-6 text-foreground shadow-sm transition-colors hover:bg-secondary/60"
        >
          <PenLine size={24} className="text-primary" />
          <span className="font-heading text-base">Carga manual</span>
          <span className="text-xs text-muted-foreground">
            Cargá secciones y platos vos mismo.
          </span>
        </button>

        <div
          aria-disabled="true"
          title="Disponible próximamente"
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-muted-foreground opacity-70"
        >
          <Camera size={24} />
          <span className="font-heading text-base">Adjuntar menú</span>
          <span className="text-xs">Subí un menú ya diseñado.</span>
          <Badge className="mt-1 bg-muted text-muted-foreground">Próximamente</Badge>
        </div>
      </div>
    </div>
  )
}
