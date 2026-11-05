import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterDefs, Grain } from '../components/cinema/Grain.tsx'
import { Laurel } from '../components/cinema/Laurel.tsx'
import { ESCENAS, PALETAS, img, type Escena } from '../content/escenas.ts'

const EASE = [0.22, 1, 0.36, 1] as const
const GRADE = 'saturate(.55) contrast(1.12) brightness(.5)'

function Background({ escena }: { escena: Escena }) {
  const p = PALETAS[escena.acto]
  return (
    <motion.div
      key={escena.id + '-bg'}
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* Ken Burns: deriva lenta para que la imagen "respire" */}
      <motion.img
        src={img(escena.bg)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: GRADE }}
        initial={{ scale: 1.05, x: '0%' }}
        animate={{ scale: 1.16, x: '-2%' }}
        transition={{ duration: 28, ease: 'linear' }}
      />
      <div className="absolute inset-0 mix-blend-color" style={{ background: p.tint, opacity: 0.55 }} />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 70% 25%, ${p.glow}33, transparent 55%), linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.15) 40%, rgba(0,0,0,.85))` }}
      />
    </motion.div>
  )
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: '1.2cqw', filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.9, delay: 0.25 + i * 0.14, ease: EASE },
})

const kickerStyle = { fontSize: '0.95cqw', letterSpacing: '0.32em', textTransform: 'uppercase' as const, opacity: 0.8 }

function Title({ text, size }: { text: string; size: string }) {
  return (
    <motion.h1
      {...rise(1)}
      className="font-display"
      style={{ fontSize: size, lineHeight: 0.92, color: 'var(--accent)', filter: 'url(#distress)', margin: 0 }}
    >
      {text}
    </motion.h1>
  )
}

function Hero({ e }: { e: Escena }) {
  // Títulos cortos: centrados y enormes. Largos: a la izquierda, para no pisar la cita de la derecha.
  const long = e.title.length > 18
  const size = long ? '7.4cqw' : e.title.length > 12 ? '10cqw' : '13cqw'
  return (
    <>
      <div
        className={long ? 'absolute' : 'absolute inset-x-0 text-center'}
        style={long ? { top: '9cqw', left: '9cqw', width: '54cqw' } : { top: '8.5cqw' }}
      >
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw', padding: long ? 0 : '0 10cqw' }}>
          <Title text={e.title} size={size} />
        </div>
      </div>
      <div className="absolute" style={{ right: '6cqw', bottom: '16cqw', width: '29cqw' }}>
        {e.statement && (
          <motion.p {...rise(2)} style={{ fontSize: '1.55cqw', lineHeight: 1.25, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.03em' }}>
            “{e.statement}”
          </motion.p>
        )}
        {e.body && <motion.p {...rise(3)} style={{ fontSize: '0.95cqw', lineHeight: 1.5, opacity: 0.75, marginTop: '1cqw' }}>{e.body}</motion.p>}
        {e.seals && (
          <motion.div {...rise(4)} className="flex" style={{ gap: '1.4cqw', marginTop: '1.6cqw' }}>
            {e.seals.map((s) => <Laurel key={s} label={s} />)}
          </motion.div>
        )}
      </div>
    </>
  )
}

function Synopsis({ e }: { e: Escena }) {
  return (
    <div className="absolute" style={{ left: '9cqw', right: '9cqw', top: '15cqw' }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <div className="flex items-start justify-between" style={{ marginTop: '2cqw', gap: '6cqw' }}>
        <div style={{ width: '44cqw' }}>
          <Title text={e.title} size="5.2cqw" />
          {e.statement && (
            <motion.p {...rise(2)} style={{ fontSize: '2.1cqw', lineHeight: 1.22, fontWeight: 600, textTransform: 'uppercase', marginTop: '2cqw' }}>
              {e.statement}
            </motion.p>
          )}
        </div>
        {e.body && (
          <motion.p {...rise(3)} style={{ width: '27cqw', fontSize: '1.2cqw', lineHeight: 1.65, opacity: 0.8, marginTop: '1cqw' }}>
            {e.body}
          </motion.p>
        )}
      </div>
    </div>
  )
}

function CardView({ c, i, big }: { c: NonNullable<Escena['cards']>[number]; i: number; big: boolean }) {
  return (
    <motion.figure
      {...rise(2 + i)}
      className="m-0 flex flex-col"
      style={{ flex: big ? '0 0 21cqw' : 1, minWidth: 0 }}
    >
      <div className="overflow-hidden" style={{ aspectRatio: '4 / 5', border: '1px solid rgba(255,255,255,.14)' }}>
        <motion.img
          src={img(c.img)}
          alt={c.name}
          className="h-full w-full object-cover"
          style={{ filter: 'saturate(.8) contrast(1.05)' }}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        />
      </div>
      <figcaption style={{ marginTop: '0.9cqw' }}>
        <span style={{ fontSize: '0.7cqw', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.65, border: '1px solid rgba(255,255,255,.3)', padding: '0.15cqw 0.5cqw' }}>
          {c.tag}
        </span>
        <p style={{ fontSize: big ? '1.7cqw' : '1.25cqw', fontWeight: 600, textTransform: 'uppercase', margin: '0.7cqw 0 0.3cqw' }}>{c.name}</p>
        <p style={{ fontSize: big ? '1.05cqw' : '0.85cqw', lineHeight: 1.45, opacity: 0.75, margin: 0 }}>{c.line}</p>
      </figcaption>
    </motion.figure>
  )
}

function Cards({ e }: { e: Escena }) {
  const cards = e.cards ?? []
  if (cards.length <= 2) {
    return (
      <div className="absolute flex items-start justify-between" style={{ left: '9cqw', right: '9cqw', top: '11cqw' }}>
        <div style={{ width: '38cqw', paddingTop: '2cqw' }}>
          <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
          <div style={{ marginTop: '1.6cqw' }}><Title text={e.title} size="6cqw" /></div>
          {e.statement && (
            <motion.p {...rise(2)} style={{ fontSize: '1.7cqw', lineHeight: 1.3, marginTop: '2cqw', opacity: 0.9 }}>{e.statement}</motion.p>
          )}
        </div>
        <div className="flex" style={{ gap: '2cqw' }}>
          {cards.map((c, i) => <CardView key={c.name} c={c} i={i} big />)}
        </div>
      </div>
    )
  }
  return (
    <div className="absolute" style={{ left: '7cqw', right: '7cqw', top: '7.5cqw' }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <div style={{ margin: '1cqw 0 2cqw' }}><Title text={e.title} size="4.2cqw" /></div>
      <div className="flex" style={{ gap: '1.4cqw' }}>
        {cards.map((c, i) => <CardView key={c.name} c={c} i={i} big={false} />)}
      </div>
    </div>
  )
}

function Strip({ index, go }: { index: number; go: (i: number) => void }) {
  const items = [-2, -1, 0, 1, 2].map((d) => ({ d, i: index + d })).filter(({ i }) => i >= 0 && i < ESCENAS.length)
  return (
    <div className="absolute inset-x-0 z-10 flex items-end justify-center" style={{ bottom: '2.2cqw', gap: '0.8cqw' }}>
      {items.map(({ d, i }) => {
        const s = ESCENAS[i]
        const active = d === 0
        return (
          <motion.button
            key={s.id}
            layout
            onClick={() => go(i)}
            className="relative cursor-pointer overflow-hidden border-0 p-0 text-left"
            style={{ width: active ? '15cqw' : '9cqw', height: active ? '6.6cqw' : '5cqw', opacity: active ? 1 : 0.5, outline: active ? '1px solid var(--accent)' : 'none' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <img src={img(s.bg)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: GRADE }} />
            <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent)' }} />
            <span className="absolute" style={{ left: '0.6cqw', bottom: '0.45cqw', right: '0.4cqw', color: '#fff', fontSize: active ? '0.75cqw' : '0.6cqw', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.15 }}>
              {s.title}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

export default function Presentar() {
  const [params, setParams] = useSearchParams()
  const found = ESCENAS.findIndex((s) => s.id === params.get('s'))
  const index = found >= 0 ? found : 0
  const e = ESCENAS[index]
  const p = PALETAS[e.acto]

  const go = useCallback(
    (i: number) => {
      const j = Math.max(0, Math.min(ESCENAS.length - 1, i))
      setParams({ s: ESCENAS[j].id }, { replace: true })
    },
    [setParams],
  )

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); go(index + 1) }
      else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { go(index - 1) }
      else if (ev.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  // Precarga la siguiente imagen para que el cambio de escena sea instantáneo.
  useEffect(() => {
    const next = ESCENAS[index + 1]
    if (next) new Image().src = img(next.bg)
  }, [index])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <FilterDefs />
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '16 / 9', width: 'min(100vw, calc(100vh * 16 / 9))', containerType: 'size', ['--accent' as string]: p.accent, color: '#f3ece0', background: '#050505' }}
      >
        <AnimatePresence>
          <Background key={e.id + '-bg'} escena={e} />
        </AnimatePresence>
        <Grain />

        {/* Barra superior, como el menú de un sitio de cine */}
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ padding: '1.6cqw 3cqw', fontSize: '0.8cqw', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          <span style={{ fontWeight: 600 }}>Citoyen</span>
          <nav className="flex" style={{ gap: '2.4cqw' }}>
            {([1, 2, 3, 4, 5] as const).map((a) => (
              <span key={a} style={{ opacity: a === e.acto ? 1 : 0.4, color: a === e.acto ? 'var(--accent)' : undefined, transition: 'opacity .6s' }}>
                {PALETAS[a].numeral} · {PALETAS[a].name}
              </span>
            ))}
          </nav>
          <span style={{ border: '1px solid rgba(255,255,255,.5)', padding: '0.4cqw 1.2cqw' }}>
            {String(index + 1).padStart(2, '0')} / {ESCENAS.length}
          </span>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={e.id} className="absolute inset-0 z-10" exit={{ opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.45 }}>
            {e.layout === 'hero' && <Hero e={e} />}
            {e.layout === 'synopsis' && <Synopsis e={e} />}
            {e.layout === 'cards' && <Cards e={e} />}
            {e.vivo && (
              <motion.span {...rise(5)} className="absolute flex items-center" style={{ right: '3cqw', top: '4.6cqw', gap: '0.5cqw', fontSize: '0.75cqw', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8 }}>
                <i className="inline-block rounded-full" style={{ width: '0.55cqw', height: '0.55cqw', background: '#e5484d', animation: 'pulse 1.6s infinite' }} />
                Responden en el celular
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>

        <Strip index={index} go={go} />
        <div className="absolute bottom-0 left-0 z-20 h-[3px]" style={{ width: `${((index + 1) / ESCENAS.length) * 100}%`, background: 'var(--accent)', transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}
