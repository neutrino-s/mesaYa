import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type KeyboardEvent, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Wordmark } from '@/components/shared/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { TIPO_NEGOCIO_OPTIONS } from '@/types/restaurante'

import { useRegister } from '../hooks/useRegister'
import { type RegisterFormValues, registerSchema } from '../domain/registerSchema'

/** Los campos se agrupan en 2 pasos de 5 campos cada uno para que ambos
 * fieldsets queden con la misma altura (y esa altura sea pareja con la del
 * login) en vez de un paso mucho más corto que el otro. Cada paso valida
 * solo sus propios campos antes de avanzar. */
const STEPS: { title: string; fields: (keyof RegisterFormValues)[] }[] = [
  {
    title: 'Tu restaurante',
    fields: [
      'nombreRestaurante',
      'tipoNegocio',
      'sucursales',
      'direccion',
      'telefono',
    ],
  },
  {
    title: 'Tu cuenta',
    fields: [
      'nombreAdmin',
      'telefonoContacto',
      'email',
      'password',
      'confirmPassword',
    ],
  },
]

const LAST_STEP = STEPS.length - 1

export function RegisterForm() {
  const { submit, submitting, error, clearError } = useRegister()
  const [obscurePassword, setObscurePassword] = useState(true)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombreRestaurante: '',
      sucursales: '',
      direccion: '',
      telefono: '',
      nombreAdmin: '',
      telefonoContacto: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    await submit(values)
  }

  async function goNext() {
    const valid = await trigger(STEPS[step].fields)
    if (!valid) return
    setDirection(1)
    setStep((value) => Math.min(value + 1, LAST_STEP))
  }

  function goBack() {
    clearError()
    setDirection(-1)
    setStep((value) => Math.max(value - 1, 0))
  }

  // Enter no debe mandar el formulario mientras queden pasos por completar.
  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && step < LAST_STEP) {
      event.preventDefault()
      void goNext()
    }
  }

  return (
    <fieldset className="mx-auto w-full max-w-[380px] rounded-2xl border-2 border-accent px-6 pt-2 pb-8 sm:px-8">
      <legend className="flex items-center px-2">
        <Wordmark markSize={92} textSize={24} />
      </legend>

      {step === 0 ? (
        <>
          <h1 className="mt-2 font-heading text-2xl leading-tight text-foreground">
            Registrá tu restaurante
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá la cuenta del local y empezá a armar tu carta.
          </p>
        </>
      ) : (
        <h2 className="mt-2 font-heading text-xl text-foreground">
          {STEPS[step].title}
        </h2>
      )}

      <div className="mt-3 flex items-center gap-2">
        {STEPS.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index <= step ? 'bg-accent' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Paso {step + 1} de {STEPS.length}
      </p>

      <form
        className="mt-3 flex flex-col gap-3"
        noValidate
        onKeyDown={onFormKeyDown}
        onSubmit={handleSubmit(onSubmit)}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: 16 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 * direction }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="flex flex-col gap-3"
          >
            {step === 0 ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nombreRestaurante">
                    Nombre del restaurante
                  </Label>
                  <Input
                    id="nombreRestaurante"
                    type="text"
                    autoComplete="organization"
                    aria-invalid={Boolean(errors.nombreRestaurante)}
                    {...register('nombreRestaurante', { onChange: clearError })}
                  />
                  {errors.nombreRestaurante ? (
                    <p className="text-xs text-destructive">
                      {errors.nombreRestaurante.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipoNegocio">Tipo de negocio</Label>
                    <Controller
                      name="tipoNegocio"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(value) => {
                            field.onChange(value)
                            clearError()
                          }}
                        >
                          <SelectTrigger
                            id="tipoNegocio"
                            aria-invalid={Boolean(errors.tipoNegocio)}
                          >
                            <span className="min-w-0 flex-1 truncate text-left">
                              <SelectValue placeholder="Elegí una opción" />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_NEGOCIO_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.tipoNegocio ? (
                      <p className="text-xs text-destructive">
                        {errors.tipoNegocio.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sucursales">Sucursales</Label>
                    <Input
                      id="sucursales"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      aria-invalid={Boolean(errors.sucursales)}
                      {...register('sucursales', { onChange: clearError })}
                    />
                    {errors.sucursales ? (
                      <p className="text-xs text-destructive">
                        {errors.sucursales.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="direccion">
                      Dirección del restaurante
                    </Label>
                    <Input
                      id="direccion"
                      type="text"
                      autoComplete="street-address"
                      aria-invalid={Boolean(errors.direccion)}
                      {...register('direccion', { onChange: clearError })}
                    />
                    {errors.direccion ? (
                      <p className="text-xs text-destructive">
                        {errors.direccion.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="telefono">Teléfono del restaurante</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.telefono)}
                      {...register('telefono', { onChange: clearError })}
                    />
                    {errors.telefono ? (
                      <p className="text-xs text-destructive">
                        {errors.telefono.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nombreAdmin">Tu nombre completo</Label>
                    <Input
                      id="nombreAdmin"
                      type="text"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.nombreAdmin)}
                      {...register('nombreAdmin', { onChange: clearError })}
                    />
                    {errors.nombreAdmin ? (
                      <p className="text-xs text-destructive">
                        {errors.nombreAdmin.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="telefonoContacto">
                      Teléfono de contacto
                    </Label>
                    <Input
                      id="telefonoContacto"
                      type="tel"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.telefonoContacto)}
                      {...register('telefonoContacto', {
                        onChange: clearError,
                      })}
                    />
                    {errors.telefonoContacto ? (
                      <p className="text-xs text-destructive">
                        {errors.telefonoContacto.message}
                      </p>
                    ) : null}
                  </div>
                </div>

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
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={obscurePassword ? 'password' : 'text'}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password)}
                        className="pr-12"
                        {...register('password', { onChange: clearError })}
                      />
                      <button
                        type="button"
                        onClick={() => setObscurePassword((value) => !value)}
                        aria-label={
                          obscurePassword
                            ? 'Mostrar contraseña'
                            : 'Ocultar contraseña'
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

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={obscurePassword ? 'password' : 'text'}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      {...register('confirmPassword', {
                        onChange: clearError,
                      })}
                    />
                    {errors.confirmPassword ? (
                      <p className="text-xs text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>

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

        <div className="flex items-center gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1"
            >
              <ArrowLeft className="size-4" />
              Atrás
            </Button>
          ) : null}

          {step < LAST_STEP ? (
            <Button type="button" onClick={goNext} className="flex-1">
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                'Crear cuenta'
              )}
            </Button>
          )}
        </div>
      </form>

      {step === 0 ? (
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link
            to={paths.login}
            className="font-medium text-accent hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      ) : null}
    </fieldset>
  )
}
