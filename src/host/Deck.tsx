import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { FilterDefs, Grain } from '../components/cinema/Grain.tsx'
import { Laurel } from '../components/cinema/Laurel.tsx'
import { ESCENAS, PALETAS, img, type Escena } from '../content/escenas.ts'
import type { DemoData } from './demo.ts'
import { contar, debrief, porVariante, respondieron, reyVsGrupos } from './stats.ts'

const EASE = [0.22, 1, 0.36, 1] as const
const GRADE = 'saturate(.55) contrast(1.12) brightness(.5)'

export type DeckData = Pick<DemoData, 'session' | 'players' | 'decisions' | 'posts'>
export type DeckProps = {
  index: number
  go: (i: number) => void
  data: DeckData
  demo: boolean
  joinUrl?: string
  toast?: string | null
  offline?: boolean
}

function Background({ escena }: { escena: Escena }) {
  const p = PALETAS[escena.acto]
  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
      <motion.img
        src={img(escena.bg)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: GRADE }}
        initial={{ scale: 1.05, x: '0%' }} animate={{ scale: 1.16, x: '-2%' }} transition={{ duration: 28, ease: 'linear' }}
      />
      <div className="absolute inset-0 mix-blend-color" style={{ background: p.tint, opacity: 0.55 }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 25%, ${p.glow}33, transparent 55%), linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.15) 40%, rgba(0,0,0,.85))` }} />
    </motion.div>
  )
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: '1.2cqw', filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.9, delay: 0.25 + i * 0.14, ease: EASE },
})
const kickerStyle = { fontSize: '0.95cqw', letterSpacing: '0.32em', textTransform: 'uppercase' as const, opacity: 0.8 }
const panel = { background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.14)', padding: '1.8cqw', backdropFilter: 'blur(4px)' }

function Title({ text, size }: { text: string; size: string }) {
  return (
    <motion.h1 {...rise(1)} className="font-display" style={{ fontSize: size, lineHeight: 0.92, color: 'var(--accent)', filter: 'url(#distress)', margin: 0 }}>
      {text}
    </motion.h1>
  )
}

function LobbyHero({ e, d, joinUrl }: { e: Escena; d: DeckData; joinUrl?: string }) {
  const activos = d.players.filter((p) => p.status === 'active')
  return (
    <>
      <div className="absolute" style={{ top: '9cqw', left: '9cqw', width: '54cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw' }}><Title text={e.title} size="13cqw" /></div>
        <motion.p {...rise(2)} style={{ fontSize: '1.7cqw', lineHeight: 1.3, marginTop: '2cqw', color: 'var(--accent)', textTransform: 'uppercase' }}>
          “{e.statement}”
        </motion.p>
      </div>
      <motion.div {...rise(3)} className="absolute" style={{ right: '7cqw', top: '10cqw', width: '22cqw', ...panel, textAlign: 'center' }}>
        {joinUrl ? (
          <>
            <div style={{ background: '#fff', padding: '1cqw', display: 'inline-block', lineHeight: 0 }}>
              <QRCodeSVG value={joinUrl} style={{ width: '14cqw', height: '14cqw' }} level="M" />
            </div>
            <p style={{ fontSize: '0.8cqw', letterSpacing: '0.3em', opacity: 0.7, margin: '1.2cqw 0 0.2cqw' }}>CÓDIGO</p>
            <p className="font-display" style={{ fontSize: '3.4cqw', letterSpacing: '0.18em', margin: 0, color: 'var(--accent)' }}>{d.session.code}</p>
          </>
        ) : (
          <p style={{ fontSize: '1.1cqw', lineHeight: 1.5, opacity: 0.85, margin: 0 }}>Modo sin celulares.<br />Los resultados que verás son simulados.</p>
        )}
        <p style={{ fontSize: '1cqw', margin: '1cqw 0 0', opacity: 0.85 }}>
          <b style={{ fontSize: '1.6cqw', color: 'var(--accent)' }}>{activos.length}</b> ciudadanos
        </p>
      </motion.div>
      {/* Nombres franceses (ficticios) de quienes se van uniendo: nunca los apodos reales. */}
      <motion.div {...rise(4)} className="absolute flex flex-wrap" style={{ left: '9cqw', width: '54cqw', top: '34cqw', gap: '0.5cqw 1.2cqw', fontSize: '0.85cqw', opacity: 0.8, letterSpacing: '0.06em' }}>
        {activos.slice(-14).map((p) => <span key={p.id}>{p.identity.nombreFrances}</span>)}
      </motion.div>
    </>
  )
}

function Hero({ e, d, joinUrl }: { e: Escena; d: DeckData; joinUrl?: string }) {
  if (e.id === 'lobby') return <LobbyHero e={e} d={d} joinUrl={joinUrl} />
  const long = e.title.length > 18
  const size = long ? '7.4cqw' : e.title.length > 12 ? '10cqw' : '13cqw'
  return (
    <>
      <div className={long ? 'absolute' : 'absolute inset-x-0 text-center'} style={long ? { top: '9cqw', left: '9cqw', width: '54cqw' } : { top: '8.5cqw' }}>
        <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
        <div style={{ marginTop: '1.2cqw', padding: long ? 0 : '0 10cqw' }}><Title text={e.title} size={size} /></div>
      </div>
      <div className="absolute" style={{ right: '6cqw', bottom: '16cqw', width: '29cqw' }}>
        {e.statement && (
          <motion.p {...rise(2)} style={{ fontSize: '1.55cqw', lineHeight: 1.25, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.03em' }}>“{e.statement}”</motion.p>
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

function TextColumn({ e, width = '56cqw' }: { e: Escena; width?: string }) {
  return (
    <div className="absolute" style={{ left: '9cqw', top: '14cqw', width }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <div style={{ marginTop: '1.6cqw' }}><Title text={e.title} size={e.title.length > 20 ? '4.4cqw' : '5.6cqw'} /></div>
      {e.statement && (
        <motion.p {...rise(2)} style={{ fontSize: e.statement.length > 110 ? '1.6cqw' : '2.2cqw', lineHeight: 1.25, fontWeight: 600, textTransform: 'uppercase', marginTop: '2.2cqw' }}>
          {e.statement}
        </motion.p>
      )}
      {e.body && (
        <motion.div {...rise(3)} style={{ marginTop: '2cqw', paddingLeft: '1.4cqw', borderLeft: '2px solid var(--accent)', maxWidth: '40cqw' }}>
          <p style={{ fontSize: '1.2cqw', lineHeight: 1.6, opacity: 0.85, margin: 0 }}>{e.body}</p>
        </motion.div>
      )}
    </div>
  )
}

function Synopsis({ e, d }: { e: Escena; d: DeckData }) {
  return (
    <>
      <TextColumn e={e} />
      {e.id === 'a2_rey' && <ReyLive d={d} />}
    </>
  )
}

/** Lo que decide el “rey” aparece en el proyector en tiempo real. */
function ReyLive({ d }: { d: DeckData }) {
  const { rey } = reyVsGrupos(d.decisions, d.session.scene_payload)
  return (
    <motion.div {...rise(4)} className="absolute" style={{ left: '68cqw', top: '14cqw', width: '24cqw', ...panel }}>
      <p style={{ ...kickerStyle, margin: 0 }}>El “rey” decide</p>
      {rey.map((r) => (
        <div key={r.pregunta} style={{ marginTop: '1.2cqw' }}>
          <p style={{ fontSize: '0.85cqw', opacity: 0.65, margin: 0 }}>{r.pregunta}</p>
          <p style={{ fontSize: '1.1cqw', margin: '0.2cqw 0 0', color: r.eleccion ? 'var(--accent)' : undefined, opacity: r.eleccion ? 1 : 0.4 }}>{r.eleccion ?? 'Esperando…'}</p>
        </div>
      ))}
    </motion.div>
  )
}

type CardT = NonNullable<Escena['cards']>[number]
function CardView({ c, i, big }: { c: CardT; i: number; big: boolean }) {
  return (
    <motion.figure {...rise(2 + i)} className="m-0 flex flex-col" style={{ flex: big ? '0 0 21cqw' : 1, minWidth: 0 }}>
      <div className="overflow-hidden" style={{ aspectRatio: '4 / 5', border: '1px solid rgba(255,255,255,.14)' }}>
        <motion.img src={img(c.img)} alt={c.name} className="h-full w-full object-cover" style={{ filter: 'saturate(.8) contrast(1.05)' }} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: EASE }} />
      </div>
      <figcaption style={{ marginTop: '0.9cqw' }}>
        <span style={{ fontSize: '0.7cqw', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.65, border: '1px solid rgba(255,255,255,.3)', padding: '0.15cqw 0.5cqw' }}>{c.tag}</span>
        <p style={{ fontSize: big ? '1.7cqw' : '1.25cqw', fontWeight: 600, textTransform: 'uppercase', margin: '0.7cqw 0 0.3cqw' }}>{c.name}</p>
        <p style={{ fontSize: big ? '1.05cqw' : '0.85cqw', lineHeight: 1.45, opacity: 0.75, margin: 0 }}>{c.line}</p>
      </figcaption>
    </motion.figure>
  )
}

/** Textos del Cordelier YA aprobados (nada pendiente llega aquí: la tabla solo expone approved). */
function PostWall({ d }: { d: DeckData }) {
  const posts = d.posts.filter((p) => p.scene === 'a3_cordelier' && p.status === 'approved').slice(-4)
  return (
    <div className="flex flex-col" style={{ width: '31cqw', gap: '1.2cqw' }}>
      <p style={{ ...kickerStyle, margin: 0 }}>Le Vieux Cordelier · textos aprobados</p>
      <AnimatePresence>
        {posts.map((p) => (
          <motion.blockquote key={p.id} initial={{ opacity: 0, y: '1cqw' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
            style={{ margin: 0, padding: '1.2cqw 1.4cqw', background: 'rgba(243,233,210,.92)', color: '#2a2118', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.45cqw', lineHeight: 1.25, fontStyle: 'italic' }}>
            “{p.body}”
            <footer style={{ fontSize: '0.75cqw', fontStyle: 'normal', fontFamily: 'Inter, sans-serif', opacity: 0.6, marginTop: '0.5cqw' }}>— un ciudadano</footer>
          </motion.blockquote>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Cards({ e, d }: { e: Escena; d: DeckData }) {
  const cards = e.cards ?? []
  if (cards.length <= 2) {
    const wall = e.id === 'a3_cordelier' && d.posts.some((p) => p.scene === 'a3_cordelier' && p.status === 'approved')
    return (
      <div className="absolute flex items-start justify-between" style={{ left: '9cqw', right: '9cqw', top: '11cqw' }}>
        <div style={{ width: '38cqw', paddingTop: '2cqw' }}>
          <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
          <div style={{ marginTop: '1.6cqw' }}><Title text={e.title} size="6cqw" /></div>
          {e.statement && <motion.p {...rise(2)} style={{ fontSize: '1.7cqw', lineHeight: 1.3, marginTop: '2cqw', opacity: 0.9 }}>{e.statement}</motion.p>}
        </div>
        {wall ? <PostWall d={d} /> : <div className="flex" style={{ gap: '2cqw' }}>{cards.map((c, i) => <CardView key={c.name} c={c} i={i} big />)}</div>}
      </div>
    )
  }
  return (
    <div className="absolute" style={{ left: '7cqw', right: '7cqw', top: '7.5cqw' }}>
      <motion.p {...rise(0)} style={kickerStyle}>{e.kicker}</motion.p>
      <div style={{ margin: '1cqw 0 2cqw' }}><Title text={e.title} size="4.2cqw" /></div>
      <div className="flex" style={{ gap: '1.4cqw' }}>{cards.map((c, i) => <CardView key={c.name} c={c} i={i} big={false} />)}</div>
    </div>
  )
}

function Bar({ label, pct, n, i }: { label: string; pct: number; n: number; i: number }) {
  return (
    <div style={{ marginTop: '1cqw' }}>
      <div className="flex justify-between" style={{ fontSize: '1cqw' }}>
        <span>{label}</span><span style={{ opacity: 0.8 }}>{pct}% <small style={{ opacity: 0.55 }}>({n})</small></span>
      </div>
      <div style={{ height: '0.5cqw', background: 'rgba(255,255,255,.12)', marginTop: '0.35cqw' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: 0.4 + i * 0.1, ease: EASE }} style={{ height: '100%', background: 'var(--accent)' }} />
      </div>
    </div>
  )
}

function Results({ e, d }: { e: Escena; d: DeckData }) {
  const r = e.resultados
  return (
    <>
      <TextColumn e={e} width="44cqw" />
      <motion.div {...rise(3)} className="absolute" style={{ left: '57cqw', top: '12cqw', width: '35cqw', ...panel }}>
        {r?.tipo === 'barras' && (
          <>
            {r.barras.map((b) => {
              const { rows, total } = contar(d.decisions, b.scene, b.prompt)
              return (
                <div key={b.scene + b.prompt} style={{ marginBottom: '1.2cqw' }}>
                  {b.titulo && <p style={{ ...kickerStyle, margin: 0 }}>{b.titulo}</p>}
                  {rows.map((x, i) => <Bar key={x.id} label={x.label} pct={x.pct} n={x.n} i={i} />)}
                  <p style={{ fontSize: '0.8cqw', opacity: 0.55, margin: '0.8cqw 0 0' }}>{total} respuestas</p>
                </div>
              )
            })}
            {r.porVariante && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: '1cqw' }}>
                <p style={{ ...kickerStyle, margin: 0 }}>Verificaron, según el panfleto</p>
                <div className="flex justify-between" style={{ marginTop: '0.8cqw', fontSize: '0.85cqw' }}>
                  {porVariante(d.decisions).map((x) => (
                    <div key={x.v} style={{ flex: 1 }}>
                      <b style={{ fontSize: '1.6cqw', color: 'var(--accent)' }}>{x.pct}%</b>
                      <p style={{ margin: 0, opacity: 0.7 }}>{{ A: 'Firma importante', B: 'Anónimo con fuente', C: 'En disputa' }[x.v]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {r?.tipo === 'rey' && <ReyResults d={d} />}
        {r?.tipo === 'debrief' && <Debrief d={d} />}
      </motion.div>
    </>
  )
}

function ReyResults({ d }: { d: DeckData }) {
  const { rey, grupos } = reyVsGrupos(d.decisions, d.session.scene_payload)
  return (
    <div className="flex" style={{ gap: '1.6cqw' }}>
      <div style={{ flex: 1 }}>
        <p style={{ ...kickerStyle, margin: 0 }}>Un solo poder</p>
        {rey.map((x) => <p key={x.pregunta} style={{ fontSize: '0.95cqw', lineHeight: 1.35, margin: '1cqw 0 0' }}>{x.eleccion ?? '—'}</p>)}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ ...kickerStyle, margin: 0 }}>Tres poderes</p>
        {grupos.map((g, i) => (
          <div key={g.grupo}>
            <p style={{ fontSize: '0.7cqw', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '1cqw 0 0' }}>{g.grupo}</p>
            {g.top ? <Bar label={g.top.label} pct={g.top.pct} n={g.top.n} i={i} /> : <p style={{ fontSize: '0.9cqw', opacity: 0.5, margin: 0 }}>—</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Debrief({ d }: { d: DeckData }) {
  const x = debrief(d.decisions, d.players)
  const cells: [number, string][] = [[x.callaron, 'callaron'], [x.criticaron, 'criticaron'], [x.citados, 'fueron citados'], [x.absueltos, 'fueron absueltos']]
  return (
    <div className="grid grid-cols-2" style={{ gap: '1.6cqw' }}>
      {cells.map(([n, label]) => (
        <div key={label}>
          <b className="font-display" style={{ fontSize: '4.4cqw', color: 'var(--accent)', lineHeight: 1 }}>{n}</b>
          <p style={{ fontSize: '0.95cqw', margin: 0, opacity: 0.8 }}>{label}</p>
        </div>
      ))}
      <p style={{ gridColumn: '1 / -1', fontSize: '0.8cqw', opacity: 0.5, margin: 0 }}>de {x.total} ciudadanos · sin nombres</p>
    </div>
  )
}

function Strip({ index, go }: { index: number; go: (i: number) => void }) {
  const items = [-2, -1, 0, 1, 2].map((dd) => ({ dd, i: index + dd })).filter(({ i }) => i >= 0 && i < ESCENAS.length)
  return (
    <div className="absolute inset-x-0 z-10 flex items-end justify-center" style={{ bottom: '2.2cqw', gap: '0.8cqw' }}>
      {items.map(({ dd, i }) => {
        const s = ESCENAS[i]
        const active = dd === 0
        return (
          <motion.button key={s.id} layout onClick={() => go(i)} className="relative cursor-pointer overflow-hidden border-0 p-0 text-left"
            style={{ width: active ? '15cqw' : '9cqw', height: active ? '6.6cqw' : '5cqw', opacity: active ? 1 : 0.5, outline: active ? '1px solid var(--accent)' : 'none' }}
            transition={{ duration: 0.7, ease: EASE }}>
            <img src={img(s.bg)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: GRADE }} />
            <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent)' }} />
            <span className="absolute" style={{ left: '0.6cqw', bottom: '0.45cqw', right: '0.4cqw', color: '#fff', fontSize: active ? '0.75cqw' : '0.6cqw', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.15 }}>{s.title}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export default function Deck({ index, go, data, demo, joinUrl, toast, offline }: DeckProps) {
  const e = ESCENAS[index]
  const p = PALETAS[e.acto]
  const activos = data.players.filter((x) => x.status === 'active').length
  const resp = respondieron(data.decisions, e.id)
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <FilterDefs />
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9', width: 'min(100vw, calc(100vh * 16 / 9))', containerType: 'size', ['--accent' as string]: p.accent, color: '#f3ece0', background: '#050505' }}>
        <AnimatePresence><Background key={e.id + '-bg'} escena={e} /></AnimatePresence>
        <Grain />
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ padding: '1.6cqw 3cqw 3.4cqw', fontSize: '0.8cqw', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'linear-gradient(to bottom, rgba(0,0,0,.72), transparent)' }}>
          <span style={{ fontWeight: 600 }}>Citoyen</span>
          <nav className="flex" style={{ gap: '2.4cqw' }}>
            {([1, 2, 3, 4, 5] as const).map((a) => (
              <span key={a} style={{ opacity: a === e.acto ? 1 : 0.4, color: a === e.acto ? 'var(--accent)' : undefined, transition: 'opacity .6s' }}>{PALETAS[a].numeral} · {PALETAS[a].name}</span>
            ))}
          </nav>
          <span style={{ border: '1px solid rgba(255,255,255,.5)', padding: '0.4cqw 1.2cqw' }}>{String(index + 1).padStart(2, '0')} / {ESCENAS.length}</span>
        </header>
        {(demo || offline) && (
          <span className="absolute z-10" style={{ left: '3cqw', top: '4.4cqw', fontSize: '0.7cqw', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#e8a73a' }}>
            {demo ? 'Datos simulados · modo sin celulares' : 'Sin conexión con la sala'}
          </span>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={e.id} className="absolute inset-0 z-10" exit={{ opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.45 }}>
            {e.layout === 'hero' && <Hero e={e} d={data} joinUrl={joinUrl} />}
            {e.layout === 'synopsis' && <Synopsis e={e} d={data} />}
            {e.layout === 'cards' && <Cards e={e} d={data} />}
            {e.layout === 'results' && <Results e={e} d={data} />}
            {e.vivo && (
              <motion.span {...rise(5)} className="absolute flex items-center" style={{ right: '3cqw', top: '4.6cqw', gap: '0.5cqw', fontSize: '0.75cqw', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85 }}>
                <i className="inline-block rounded-full" style={{ width: '0.55cqw', height: '0.55cqw', background: '#e5484d', animation: 'pulse 1.6s infinite' }} />
                {demo ? 'Responden en el celular' : `${resp}/${activos} han respondido`}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {toast && (
            <motion.div key={toast} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-30"
              style={{ left: '50%', top: '5.5cqw', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.8)', border: '1px solid var(--accent)', padding: '0.6cqw 1.6cqw', fontSize: '0.95cqw' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        <Strip index={index} go={go} />
        <div className="absolute bottom-0 left-0 z-20 h-[3px]" style={{ width: `${((index + 1) / ESCENAS.length) * 100}%`, background: 'var(--accent)', transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}
