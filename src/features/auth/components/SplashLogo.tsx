import { motion } from 'motion/react'

import logo from '@/assets/logo.svg'

/** El logo del splash, con una animación en loop pensada para divertir
 * durante la espera: un resplandor que respira detrás, y el propio logo
 * flotando con un balanceo suave, como una mesa que gira. */
export function SplashLogo() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <motion.div
        className="absolute rounded-full bg-white/15 blur-2xl"
        style={{ width: 200, height: 200 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.img
        src={logo}
        alt="MesaYa"
        className="relative select-none drop-shadow-xl"
        style={{ width: 128, height: 128 }}
        initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
        animate={{
          opacity: 1,
          scale: [1, 1.08, 1],
          rotate: [-6, 6, -6],
          y: [0, -12, 0],
        }}
        transition={{
          opacity: { duration: 0.5, ease: 'easeOut' },
          scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          rotate: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
        }}
      />
    </div>
  )
}
