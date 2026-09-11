import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Wordmark } from '@/components/shared/Wordmark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'

import { useLogin } from '../hooks/useLogin'
import { type LoginFormValues, loginSchema } from '../domain/loginSchema'

export function LoginForm() {
  const { submit, submitting, error, clearError, resetPassword } = useLogin()
  const [obscurePassword, setObscurePassword] = useState(true)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    const success = await submit(values)
    if (success) navigate(paths.splash)
  }

  async function onForgotPassword() {
    const email = getValues('email')
    const parsed = loginSchema.shape.email.safeParse(email)
    if (!parsed.success) {
      toast.error('Escribí tu correo y volvé a tocar el enlace.')
      return
    }

    const failure = await resetPassword(parsed.data)
    if (failure) {
      toast.error(failure)
    } else {
      toast.success('Te mandamos un correo para recuperar la contraseña.')
    }
  }

  return (
    <fieldset className="mx-auto w-full max-w-[380px] rounded-2xl border-2 border-accent px-6 pt-2 pb-8 sm:px-8">
      <legend className="flex items-center px-2">
        <Wordmark markSize={92} textSize={24} />
      </legend>

      <h1 className="mt-4 font-heading text-[2rem] text-foreground">
        Iniciar sesión
      </h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Accedé al panel de tu restaurante.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={Boolean(errors.email)}
            {...register('email', { onChange: clearError })}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={obscurePassword ? 'password' : 'text'}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="pr-12"
              {...register('password', { onChange: clearError })}
            />
            <button
              type="button"
              onClick={() => setObscurePassword((value) => !value)}
              aria-label={
                obscurePassword ? 'Mostrar contraseña' : 'Ocultar contraseña'
              }
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {obscurePassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center">
          <div className="flex items-center gap-2.5">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="font-normal text-foreground">
              Recordarme
            </Label>
          </div>
          <button
            type="button"
            onClick={onForgotPassword}
            className="ml-auto text-sm font-medium text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className={cn(
              'flex items-start gap-2.5 rounded-md border border-destructive/35 bg-destructive/8 px-4 py-3',
            )}
          >
            <AlertCircle className="mt-0.5 size-[18px] shrink-0 text-destructive" />
            <p className="text-[13px] leading-[1.45] text-foreground">
              {error}
            </p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--brand-crimson)] text-white hover:bg-[var(--brand-crimson)]/90"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            'Ingresar'
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[13px] text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full" asChild>
        <Link to={paths.register}>Registrar mi restaurante</Link>
      </Button>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        ¿Eres mozo? Pedí tu acceso al administrador del local.
      </p>
    </fieldset>
  )
}
