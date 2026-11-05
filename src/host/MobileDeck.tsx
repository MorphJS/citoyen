// Vista del presentador para CELULAR (vertical): mismas escenas, pero con tipografía en px, desplazamiento vertical,
// gestos de deslizar y botones para las acciones que en el proyector son atajos de teclado (A, F, R, D).
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, type ReactNode } from 'react'
import { ESCENAS, PALETAS, img, type Escena } from '../content/escenas.ts'
import { DEBATE, VERDAD_A1, VEREDICTO_TXT } from '../content/historias.ts'
import type { DeckProps } from './Deck.tsx'
import { contar, debrief, porVariante, respondieron, reyVsGrupos } from './stats.ts'

const EASE = [0.22, 1, 0.36, 1] as const
const serif = "'Cormorant Garamond', Georgia, serif"
const kicker = 'text-[12px] uppercase tracking-[0.26em] opacity-80'
const card = 'rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-sm'

const fade = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.1 + i * 0.1, ease: EASE } })

function Bar({ label, pct, n }: { label: string; pct: number; n: number }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[15px]"><span>{label}</span><span className="opacity-80">{pct}% <small className="opacity-55">({n})</small></span></div>
      <div className="mt-1 h-2 rounded bg-white/12"><motion.div className="h-full rounded" style={{ background: 'var(--accent)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: EASE }} /></div>
    </div>
  )
}

function Results({ e, d }: { e: Escena; d: DeckProps['data'] }) {
  const r = e.resultados
  if (!r) return null
  if (r.tipo === 'barras') {
    return (
      <div className={card}>
        {r.barras.map((b) => {
          const { rows, total } = contar(d.decisions, b.scene, b.prompt)
          return (
            <div key={b.scene + b.prompt} className="mb-4">
              {b.titulo && <p className={kicker + ' m-0'}>{b.titulo}</p>}
              {rows.map((x) => <Bar key={x.id} label={x.label} pct={x.pct} n={x.n} />)}
              <p className="m-0 mt-2 text-[13px] opacity-55">{total} respuestas</p>
            </div>
          )
        })}
        {r.porVariante && (
          <div className="border-t border-white/15 pt-3">
            <p className={kicker + ' m-0'}>Verificaron, según el panfleto</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[13px]">
              {porVariante(d.decisions).map((x) => (
                <div key={x.v}>
                  <b className="text-[26px]" style={{ color: 'var(--accent)' }}>{x.pct}%</b>
                  <p className="m-0 opacity-70">{{ A: 'Firma importante', B: 'Anónimo con fuente', C: 'En disputa' }[x.v]}</p>
                  <p className="m-0 mt-1 text-[11px] uppercase tracking-wider" style={{ color: VERDAD_A1[x.v] === 'cierto' ? '#8fd19e' : VERDAD_A1[x.v] === 'falso' ? '#e98a7e' : '#e8c26a' }}>{VEREDICTO_TXT[VERDAD_A1[x.v]].titulo.replace('El panfleto ', '')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  if (r.tipo === 'debrief') {
    const x = debrief(d.decisions, d.players)
    const cells: [number, string][] = [[x.callaron, 'callaron'], [x.criticaron, 'criticaron'], [x.citados, 'fueron citados'], [x.absueltos, 'fueron absueltos']]
    return (
      <div className={card + ' grid grid-cols-2 gap-4'}>
        {cells.map(([n, l]) => <div key={l}><b className="font-display text-[56px] leading-none" style={{ color: 'var(--accent)' }}>{n}</b><p className="m-0 text-[15px] opacity-80">{l}</p></div>)}
        <p className="col-span-2 m-0 text-[13px] opacity-50">de {x.total} ciudadanos · sin nombres</p>
      </div>
    )
  }
  const { rey, grupos } = reyVsGrupos(d.decisions, d.session.scene_payload)
  return (
    <div className={card}>
      <p className={kicker + ' m-0'}>Un solo poder</p>
      {rey.map((x) => <p key={x.pregunta} className="m-0 mt-2 text-[15px]">{x.eleccion ?? '—'}</p>)}
      <p className={kicker + ' m-0 mt-5'}>Tres poderes</p>
      {grupos.map((g) => (
        <div key={g.grupo}>
          <p className="m-0 mt-3 text-[11px] uppercase tracking-widest opacity-55">{g.grupo}</p>
          {g.top ? <Bar label={g.top.label} pct={g.top.pct} n={g.top.n} /> : <p className="m-0 opacity-50">—</p>}
        </div>
      ))}
    </div>
  )
}

function ReyLive({ d }: { d: DeckProps['data'] }) {
  const { rey } = reyVsGrupos(d.decisions, d.session.scene_payload)
  return (
    <div className={card}>
      <p className={kicker + ' m-0'}>El “rey” decide</p>
      {rey.map((r) => (
        <div key={r.pregunta} className="mt-3">
          <p className="m-0 text-[13px] opacity-65">{r.pregunta}</p>
          <p className="m-0 text-[17px]" style={{ color: r.eleccion ? 'var(--accent)' : undefined, opacity: r.eleccion ? 1 : 0.4 }}>{r.eleccion ?? 'Esperando…'}</p>
        </div>
      ))}
    </div>
  )
}

function Content({ e, d, joinUrl, demo }: { e: Escena; d: DeckProps['data']; joinUrl?: string; demo: boolean }) {
  const activos = d.players.filter((p) => p.status === 'active')
  const cards = e.cards ?? []
  const wall = e.id === 'a3_cordelier' ? d.posts.filter((p) => p.scene === 'a3_cordelier' && p.status === 'approved').slice(-4) : []
  return (
    <div className="flex flex-col gap-5">
      <motion.p {...fade(0)} className={kicker + ' m-0'}>{e.kicker}</motion.p>
      {e.fecha && <motion.div {...fade(1)} className="font-display leading-[0.9]" style={{ fontSize: 'clamp(72px, 24vw, 120px)', color: 'var(--accent)' }}>{e.fecha.grande}{e.fecha.chica && <span className="mt-1 block text-[14px] uppercase tracking-[0.35em] text-white/85" style={{ fontFamily: 'Inter, sans-serif' }}>{e.fecha.chica}</span>}</motion.div>}
      <motion.h1 {...fade(1)} className="font-display m-0 leading-[0.94]" style={{ fontSize: e.id === 'lobby' ? 'clamp(64px, 22vw, 110px)' : 'clamp(40px, 12.5vw, 64px)', color: 'var(--accent)' }}>{e.title}</motion.h1>

      {e.id === 'lobby' && (
        <motion.div {...fade(2)} className={card + ' flex flex-col items-center gap-2 text-center'}>
          {joinUrl ? (
            <>
              <div className="rounded-lg bg-white p-3" style={{ lineHeight: 0 }}><QRCodeSVG value={joinUrl} size={200} level="M" /></div>
              <p className="m-0 mt-1 text-[12px] tracking-[0.3em] opacity-70">CÓDIGO</p>
              <p className="font-display m-0 text-[48px] tracking-[0.18em]" style={{ color: 'var(--accent)' }}>{d.session.code}</p>
            </>
          ) : <p className="m-0 text-[16px] opacity-85">Modo sin celulares. Los resultados que verás son simulados.</p>}
          <p className="m-0 text-[17px]"><b className="text-[26px]" style={{ color: 'var(--accent)' }}>{activos.length}</b> ciudadanos</p>
        </motion.div>
      )}

      {e.statement && <motion.p {...fade(2)} className="m-0 leading-snug" style={e.layout === 'quote' ? { fontFamily: serif, fontStyle: 'italic', fontSize: 28 } : { fontSize: e.statement.length > 110 ? 18 : 22, fontWeight: 600, textTransform: 'uppercase' }}>{e.layout === 'quote' ? `“${e.statement}”` : e.statement}</motion.p>}
      {e.body && <motion.p {...fade(3)} className="m-0 border-l-2 pl-3 text-[16px] leading-relaxed opacity-85" style={{ borderColor: 'var(--accent)' }}>{e.body}</motion.p>}
      {e.palabra && <motion.p {...fade(3)} className="font-display m-0 text-[64px] leading-none" style={{ color: 'transparent', WebkitTextStroke: '1.5px var(--accent)' }}>{e.palabra}</motion.p>}
      {e.seals && <motion.div {...fade(3)} className="flex flex-wrap gap-2">{e.seals.map((s) => <span key={s} className="rounded-full border px-3 py-1 text-[12px] uppercase tracking-widest" style={{ borderColor: 'var(--accent)' }}>{s}</span>)}</motion.div>}

      {cards.length > 0 && wall.length === 0 && (
        <motion.div {...fade(3)} className={cards.length === 1 ? 'mx-auto w-[72%]' : 'grid grid-cols-2 gap-3'}>
          {cards.map((c) => (
            <figure key={c.name} className="m-0">
              <img src={img(c.img)} alt={c.name} className="aspect-[4/5] w-full rounded-lg border border-white/15 object-cover" loading="lazy" />
              <figcaption className="mt-2"><p className="m-0 text-[15px] font-semibold uppercase">{c.name}</p><p className="m-0 mt-0.5 text-[13px] leading-snug opacity-70">{c.line}</p></figcaption>
            </figure>
          ))}
        </motion.div>
      )}

      {wall.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className={kicker + ' m-0'}>Textos aprobados · sin nombre</p>
          {wall.map((p) => <blockquote key={p.id} className="m-0 rounded-lg p-4 text-[18px] italic leading-snug" style={{ background: 'rgba(243,233,210,.93)', color: '#2a2118', fontFamily: serif }}>“{p.body}”</blockquote>)}
        </div>
      )}

      {e.hitos && (
        <ol className="m-0 list-none border-l-2 p-0 pl-5" style={{ borderColor: 'var(--accent)' }}>
          {e.hitos.map((h) => (
            <li key={h.fecha} className="relative pb-5">
              <i className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full" style={{ background: 'var(--accent)' }} />
              <p className="font-display m-0 text-[28px] leading-none" style={{ color: 'var(--accent)' }}>{h.fecha}</p>
              <p className="m-0 mt-1 text-[15px] leading-snug opacity-85">{h.texto}</p>
            </li>
          ))}
        </ol>
      )}

      {e.columnas && (
        <div className="flex flex-col gap-3">
          {e.columnas.map((c) => (
            <div key={c.titulo} className="flex items-center gap-4 border-t pt-3" style={{ borderColor: 'var(--accent)' }}>
              <span className="font-display text-[54px] leading-none" style={{ color: 'var(--accent)' }}>{c.num}</span>
              <div><p className="m-0 text-[18px] font-semibold uppercase">{c.titulo}</p><p className="m-0 text-[15px] opacity-75">{c.texto}</p></div>
            </div>
          ))}
        </div>
      )}

      {e.id === 'a2_rey' && <ReyLive d={d} />}
      {e.layout === 'results' && <Results e={e} d={d} />}
      {demo && e.vivo && <p className="m-0 text-[12px] uppercase tracking-widest opacity-70">Resultados simulados</p>}
    </div>
  )
}

export default function MobileDeck({ index, go, data, demo, joinUrl, toast, offline, debate, endSlot, onAction, onToggleDebate }: DeckProps & { onAction?: (k: 'arrestos' | 'destinos' | 'rey') => void; onToggleDebate?: () => void }) {
  const e = ESCENAS[index]
  const p = PALETAS[e.acto]
  const [fx, fy] = e.foco ?? [50, 50]
  const activos = data.players.filter((x) => x.status === 'active').length
  const resp = respondieron(data.decisions, e.id)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const questions = DEBATE[e.id]
  const action: { k: 'arrestos' | 'destinos' | 'rey'; label: string } | null =
    e.id === 'a3_danton' ? { k: 'arrestos', label: 'Arrestar por azar' }
      : e.id.startsWith('a3_tribunal') ? { k: 'destinos', label: 'Publicar destinos' }
        : e.id === 'a2_rey' ? { k: 'rey', label: 'Re-sortear al “rey”' } : null

  return (
    <div
      className="fixed inset-0 flex flex-col text-[#f3ece0]"
      style={{ ['--accent' as string]: p.accent, background: '#050505', paddingTop: 'env(safe-area-inset-top)' }}
      onTouchStart={(ev) => { touch.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY } }}
      onTouchEnd={(ev) => {
        const s = touch.current; touch.current = null
        if (!s) return
        const dx = ev.changedTouches[0].clientX - s.x, dy = ev.changedTouches[0].clientY - s.y
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(index + (dx < 0 ? 1 : -1))
      }}
    >
      {/* fondo */}
      <AnimatePresence>
        <motion.div key={e.id + 'bg'} className="absolute inset-0 -z-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
          <img src={img(e.bg)} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${fx}% ${fy}%`, filter: 'saturate(.55) contrast(1.1) brightness(.42)' }} />
          <div className="absolute inset-0 mix-blend-color" style={{ background: p.tint, opacity: 0.55 }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.2) 35%, rgba(0,0,0,.85))' }} />
        </motion.div>
      </AnimatePresence>

      {/* cabecera */}
      <header className="relative z-10 flex items-center justify-between px-4 pb-2 pt-3 text-[11px] uppercase tracking-[0.2em]">
        <span className="font-semibold">Citoyen</span>
        <span style={{ color: 'var(--accent)' }}>{PALETAS[e.acto].numeral} · {PALETAS[e.acto].name}</span>
        <span className="rounded border border-white/40 px-2 py-0.5">{String(index + 1).padStart(2, '0')}/{ESCENAS.length}</span>
      </header>
      <div className="relative z-10 mx-4 h-[3px] rounded bg-white/15"><div className="h-full rounded transition-all duration-700" style={{ width: `${((index + 1) / ESCENAS.length) * 100}%`, background: 'var(--accent)' }} /></div>
      {(demo || offline) && <p className="relative z-10 m-0 px-4 pt-2 text-[11px] uppercase tracking-widest text-[#e8a73a]">{demo ? 'Datos simulados · modo sin celulares' : 'Sin conexión con la sala'}</p>}

      {/* contenido desplazable */}
      <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5">
        <AnimatePresence mode="wait">
          <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Content e={e} d={data} joinUrl={joinUrl} demo={demo} />
            {e.vivo && !demo && <p className="mb-0 mt-5 flex items-center gap-2 text-[12px] uppercase tracking-widest opacity-85"><i className="inline-block h-2 w-2 rounded-full bg-[#e5484d]" />{resp}/{activos} han respondido</p>}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* debate */}
      <AnimatePresence>
        {debate && questions && (
          <motion.aside initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-3 z-30 rounded-2xl border p-4" style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))', background: 'rgba(8,6,4,.98)', borderColor: 'var(--accent)' }}>
            <p className={kicker + ' m-0 mb-2'} style={{ color: 'var(--accent)' }}>Para debatir</p>
            {questions.map((q) => <p key={q} className="m-0 mb-2 text-[19px] leading-snug" style={{ fontFamily: serif }}>• {q}</p>)}
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div key={toast} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-4 top-14 z-40 rounded-xl border bg-black/90 px-4 py-2 text-center text-[14px]" style={{ borderColor: 'var(--accent)' }}>{toast}</motion.div>}
      </AnimatePresence>

      {endSlot && index === ESCENAS.length - 1 && <div className="absolute right-1 z-30" style={{ bottom: 'calc(118px + env(safe-area-inset-bottom))' }}>{endSlot}</div>}

      {/* barra de mando */}
      <nav className="relative z-20 border-t border-white/15 bg-black/85 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {(action || questions) && (
          <div className="mb-2 flex gap-2">
            {action && <button onClick={() => onAction?.(action.k)} className="min-h-[48px] flex-1 rounded-xl border px-3 text-[15px] font-semibold" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>{action.label}</button>}
            {questions && <button onClick={() => onToggleDebate?.()} className="min-h-[48px] flex-1 rounded-xl border border-white/30 px-3 text-[15px]">{debate ? 'Cerrar debate' : 'Preguntas para debatir'}</button>}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Escena anterior" className="min-h-[52px] w-[72px] rounded-xl border border-white/30 text-[22px] disabled:opacity-30">←</button>
          <p className="m-0 min-w-0 flex-1 truncate px-2 text-center text-[14px] opacity-80">{e.title}</p>
          <button onClick={() => go(index + 1)} disabled={index >= ESCENAS.length - 1} aria-label="Escena siguiente" className="min-h-[52px] w-[112px] rounded-xl text-[18px] font-semibold text-[#1a1208] disabled:opacity-30" style={{ background: 'var(--accent)' }}>Siguiente →</button>
        </div>
      </nav>
    </div>
  )
}

export type { ReactNode }
