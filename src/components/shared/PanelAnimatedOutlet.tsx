import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router-dom'

/** Envuelve el `Outlet` del panel con un fade sutil en cada cambio de ruta,
 * para que la navegación entre pantallas no se sienta brusca. Usa
 * `useOutlet` (en vez de `<Outlet />` directo) para poder capturar el
 * elemento saliente mientras anima su salida. */
export function PanelAnimatedOutlet() {
  const location = useLocation()
  const element = useOutlet()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="flex flex-1 flex-col"
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}
