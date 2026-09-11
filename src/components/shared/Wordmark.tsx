import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

interface WordmarkProps {
  /** `true` cuando va sobre el degradado de marca. */
  onDark?: boolean
  markSize?: number
  textSize?: number
  className?: string
}

/** La marca, en sus dos versiones: sobre el panel de ciruela y sobre fondo
 * claro. Es el mismo dibujo, cambia a qué contrasta. */
export function Wordmark({
  onDark = false,
  markSize = 48,
  textSize = 26,
  className,
}: WordmarkProps) {
  return (
    <div className={cn('flex min-w-0 items-center', className)} style={{ gap: markSize * 0.12 }}>
      <img
        src={logo}
        alt="MesaYa"
        className="shrink-0 select-none"
        style={{ width: markSize, height: markSize }}
      />
      <span
        className={cn(
          'font-heading truncate',
          onDark ? 'text-white' : 'text-primary',
        )}
        style={{ fontSize: textSize }}
      >
        MesaYa
      </span>
    </div>
  )
}
