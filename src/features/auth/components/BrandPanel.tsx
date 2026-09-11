import { cn } from '@/lib/utils'

interface BlobProps {
  color: string
  factor: number
  x: number
  y: number
  softStop?: number
}

/** Círculo difuso de fondo. Los carmesíes dan el golpe de color, los rosados
 * y el rubor son solo luz. */
function Blob({ color, factor, x, y, softStop = 0.82 }: BlobProps) {
  return (
    <div
      className="absolute aspect-square"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${factor * 100}%`,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle closest-side, ${color} ${softStop * 100}%, transparent 100%)`,
      }}
    />
  )
}

function BrandFooter() {
  return (
    <div className="flex items-center gap-6 text-sm text-white/55">
      <span>© 2026 MesaYa</span>
      <span>Ayuda</span>
      <span>Privacidad</span>
    </div>
  )
}

const headline = (
  <h1 className="font-heading text-[2.5rem] leading-[1.22] tracking-[-0.01em] text-white">
    La carta en el celular,
    <br />
    el pedido en la mesa.
  </h1>
)

const paragraph = (
  <p className="max-w-[340px] text-[15px] leading-[1.65] text-white/78">
    Tus clientes escanean el QR, piden y pagan desde su celular. Vos
    administrás carta, menús, mozos y stock desde un solo lugar.
  </p>
)

/** El panel de marca de las pantallas de acceso: degradado de ciruela con
 * blobs difusos, igual al panel del login de Flutter. */
export function BrandPanel({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-gradient-to-br from-auth-gradient-start to-auth-gradient-end',
        className,
      )}
    >
      <Blob color="rgba(220,49,72,0.85)" factor={0.52} x={0.92} y={0.1} />
      <Blob
        color="rgba(237,172,196,0.16)"
        factor={0.85}
        x={0.02}
        y={0.62}
        softStop={0.35}
      />
      <Blob color="rgba(220,49,72,0.8)" factor={0.55} x={0.62} y={1.02} />
      <Blob
        color="rgba(255,222,216,0.14)"
        factor={0.4}
        x={0.12}
        y={0.86}
        softStop={0.4}
      />

      {compact ? (
        <div className="relative flex h-full flex-col justify-end gap-6 p-7">
          <h1 className="font-heading text-[1.75rem] leading-[1.25] tracking-[-0.01em] text-white">
            La carta en el celular,
            <br />
            el pedido en la mesa.
          </h1>
        </div>
      ) : (
        <div className="relative flex h-full flex-col p-12">
          <div className="flex flex-1 flex-col justify-center gap-6">
            {headline}
            {paragraph}
          </div>
          <BrandFooter />
        </div>
      )}
    </div>
  )
}
