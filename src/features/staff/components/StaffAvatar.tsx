import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { RolStaff } from '@/types/staff'

import { avatarClasses, initialsFromNombre } from '../domain/staffRules'

interface StaffAvatarProps {
  nombre: string
  rol: RolStaff
  className?: string
}

export function StaffAvatar({ nombre, rol, className }: StaffAvatarProps) {
  return (
    <Avatar className={cn('size-9', className)}>
      <AvatarFallback className={cn('font-medium', avatarClasses(rol))}>
        {initialsFromNombre(nombre)}
      </AvatarFallback>
    </Avatar>
  )
}
