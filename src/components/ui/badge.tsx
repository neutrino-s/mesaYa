import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Badge({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
