import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Staff } from '@/types/staff'

import { ROL_OPTIONS, TURNO_OPTIONS } from '../domain/staffRules'
import { staffCreateSchema, staffSchema, type StaffFormSchema } from '../domain/staffSchema'
import { useCreateStaff } from '../hooks/useCreateStaff'
import { useUpdateStaff } from '../hooks/useUpdateStaff'

/** `password`/`confirmPassword` solo existen (y se validan) en modo alta —
 * ver `staffCreateSchema` — pero el form necesita un único tipo para los dos
 * modos porque reutiliza la misma instancia de `useForm`. */
type StaffDialogFormValues = StaffFormSchema & {
  password?: string
  confirmPassword?: string
}

// `staffSchema` (edición) no tiene `password`/`confirmPassword`, y
// `staffCreateSchema` (alta) los pide obligatorios — pero el form reutiliza
// una única instancia de `useForm<StaffDialogFormValues>` (`password`
// opcional) para los dos modos. El cast es seguro: cada resolver solo se
// usa cuando corresponde (ver `isEditing` más abajo).
const editResolver = zodResolver(staffSchema) as unknown as Resolver<StaffDialogFormValues>
const createResolver = zodResolver(staffCreateSchema) as unknown as Resolver<StaffDialogFormValues>

const EMPTY_VALUES: StaffDialogFormValues = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  rol: 'mozo',
  turno: 'mañana',
  horasSemanalesContrato: '',
  password: '',
  confirmPassword: '',
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  /** Colaborador a editar; `null`/`undefined` da de alta uno nuevo. */
  staff?: Staff | null
}

export function StaffFormDialog({
  open,
  onOpenChange,
  restauranteId,
  staff,
}: StaffFormDialogProps) {
  const isEditing = Boolean(staff)
  const createStaff = useCreateStaff(restauranteId)
  const updateStaff = useUpdateStaff(restauranteId)
  const submitting = createStaff.isPending || updateStaff.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffDialogFormValues>({
    // El alta pide contraseña provisoria (y confirmación); la edición no
    // toca la contraseña, así que valida con el schema más chico.
    resolver: isEditing ? editResolver : createResolver,
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    reset(
      staff
        ? {
            nombre: staff.nombre,
            email: staff.email,
            telefono: staff.telefono,
            direccion: staff.direccion,
            rol: staff.rol,
            turno: staff.turno,
            horasSemanalesContrato:
              staff.horasSemanalesContrato != null ? String(staff.horasSemanalesContrato) : '',
            password: '',
            confirmPassword: '',
          }
        : EMPTY_VALUES,
    )
  }, [open, staff, reset])

  async function onSubmit(values: StaffDialogFormValues) {
    if (isEditing && staff) {
      await updateStaff.mutateAsync({ staffId: staff.id, input: values })
    } else {
      await createStaff.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar colaborador' : 'Nuevo colaborador'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualizá los datos del miembro del equipo.'
              : 'Cargá los datos para dar de alta a un nuevo miembro del equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              autoComplete="name"
              aria-invalid={Boolean(errors.nombre)}
              {...register('nombre')}
            />
            {errors.nombre ? (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                autoComplete="tel"
                aria-invalid={Boolean(errors.telefono)}
                {...register('telefono')}
              />
              {errors.telefono ? (
                <p className="text-xs text-destructive">
                  {errors.telefono.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.direccion)}
              {...register('direccion')}
            />
            {errors.direccion ? (
              <p className="text-xs text-destructive">
                {errors.direccion.message}
              </p>
            ) : null}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña provisoria</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Repetir contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword ? (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground sm:col-span-2">
                Es provisoria: en su primer ingreso, la interfaz le va a pedir que la cambie.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Controller
                name="rol"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="rol" aria-invalid={Boolean(errors.rol)}>
                      <SelectValue placeholder="Elegí un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.rol ? (
                <p className="text-xs text-destructive">{errors.rol.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="turno">Turno</Label>
              <Controller
                name="turno"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="turno" aria-invalid={Boolean(errors.turno)}>
                      <SelectValue placeholder="Elegí un turno" />
                    </SelectTrigger>
                    <SelectContent>
                      {TURNO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.turno ? (
                <p className="text-xs text-destructive">{errors.turno.message}</p>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="horasSemanalesContrato">Horas semanales de contrato (opcional)</Label>
              <Input
                id="horasSemanalesContrato"
                type="number"
                min={0}
                step="0.5"
                aria-invalid={Boolean(errors.horasSemanalesContrato)}
                {...register('horasSemanalesContrato')}
              />
              {errors.horasSemanalesContrato ? (
                <p className="text-xs text-destructive">{errors.horasSemanalesContrato.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Se usa en Jornadas › Calendario para avisar si el cuadrante planificado supera el tope
                  contractual de este colaborador.
                </p>
              )}
            </div>
          ) : null}

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
                'Agregar colaborador'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
