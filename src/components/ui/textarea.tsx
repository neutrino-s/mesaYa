import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full resize-none rounded-md border border-auth-field-border bg-auth-field-fill px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
