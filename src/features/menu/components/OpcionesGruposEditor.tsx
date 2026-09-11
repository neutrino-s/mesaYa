import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CartaProductoGrupoOpciones, CartaProductoOpcion } from '@/types/cartaProducto'

import { crearGrupoOpciones, crearOpcion } from '../domain/opcionesRules'

interface OpcionesGruposEditorProps {
  grupos: CartaProductoGrupoOpciones[]
  onChange: (grupos: CartaProductoGrupoOpciones[]) => void
  /** Profundidad de anidamiento, solo para indentación visual (los
   * subgrupos de una opción se editan con este mismo componente). */
  nivel?: number
}

/** Editor recursivo de los grupos de opciones configurables de un plato
 * (ej. "Salsa" con varias salsas a distinto precio, "Guarnición" con sus
 * guarniciones, donde una de ellas —"Ensalada"— puede a su vez abrir su
 * propio grupo de aderezos). Se maneja como estado local plano en
 * `CartaProductoFormDialog` (mismo criterio que `imagenFile`/`previewUrl`
 * ahí: no pasa por React Hook Form, se arma el payload recién al enviar). */
export function OpcionesGruposEditor({ grupos, onChange, nivel = 0 }: OpcionesGruposEditorProps) {
  function agregarGrupo() {
    onChange([...grupos, crearGrupoOpciones()])
  }

  function actualizarGrupo(id: string, cambios: Partial<CartaProductoGrupoOpciones>) {
    onChange(grupos.map((grupo) => (grupo.id === id ? { ...grupo, ...cambios } : grupo)))
  }

  function eliminarGrupo(id: string) {
    onChange(grupos.filter((grupo) => grupo.id !== id))
  }

  return (
    <div className={cn('flex flex-col gap-3', nivel > 0 && 'border-l-2 border-border pl-4')}>
      {grupos.map((grupo) => (
        <GrupoEditor
          key={grupo.id}
          grupo={grupo}
          nivel={nivel}
          onChange={(cambios) => actualizarGrupo(grupo.id, cambios)}
          onDelete={() => eliminarGrupo(grupo.id)}
        />
      ))}

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={agregarGrupo}>
        <Plus size={16} />
        {nivel === 0 ? 'Agregar grupo de opciones' : 'Agregar grupo de opciones anidado'}
      </Button>
    </div>
  )
}

interface GrupoEditorProps {
  grupo: CartaProductoGrupoOpciones
  nivel: number
  onChange: (cambios: Partial<CartaProductoGrupoOpciones>) => void
  onDelete: () => void
}

function GrupoEditor({ grupo, nivel, onChange, onDelete }: GrupoEditorProps) {
  function agregarOpcion() {
    onChange({ opciones: [...grupo.opciones, crearOpcion()] })
  }

  function actualizarOpcion(id: string, cambios: Partial<CartaProductoOpcion>) {
    onChange({
      opciones: grupo.opciones.map((opcion) => (opcion.id === id ? { ...opcion, ...cambios } : opcion)),
    })
  }

  function eliminarOpcion(id: string) {
    onChange({ opciones: grupo.opciones.filter((opcion) => opcion.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-start gap-2">
        <Input
          value={grupo.nombre}
          onChange={(event) => onChange({ nombre: event.target.value })}
          placeholder='Ej. "Salsa", "Guarnición"'
          className="flex-1"
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar grupo de opciones"
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={grupo.obligatorio}
            onCheckedChange={(checked) => onChange({ obligatorio: checked === true })}
          />
          Obligatorio
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={grupo.seleccionMultiple}
            onCheckedChange={(checked) => onChange({ seleccionMultiple: checked === true })}
          />
          Permite elegir varias
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {grupo.opciones.map((opcion) => (
          <OpcionEditor
            key={opcion.id}
            opcion={opcion}
            nivel={nivel}
            onChange={(cambios) => actualizarOpcion(opcion.id, cambios)}
            onDelete={() => eliminarOpcion(opcion.id)}
          />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={agregarOpcion}>
        <Plus size={16} />
        Agregar opción
      </Button>
    </div>
  )
}

interface OpcionEditorProps {
  opcion: CartaProductoOpcion
  nivel: number
  onChange: (cambios: Partial<CartaProductoOpcion>) => void
  onDelete: () => void
}

function OpcionEditor({ opcion, nivel, onChange, onDelete }: OpcionEditorProps) {
  const [subgruposAbiertos, setSubgruposAbiertos] = useState(opcion.subgrupos.length > 0)

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-2">
      <div className="flex items-center gap-2">
        <Input
          value={opcion.nombre}
          onChange={(event) => onChange({ nombre: event.target.value })}
          placeholder='Ej. "Bolognesa", "Ensalada"'
          className="flex-1"
        />
        <div className="flex items-center gap-1">
          <Label htmlFor={`precio-${opcion.id}`} className="sr-only">
            Precio adicional
          </Label>
          <span className="text-sm text-muted-foreground">+$</span>
          <Input
            id={`precio-${opcion.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={opcion.precioAdicional}
            onChange={(event) => onChange({ precioAdicional: Number(event.target.value) || 0 })}
            className="w-24"
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar opción"
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setSubgruposAbiertos((abierto) => !abierto)}
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronRight size={14} className={cn('transition-transform', subgruposAbiertos && 'rotate-90')} />
        {opcion.subgrupos.length > 0
          ? `Opciones configurables de "${opcion.nombre || 'esta opción'}"`
          : `Agregar opciones configurables a "${opcion.nombre || 'esta opción'}"`}
      </button>

      {subgruposAbiertos ? (
        <OpcionesGruposEditor
          grupos={opcion.subgrupos}
          onChange={(subgrupos) => onChange({ subgrupos })}
          nivel={nivel + 1}
        />
      ) : null}
    </div>
  )
}
