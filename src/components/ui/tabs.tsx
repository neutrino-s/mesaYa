import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex w-fit items-center gap-1 border-b border-border',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors outline-none',
        'hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background rounded-t-sm',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:border-primary data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- convención de shadcn/ui: primitives re-exportadas junto al componente
export { Tabs, TabsContent, TabsList, TabsTrigger }
