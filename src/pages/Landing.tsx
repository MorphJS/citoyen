import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const btn =
  'flex min-h-14 items-center justify-center rounded-lg border border-gold/60 px-6 text-lg font-medium text-parchment transition hover:bg-gold/10'

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-4 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-6xl font-bold text-gold"
      >
        Citoyen
      </motion.h1>
      <p className="font-serif text-xl italic text-parchment/80">Francia, 1750–1794: tu vida</p>
      <nav className="flex w-full flex-col gap-4">
        <Link to="/presentar" className={btn}>
          Presentar
        </Link>
        <Link to="/jugar" className={btn}>
          Jugar
        </Link>
      </nav>
    </main>
  )
}
