import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CartaProducto, CartaProductoGrupoOpciones } from '@/types/cartaProducto'

import { cartaProductoSchema, type CartaProductoFormSchema } from '../domain/cartaProductoSchema'
import { maskPrecioInput, precioInicialInput } from '../domain/cartaRules'
import { useCreateCartaProducto } from '../hooks/useCreateCartaProducto'
import { useUpdateCartaProducto } from '../hooks/useUpdateCartaProducto'
import { OpcionesGruposEditor } from './OpcionesGruposEditor'

const EMPTY_VALUES: CartaProductoFormSchema = { nombre: '', descripcion: '', precio: '' }

function valoresIniciales(producto: CartaProducto | null | undefined): CartaProductoFormSchema {
  if (!producto) return EMPTY_VALUES
  return {
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: precioInicialInput(producto.precio),
  }
}

interface CartaProductoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  /** Sección a la que se agrega el plato nuevo (solo se usa al crear). */
  seccionId: string | null
  /** Plato a editar; `null`/`undefined` da de alta uno nuevo. */
  producto?: CartaProducto | null
}

/** Carga/edición de un plato: nombre, descripción y precio son opcionales
 * (pedido explícito, ver `docs/database-schema.md#carta---producto`), igual
 * que la imagen — input nativo + preview con `URL.createObjectURL`, subida
 * a Firebase Storage recién al guardar (ver CLAUDE.md#4).
 *
 * `CartaPage` remonta este componente (prop `key`) cada vez que se abre,
 * así que el estado local se inicializa directo desde `producto` sin
 * necesitar un efecto que lo resetee. */
export function CartaProductoFormDialog({
  open,
  onOpenChange,
  restauranteId,
  seccionId,
  producto,
}: CartaProductoFormDialogProps) {
  const isEditing = Boolean(producto)
  const createProducto = useCreateCartaProducto(restauranteId)
  const updateProducto = useUpdateCartaProducto(restauranteId)
  const submitting = createProducto.isPending || updateProducto.isPending

  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(producto?.imagenUrl ?? null)
  const [gruposOpciones, setGruposOpciones] = useState<CartaProductoGrupoOpciones[]>(
    producto?.gruposOpciones ?? [],
  )
  const [permiteComentarios, setPermiteComentarios] = useState(producto?.permiteComentarios ?? false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CartaProductoFormSchema>({
    resolver: zodResolver(cartaProductoSchema),
    defaultValues: valoresIniciales(producto),
  })

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setImagenFile(file)
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      objectUrlRef.current = objectUrl
      setPreviewUrl(objectUrl)
    } else {
      setPreviewUrl(producto?.imagenUrl ?? null)
    }
  }

  async function onSubmit(values: CartaProductoFormSchema) {
    const valuesConOpciones = { ...values, gruposOpciones, permiteComentarios }

    if (isEditing && producto) {
      await updateProducto.mutateAsync({
        productoId: producto.id,
        values: valuesConOpciones,
        imagenFile,
        imagenUrlActual: producto.imagenUrl,
      })
    } else {
      if (!seccionId) return
      await createProducto.mutateAsync({ seccionId, values: valuesConOpciones, imagenFile })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar plato' : 'Nuevo plato'}</DialogTitle>
          <DialogDescription>
            Nombre, descripción, precio e imagen son todos opcionales — completá lo que tengas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary hover:text-primary"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus size={22} />
              )}
            </button>
            <div className="flex flex-col gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? 'Cambiar imagen' : 'Agregar imagen'}
              </Button>
              <span className="text-xs text-muted-foreground">JPG o PNG, opcional.</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre del plato</Label>
            <Input
              id="nombre"
              aria-invalid={Boolean(errors.nombre)}
              {...register('nombre')}
            />
            {errors.nombre ? (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              aria-invalid={Boolean(errors.descripcion)}
              {...register('descripcion')}
            />
            {errors.descripcion ? (
              <p className="text-xs text-destructive">{errors.descripcion.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="precio">Precio</Label>
            <Input
              id="precio"
              type="text"
              inputMode="decimal"
              aria-invalid={Boolean(errors.precio)}
              {...register('precio', {
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  event.target.value = maskPrecioInput(event.target.value)
                },
              })}
            />
            {errors.precio ? (
              <p className="text-xs text-destructive">{errors.precio.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Opciones configurables</Label>
            <p className="text-xs text-muted-foreground">
              Ej. un grupo "Salsa" con varias salsas a distinto precio, o un grupo "Guarnición" donde
              "Ensalada" abre a su vez sus propios aderezos.
            </p>
            <OpcionesGruposEditor grupos={gruposOpciones} onChange={setGruposOpciones} />
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
            <Checkbox
              checked={permiteComentarios}
              onCheckedChange={(checked) => setPermiteComentarios(checked === true)}
              className="mt-0.5"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Permitir comentario del comensal</span>
              <span className="text-xs text-muted-foreground">
                Va a poder escribir una aclaración libre al pedir este plato, ej. "sin sal".
              </span>
            </span>
          </label>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEditing ? (
                'Guardar cambios'
              ) : (
                'Agregar plato'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
