import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-13 w-full rounded-md border border-auth-field-border bg-auth-field-fill px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
