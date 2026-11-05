// Composiciones del proyector: cada escena usa una distinta para que no se repita la misma distribución.
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Laurel } from '../components/cinema/Laurel.tsx'
import { img, type Escena } from '../content/escenas.ts'

export const EASE = [0.22, 1, 0.36, 1] as const
export const rise = (i: number) => ({
  initial: { opacity: 0, y: '1.2cqw', filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.9, delay: 0.25 + i * 0.14, ease: EASE },
})
export const kickerStyle = { fontSize: '0.95cqw', letterSpacing: '0.32em', textTransform: 'uppercase' as const, opacity: 0.8 }
export const panel = { background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.14)', padding: '1.8cqw', backdropFilter: 'blur(4px)' }
const serif = "'Cormorant Garamond', Georgia, serif"
const side = (der: boolean, v: string) => (der ? { right: v } : { left: v })

export function Title({ text, size }: { text: string; size: string }) {
  return (
    <motion.h1 {...rise(1)} className="font-display" style={{ fontSize: size, lineHeight: 0.92, color: 'var(--accent)', filter: 'url(#distress)', margin: 0 }}>
      {text}
    </motion.h1>
  )
}

function Seals({ e }: { e: Escena }) {
  if (!e.seals) return null
  return (
    <motion.div {...rise(4)} className="flex" style={{ gap: '1.4cqw', marginTop: '1.6cqw' }}>
      {e.seals.map((s) => <Laurel key={s} label={s} />)}
    </motion.div>
  )
}

