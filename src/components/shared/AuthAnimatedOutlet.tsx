import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router-dom'

/** Fade sutil entre `LoginPage` y `RegisterPage` (mismo patrón que
 * `PanelAnimatedOutlet`), para que ir a "Registrar mi restaurante" no se
 * sienta como un salto brusco de pantalla. */
export function AuthAnimatedOutlet() {
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
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}
