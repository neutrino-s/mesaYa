import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

import { useChangePassword } from '../hooks/useChangePassword'

// Mismo patrón que `staffCreateSchema`/`registerSchema`.
const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Repetí la contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordModalProps {
  open: boolean
  restauranteId: string | null
}

/** Modal bloqueante del primer login: mientras el staff tenga
 * `debeCambiarPassword: true`, esto tapa todo el panel (sin botón de cerrar
 * ni forma de descartarlo por fuera) hasta que elija una contraseña nueva. */
export function ChangePasswordModal({ open, restauranteId }: ChangePasswordModalProps) {
  const changePassword = useChangePassword(restauranteId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: ChangePasswordFormValues) {
    await changePassword.mutateAsync(values.password)
    reset()
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Elegí tu contraseña</DialogTitle>
          <DialogDescription>
            Iniciaste sesión con una contraseña provisoria. Elegí una nueva para
            continuar.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">Contraseña nueva</Label>
            <Input
              id="new-password"
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
            <Label htmlFor="confirm-new-password">Repetir contraseña</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mt-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Guardar contraseña'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