/** Cartel de cine: título enorme abajo, una columna breve arriba al lado opuesto. */
export function Poster({ e }: { e: Escena }) {
  const der = e.lado === 'der'
  const size = e.title.length > 12 ? '10cqw' : '14cqw'
  return (
    <>
      <div className="absolute" style={{ bottom: '14.5cqw', width: '62cqw', textAlign: der ? 'right' : 'left', ...side(der, '6cqw') }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1cqw' }}><Title text={e.title} size={size} /></div>
      </div>
      <motion.div {...rise(2)} className="absolute" style={{ top: '11cqw', width: '25cqw', borderTop: '2px solid var(--accent)', paddingTop: '1.2cqw', ...side(!der, '6cqw') }}>
        {e.statement && <p style={{ fontSize: '1.45cqw', lineHeight: 1.3, textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>“{e.statement}”</p>}
        {e.body && <p style={{ fontSize: '0.95cqw', lineHeight: 1.5, opacity: 0.8, margin: '1cqw 0 0' }}>{e.body}</p>}
        <Seals e={e} />
      </motion.div>
    </>
  )
}

/** Fecha gigante de un lado, texto del otro. */
export function DateLayout({ e }: { e: Escena }) {
  const der = e.lado === 'der'
  const f = e.fecha ?? { grande: '' }
  return (
    <>
      <div className="absolute" style={{ top: '9cqw', textAlign: der ? 'right' : 'left', ...side(der, '7cqw') }}>
        <motion.div {...rise(1)} className="font-display" style={{ fontSize: f.grande.length > 5 ? '17cqw' : '22cqw', lineHeight: 0.9, color: 'var(--accent)', filter: 'url(#distress)' }}>{f.grande}</motion.div>
        {f.chica && <motion.p {...rise(2)} style={{ fontSize: '1.5cqw', letterSpacing: '0.45em', textTransform: 'uppercase', margin: '1.2cqw 0 0', opacity: 0.85 }}>{f.chica}</motion.p>}
      </div>
      <div className="absolute" style={{ top: '19cqw', width: '38cqw', ...side(!der, '8cqw') }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw' }}><Title text={e.title} size="4.4cqw" /></div>
        {e.statement && <motion.p {...rise(2)} style={{ fontSize: '1.45cqw', lineHeight: 1.35, textTransform: 'uppercase', marginTop: '1.6cqw' }}>{e.statement}</motion.p>}
        {e.body && <motion.p {...rise(3)} style={{ fontSize: '1.05cqw', lineHeight: 1.6, opacity: 0.8, marginTop: '1.2cqw' }}>{e.body}</motion.p>}
        <Seals e={e} />
      </div>
    </>
  )
}

/** Cita centrada, tipografía de época. */
export function QuoteLayout({ e }: { e: Escena }) {
  const long = (e.statement?.length ?? 0) > 60
  return (
    <div className="absolute inset-x-0 text-center" style={{ top: '9.5cqw' }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <motion.div {...rise(1)} style={{ fontFamily: serif, fontSize: '15cqw', lineHeight: 0.55, height: '7cqw', marginTop: '4cqw', color: 'var(--accent)', opacity: 0.5 }}>“</motion.div>
      <motion.p {...rise(2)} style={{ fontFamily: serif, fontStyle: 'italic', fontSize: long ? '3.2cqw' : '4.4cqw', lineHeight: 1.22, width: '62cqw', margin: '0 auto' }}>{e.statement}</motion.p>
      <motion.div {...rise(3)} style={{ width: '6cqw', height: '2px', background: 'var(--accent)', margin: '2cqw auto 1.2cqw' }} />
      <motion.p {...rise(3)} className="font-display" style={{ fontSize: '3cqw', color: 'var(--accent)', margin: 0, filter: 'url(#distress)' }}>{e.title}</motion.p>
      {e.body && <motion.p {...rise(4)} style={{ fontSize: '1.1cqw', opacity: 0.75, margin: '1cqw auto 0', width: '40cqw', lineHeight: 1.5 }}>{e.body}</motion.p>}
    </div>
  )
}

/** Retrato a pantalla completa en un borde, texto en el otro. `extra` = muro de textos del Cordelier. */
export function Split({ e, extra }: { e: Escena; extra?: ReactNode }) {
  const der = e.lado === 'der'
  const c = e.cards?.[0]
  const wall = Boolean(extra)
  const mask = `linear-gradient(to ${der ? 'left' : 'right'}, #000 62%, transparent)`
  return (
    <>
      {c && (
        <motion.div initial={{ opacity: 0, x: der ? '3cqw' : '-3cqw' }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.1, ease: EASE }}
          className="absolute inset-y-0 overflow-hidden" style={{ width: '36cqw', WebkitMaskImage: mask, maskImage: mask, ...side(der, '0') }}>
          <motion.img src={img(c.img)} alt={c.name} className="h-full w-full object-cover" style={{ filter: 'saturate(.85) contrast(1.05)' }} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }} />
        </motion.div>
      )}
      <div className="absolute" style={{ top: '10cqw', width: '48cqw', ...side(!der, '9cqw') }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw' }}><Title text={e.title} size="6cqw" /></div>
        {c && <motion.p {...rise(2)} style={{ margin: '1.4cqw 0 0', fontSize: '1.3cqw', textTransform: 'uppercase', fontWeight: 600 }}>{c.name} <span style={{ opacity: 0.55, fontWeight: 400, letterSpacing: '0.12em', fontSize: '0.8cqw' }}>· {c.tag}</span></motion.p>}
        {e.statement && <motion.p {...rise(3)} style={{ fontSize: wall ? '1.3cqw' : '1.9cqw', lineHeight: 1.3, marginTop: '1.2cqw', opacity: 0.92 }}>{e.statement}</motion.p>}
        {c && !wall && <motion.p {...rise(4)} style={{ fontSize: '1.05cqw', lineHeight: 1.5, opacity: 0.7, marginTop: '1.2cqw', borderLeft: '2px solid var(--accent)', paddingLeft: '1.2cqw' }}>{c.line}</motion.p>}
        {extra}
      </div>
    </>
  )
}

type CardT = NonNullable<Escena['cards']>[number]

function DuelPortrait({ c, left, i }: { c: CardT; left: boolean; i: number }) {
  return (
    <motion.figure {...rise(1 + i)} className="absolute m-0" style={{ top: '9.5cqw', width: '21cqw', ...side(!left, '6cqw') }}>
      <div className="overflow-hidden" style={{ aspectRatio: '4 / 5', border: '1px solid rgba(255,255,255,.18)' }}>
        <motion.img src={img(c.img)} alt={c.name} className="h-full w-full object-cover" style={{ filter: 'saturate(.8) contrast(1.05)' }} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: EASE }} />
      </div>
      <figcaption style={{ marginTop: '0.8cqw', textAlign: left ? 'left' : 'right' }}>
        <p style={{ fontSize: '1.25cqw', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>{c.name}</p>
        <p style={{ fontSize: '0.8cqw', opacity: 0.65, margin: '0.25cqw 0 0', lineHeight: 1.4 }}>{c.line}</p>
      </figcaption>
    </motion.figure>
  )
}

/** Dos retratos enfrentados con el texto en el centro. */
export function Duel({ e }: { e: Escena }) {
  const [a, b] = e.cards ?? []
  return (
    <>
      {a && <DuelPortrait c={a} left i={0} />}
      {b && <DuelPortrait c={b} left={false} i={1} />}
      <div className="absolute text-center" style={{ top: '15cqw', left: '31cqw', width: '38cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.4cqw' }}><Title text={e.title} size="4.6cqw" /></div>
        {e.statement && <motion.p {...rise(3)} style={{ fontSize: '1.4cqw', lineHeight: 1.4, marginTop: '2cqw', opacity: 0.92 }}>{e.statement}</motion.p>}
      </div>
    </>
  )
}

/** Tercio inferior de película (con barras de cine opcionales). */
export function Lower({ e }: { e: Escena }) {
  return (
    <>
      {e.barras && (
        <>
          <motion.div initial={{ height: 0 }} animate={{ height: '7.5cqw' }} transition={{ duration: 1.2, ease: EASE }} className="absolute inset-x-0 top-0 bg-black" style={{ zIndex: -1 }} />
          <motion.div initial={{ height: 0 }} animate={{ height: '12.5cqw' }} transition={{ duration: 1.2, ease: EASE }} className="absolute inset-x-0 bottom-0 bg-black" style={{ zIndex: -1 }} />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '34cqw', background: 'linear-gradient(to top, rgba(0,0,0,.92), transparent)', zIndex: -1 }} />
      <div className="absolute" style={{ left: '6cqw', bottom: '14.5cqw', width: '46cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1cqw' }}><Title text={e.title} size="6.6cqw" /></div>
      </div>
      <motion.div {...rise(2)} className="absolute" style={{ left: '58cqw', bottom: '15cqw', width: '35cqw', borderLeft: '2px solid var(--accent)', paddingLeft: '1.4cqw' }}>
        {e.statement && <p style={{ fontSize: '1.5cqw', lineHeight: 1.3, textTransform: 'uppercase', margin: 0 }}>{e.statement}</p>}
        {e.body && <p style={{ fontSize: '1cqw', lineHeight: 1.5, opacity: 0.75, margin: '0.8cqw 0 0' }}>{e.body}</p>}
      </motion.div>
    </>
  )
}

/** Tres columnas numeradas. */
export function Triptych({ e }: { e: Escena }) {
  return (
    <div className="absolute" style={{ left: '8cqw', right: '8cqw', top: '9cqw' }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <div style={{ marginTop: '1.2cqw' }}><Title text={e.title} size="5cqw" /></div>
      {e.statement && <motion.p {...rise(1)} style={{ fontSize: '1.3cqw', opacity: 0.85, margin: '1cqw 0 0', maxWidth: '50cqw' }}>{e.statement}</motion.p>}
      <div className="flex" style={{ gap: '3cqw', marginTop: '3cqw' }}>
        {(e.columnas ?? []).map((c, i) => (
          <motion.div key={c.titulo} {...rise(2 + i)} style={{ flex: 1, borderTop: '2px solid var(--accent)', paddingTop: '1cqw' }}>
            <div className="font-display" style={{ fontSize: '8cqw', lineHeight: 0.9, color: 'var(--accent)' }}>{c.num}</div>
            <p style={{ fontSize: '1.7cqw', fontWeight: 600, textTransform: 'uppercase', margin: '0.6cqw 0 0.3cqw' }}>{c.titulo}</p>
            <p style={{ fontSize: '1.15cqw', opacity: 0.75, margin: 0 }}>{c.texto}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** Línea de tiempo horizontal (cronología obligatoria del Terror). */
export function Timeline({ e }: { e: Escena }) {
  const h = e.hitos ?? []
  return (
    <>
      <div className="absolute" style={{ left: '8cqw', top: '9cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw' }}><Title text={e.title} size="4.6cqw" /></div>
      </div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2, delay: 0.5, ease: EASE }} className="absolute" style={{ left: '8cqw', right: '8cqw', top: '27cqw', height: '2px', background: 'var(--accent)', transformOrigin: 'left' }} />
      {h.map((x, i) => {
        const left = 8 + (84 / h.length) * (i + 0.5)
        const last = i === h.length - 1
        return (
          <motion.div key={x.fecha} {...rise(2 + i * 1.4)} className="absolute text-center" style={{ left: `${left}cqw`, top: '20.5cqw', width: '19cqw', marginLeft: '-9.5cqw' }}>
            <p className="font-display" style={{ fontSize: '2.6cqw', color: 'var(--accent)', margin: 0, lineHeight: 1 }}>{x.fecha}</p>
            <i className="mx-auto block rounded-full" style={{ width: last ? '1.3cqw' : '0.9cqw', height: last ? '1.3cqw' : '0.9cqw', background: 'var(--accent)', margin: '2.6cqw auto 1.6cqw', boxShadow: last ? '0 0 1.6cqw var(--accent)' : 'none' }} />
            <p style={{ fontSize: '1.05cqw', lineHeight: 1.5, opacity: 0.85, margin: 0 }}>{x.texto}</p>
          </motion.div>
        )
      })}
    </>
  )
}

/** Palabra gigante de fondo + frase abajo. */
export function BigWord({ e }: { e: Escena }) {
  return (
    <>
      <motion.div {...rise(0)} className="font-display absolute" style={{ left: '5cqw', top: '7cqw', fontSize: '33cqw', lineHeight: 0.85, color: 'transparent', WebkitTextStroke: '0.18cqw var(--accent)', opacity: 0.5, pointerEvents: 'none' }}>{e.palabra}</motion.div>
      <div className="absolute" style={{ left: '9cqw', bottom: '16cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      </div>
      <div className="absolute" style={{ right: '7cqw', bottom: '15cqw', width: '40cqw', ...panel }}>
        <Title text={e.title} size="3.6cqw" />
        {e.statement && <motion.p {...rise(2)} style={{ fontSize: '1.45cqw', lineHeight: 1.35, textTransform: 'uppercase', marginTop: '1.2cqw' }}>{e.statement}</motion.p>}
        {e.body && <motion.p {...rise(3)} style={{ fontSize: '1cqw', lineHeight: 1.5, opacity: 0.75, marginTop: '1cqw' }}>{e.body}</motion.p>}
      </div>
    </>
  )
}

/** Retratos escalonados, como las tarjetas de noticias de un sitio de cine. */
export function Filmstrip({ e }: { e: Escena }) {
  return (
    <>
      <div className="absolute" style={{ left: '6cqw', top: '7.5cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '0.8cqw' }}><Title text={e.title} size="3.8cqw" /></div>
      </div>
      <div className="absolute flex" style={{ left: '5cqw', right: '5cqw', top: '17cqw', gap: '2.4cqw' }}>
        {(e.cards ?? []).map((c, i) => (
          <motion.figure key={c.name} {...rise(2 + i)} className="m-0" style={{ flex: 1, minWidth: 0, marginTop: i % 2 ? '3.4cqw' : 0 }}>
            <div className="overflow-hidden" style={{ aspectRatio: '4 / 5', border: '1px solid rgba(255,255,255,.16)' }}>
              <motion.img src={img(c.img)} alt={c.name} className="h-full w-full object-cover" style={{ filter: 'saturate(.8) contrast(1.05)' }} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: EASE }} />
            </div>
            <figcaption style={{ marginTop: '0.7cqw' }}>
              <p style={{ fontSize: '1.1cqw', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: '0.78cqw', lineHeight: 1.4, opacity: 0.7, margin: '0.25cqw 0 0' }}>{c.line}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </>
  )
}
