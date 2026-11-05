import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BALANCE as B } from '../content/balance.ts'
import { PANFLETOS, promptsDe, type Prompt } from '../content/decisiones.ts'
import { PALETAS, type Escena } from '../content/escenas.ts'
import { CIERRE_ETICO, FATE_TEXT, FINALES } from '../content/finales.ts'
import { ESTAMENTO_LABEL, type Identidad } from '../content/identidades.ts'
import { computeEnding, computeState, GRUPOS, grupoDe, resumenHistoria, variantePanfleto } from '../game/engine.ts'
import { submitPost, type DecisionRow, type Payload, type PlayerRow, type PostRow, type SessionRow } from '../lib/api.ts'

export type PCtx = {
  creds: { player_id: string; token: string }
  session: SessionRow
  scene: Escena
  me: PlayerRow
  decisions: DecisionRow[]
  posts: PostRow[]
  payload: Payload
  send: (key: string, choice: string, meta?: Record<string, unknown>) => Promise<void>
  refresh: () => Promise<void>
}

const big = 'min-h-16 w-full rounded-xl border border-gold/50 bg-white/5 px-5 text-left text-lg font-medium text-parchment active:bg-gold/20 disabled:opacity-40'
const box = 'rounded-xl border border-white/15 bg-white/5 p-5'

function Heading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <header className="mb-5">
      {kicker && <p className="mb-1 text-xs uppercase tracking-[0.3em] text-parchment/60">{kicker}</p>}
      <h2 className="font-display text-5xl leading-none text-gold" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>{title}</h2>
    </header>
  )
}

function Waiting({ title = 'Mira el proyector', text }: { title?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <motion.span className="h-3 w-3 rounded-full bg-gold" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      <p className="font-serif text-3xl text-gold">{title}</p>
      {text && <p className="max-w-xs text-parchment/70">{text}</p>}
    </div>
  )
}

const decisionOf = (c: PCtx, key = 'main') => c.decisions.find((d) => d.scene === c.scene.id && d.prompt_key === key)
const wasCited = (c: PCtx) => c.payload.cited?.includes(c.me.id) ?? false
const published = (c: PCtx) => c.payload.published?.includes(c.scene.id) ?? false

function Sent({ text = 'Respuesta enviada. Mira el proyector.' }: { text?: string }) {
  return <p role="status" className={box + ' text-center text-parchment/80'}>✓ {text}</p>
}

function Choices({ c, prompt, onPick, disabled }: { c: PCtx; prompt: Prompt; onPick?: (id: string) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const done = decisionOf(c, prompt.key)
  if (done) return <Sent />
  return (
    <div className="flex flex-col gap-3">
      <p className="mb-1 text-xl leading-snug">{prompt.pregunta}</p>
      {prompt.opciones.map((o) => (
        <button key={o.id} className={big} disabled={busy || disabled}
          onClick={async () => {
            if (onPick) return onPick(o.id)
            setBusy(true); setErr(null)
            try { await c.send(prompt.key, o.id) } catch (e) { setErr(e instanceof Error && e.message.includes('scene_not_active') ? 'La escena cambió. Mira el proyector.' : 'No se pudo enviar. Reintenta.') } finally { setBusy(false) }
          }}>
          {o.label}{o.sub && <span className="block text-sm font-normal text-parchment/60">{o.sub}</span>}
        </button>
      ))}
      {err && <p role="alert" className="text-red-300">{err}</p>}
    </div>
  )
}

function Lobby({ c }: { c: PCtx }) {
  const id = c.me.identity
  return (
    <>
      <Heading kicker="Francia · 1750–1794" title="Tu identidad" />
      <IdentityCard id={id} />
      <p className="mt-5 text-center text-parchment/70">Todo es ficticio. Espera a que empiece la historia.</p>
    </>
  )
}

export function IdentityCard({ id }: { id: Identidad }) {
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-gold/60 bg-gradient-to-b from-[#2a2012] to-[#120d07] p-6 shadow-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{ESTAMENTO_LABEL[id.estamento]} · {id.ciudad}</p>
      <p className="mt-3 font-serif text-4xl font-bold text-parchment">{id.nombreFrances}</p>
      <p className="mt-1 text-xl capitalize text-gold">{id.oficio}</p>
      <p className="mt-4 text-parchment/75">{id.familia}</p>
    </motion.div>
  )
}

function Rumor({ c }: { c: PCtx }) {
  const v = variantePanfleto(c.me.identity.seed)
  const pan = PANFLETOS[v]
  const prompt = promptsDe('a1_rumor')[0]
  const [verifying, setVerifying] = useState(false)
  const done = decisionOf(c)
  async function pick(id: string) {
    if (id === 'verificar') {
      setVerifying(true)
      await new Promise((r) => setTimeout(r, B.verificarMs)) // verificar cuesta tiempo
      setVerifying(false)
    }
    try { await c.send('main', id, { variante: pan.id }) } catch { /* se mostrará al refrescar */ }
  }
  return (
    <>
      <Heading kicker="Acto I · El salón" title="Un panfleto" />
      <article className="mb-5 rounded-lg bg-[#f3e9d2] p-5 font-serif text-[#2a2118]">
        <p className="text-xs uppercase tracking-widest opacity-60">{pan.titulo}</p>
        <p className="mt-2 text-2xl leading-snug">“{pan.texto}”</p>
        <p className="mt-3 text-sm italic opacity-70">{pan.firma}. {pan.pista}</p>
      </article>
      {verifying ? (
        <div className={box + ' text-center'} role="status">
          <motion.div className="mx-auto mb-3 h-1 rounded bg-gold" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: B.verificarMs / 1000, ease: 'linear' }} />
          <p>Verificando la fuente…</p>
        </div>
      ) : done ? <Sent /> : <Choices c={c} prompt={prompt} onPick={(id) => void pick(id)} />}
    </>
  )
}

function Rey({ c }: { c: PCtx }) {
  const soyRey = c.payload.rey_player_id === c.me.id
  const prompts = promptsDe('a2_rey')
  if (!soyRey) return <><Heading kicker="Acto II · La Asamblea" title="Un solo poder" /><Waiting text="Otro ciudadano tiene en sus manos las tres funciones: crear la ley, aplicarla y juzgar." /></>
  const next = prompts.find((p) => !decisionOf(c, p.key))
  return (
    <>
      <Heading kicker="Acto II · La Asamblea" title="Eres el “rey”" />
      <p className="mb-4 text-parchment/70">Tú haces la ley, la aplicas y decides el castigo. Decide cada caso.</p>
      {next ? <Choices key={next.key} c={c} prompt={next} /> : <Sent text="Decidiste los tres casos. Mira el proyector." />}
    </>
  )
}

function Grupo({ c }: { c: PCtx }) {
  const g = grupoDe(c.me.identity.seed)
  const prompt = promptsDe('a2_contrapesos')[g]
  return (
    <>
      <Heading kicker="Acto II · Contrapesos" title={`Grupo ${GRUPOS[g]}`} />
      <p className="mb-4 text-parchment/70">Cada grupo decide solo una parte. Ninguno puede hacerlo todo.</p>
      <Choices c={c} prompt={prompt} />
    </>
  )
}

function Cordelier({ c }: { c: PCtx }) {
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const done = decisionOf(c)
  const approved = c.posts.some((p) => p.scene === 'a3_cordelier')
  async function publish() {
    setBusy(true); setErr(null)
    try {
      await submitPost(c.creds.player_id, c.creds.token, c.scene.id, text.trim())
      await c.send('main', 'escribir')
    } catch { setErr('No se pudo enviar. Reintenta.') } finally { setBusy(false) }
  }
  return (
    <>
      <Heading kicker="Acto III · Le Vieux Cordelier" title="Pedir clemencia" />
      <p className="mb-4 text-parchment/70">Camille Desmoulins criticó los excesos del Terror y pidió clemencia por escrito. Tu texto pasa por moderación antes de mostrarse.</p>
      {done ? (
        done.choice === 'escribir'
          ? <Sent text={approved ? 'Tu texto fue aprobado y aparece en el proyector.' : 'Enviado a moderación. Si se aprueba, aparecerá sin tu nombre.'} />
          : <Sent text="Decidiste no escribir." />
      ) : writing ? (
        <div className="flex flex-col gap-3">
          <textarea className="min-h-36 w-full rounded-xl border border-white/25 bg-black/40 p-4 text-lg text-parchment outline-none focus:border-gold" maxLength={B.maxPost} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe en 140 caracteres…" autoFocus />
          <p className="text-right text-sm text-parchment/50">{text.length}/{B.maxPost}</p>
          {err && <p role="alert" className="text-red-300">{err}</p>}
          <button className={big} disabled={busy || text.trim().length === 0} onClick={() => void publish()}>Enviar a moderación</button>
          <button className="min-h-12 text-parchment/60 underline" onClick={() => setWriting(false)}>Volver</button>
        </div>
      ) : (
        <Choices c={c} prompt={promptsDe('a3_cordelier')[0]} onPick={(id) => (id === 'escribir' ? setWriting(true) : void c.send('main', 'no_escribir'))} />
      )}
    </>
  )
}

function Danton({ c }: { c: PCtx }) {
  const arrestado = c.payload.arrestados?.includes(c.me.id) || c.me.fate === 'arrestado'
  return (
    <>
      <Heading kicker="Acto III · Abril de 1794" title="Arrestos" />
      <p className={box}>
        {arrestado
          ? 'El sistema te arrestó al azar. Tu caso será llevado ante el Tribunal Revolucionario. Su caso muestra que la persecución también afectaba a participantes de la propia Revolución.'
          : 'Esta vez no fuiste alcanzado. Mira el proyector: Desmoulins y Danton fueron ejecutados en abril de 1794, antes del Gran Terror.'}
      </p>
    </>
  )
}

function Tribunal({ c, garantias }: { c: PCtx; garantias: boolean }) {
  const cited = wasCited(c)
  const prompt = promptsDe(c.scene.id)[0]
  return (
    <>
      <Heading kicker="Acto III · Tribunal Revolucionario" title={garantias ? 'El tribunal' : 'Sin defensa'} />
      {!cited ? (
        <Waiting title="No fuiste citado" text="Observa el proyector." />
      ) : published(c) ? (
        <p className={box + ' text-center font-serif text-3xl'}>{FATE_TEXT[c.me.fate ?? 'no_citado']}</p>
      ) : decisionOf(c) ? (
        <Waiting title="Esperando la sentencia" />
      ) : (
        <Choices c={c} prompt={prompt} />
      )}
    </>
  )
}

/** La Ley del 22 de pradial: las opciones de defensa se desvanecen una a una. */
function Pradial({ c }: { c: PCtx }) {
  const cited = c.payload.cited?.includes(c.me.id) ?? false
  const opts = promptsDe('a3_tribunal_garantias')[0].opciones
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!cited) return
    navigator.vibrate?.(200)
    const t = setTimeout(() => setDone(true), 1500 * opts.length + 1400)
    return () => clearTimeout(t)
  }, [cited, opts.length])
  return (
    <>
      <Heading kicker="10 de junio de 1794" title="Ley del 22 de pradial" />
      <p className="mb-5 text-parchment/80">Redujo las garantías de los acusados ante el Tribunal Revolucionario y aceleró los procesos. Las sentencias podían ser la absolución o la muerte.</p>
      {cited ? (
        <div className="flex flex-col gap-3">
          {opts.map((o, i) => (
            <motion.button key={o.id} disabled className={big} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.2 + i * 1.5, duration: 1.2 }}>{o.label}</motion.button>
          ))}
          <AnimatePresence>
            {done && <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={box + ' text-center font-serif text-2xl'}>Esperar la sentencia</motion.p>}
          </AnimatePresence>
        </div>
      ) : <Waiting title="No estás citado" text="Observa el proyector." />}
    </>
  )
}

function Lente({ c }: { c: PCtx }) {
  const kant = c.scene.id === 'a5_kant'
  const historia = resumenHistoria(c.decisions, c.me.fate, c.payload.rey_player_id === c.me.id)
  return (
    <>
      <Heading kicker={kant ? 'Acto V · Primera lente' : 'Acto V · Segunda lente'} title={kant ? 'Kant' : 'Bentham y Mill'} />
      <div className={box + ' mb-4'}>
        <p className="mb-2 text-xs uppercase tracking-widest text-parchment/50">Tu historia</p>
        <ul className="flex flex-col gap-2">
          {historia.length === 0 ? <li className="text-parchment/60">Aún no tomaste decisiones registradas.</li> : historia.map((h) => <li key={h}>· {h}</li>)}
        </ul>
      </div>
      <p className="mb-2 text-parchment/80">
        {kant
          ? '¿Actuaste según un principio que aceptarías para todos? ¿Trataste a alguien solo como instrumento? Como devolver una cartera porque es lo correcto, no por la recompensa.'
          : '¿Qué consecuencias produjeron tus decisiones para el bienestar general? Como elegir dónde construir un servicio de agua potable: ¿qué reduce más el sufrimiento?'}
      </p>
      <div className="mt-4"><Choices c={c} prompt={promptsDe(c.scene.id)[0]} /></div>
    </>
  )
}

function Final({ c }: { c: PCtx }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const state = computeState(c.decisions, {
    arrestado: c.payload.arrestados?.includes(c.me.id),
    cordelierAprobado: c.posts.some((p) => p.scene === 'a3_cordelier'),
  })
  const end = computeEnding(state, c.me.fate)
  const f = FINALES[end]
  const historia = resumenHistoria(c.decisions, c.me.fate, c.payload.rey_player_id === c.me.id).slice(0, 3)
  const id = c.me.identity
  async function download() {
    if (!ref.current) return
    setBusy(true)
    try {
      const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.href = url
      a.download = `citoyen-${id.nombreFrances.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
    } finally { setBusy(false) }
  }
  return (
    <>
      <Heading kicker="Acto V · Tu final" title="Tu historia" />
      <div ref={ref} className="rounded-2xl border-2 border-gold/70 p-6" style={{ background: 'linear-gradient(160deg,#2a2012,#0d0a06)' }}>
        <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Citoyen · Francia 1750–1794</p>
        <p className="mt-4 font-serif text-3xl font-bold text-parchment">{id.nombreFrances}</p>
        <p className="text-gold capitalize">{id.oficio} · {id.ciudad}</p>
        <p className="mt-5 text-5xl leading-none text-gold" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>{f.titulo}</p>
        <p className="mt-3 text-parchment/85">{f.texto}</p>
        <ul className="mt-4 flex flex-col gap-1 text-sm text-parchment/75">{historia.map((h) => <li key={h}>· {h}</li>)}</ul>
        <p className="mt-5 border-t border-gold/30 pt-3 font-serif text-lg italic text-parchment/90">“{CIERRE_ETICO}”</p>
      </div>
      <button className={big + ' mt-5 text-center'} disabled={busy} onClick={() => void download()}>{busy ? 'Generando…' : 'Descargar tarjeta (PNG)'}</button>
    </>
  )
}

function Mira({ c }: { c: PCtx }) {
  const fate = c.scene.id === 'a3_caida' && c.me.fate && c.me.fate !== 'arrestado' ? FATE_TEXT[c.me.fate] : undefined
  return (
    <>
      <Heading kicker={c.scene.kicker} title={c.scene.title} />
      {fate ? <p className={box + ' mb-4 text-center font-serif text-2xl'}>{fate}</p> : null}
      <Waiting />
    </>
  )
}

export function SceneView({ c }: { c: PCtx }): ReactNode {
  switch (c.scene.jug ?? 'mira') {
    case 'lobby': return <Lobby c={c} />
    case 'prompt':
      if (c.scene.id === 'a1_rumor') return <Rumor c={c} />
      return (
        <>
          <Heading kicker={c.scene.kicker} title={c.scene.title} />
          {promptsDe(c.scene.id).map((p) => <Choices key={p.key} c={c} prompt={p} />)}
        </>
      )
    case 'rey': return <Rey c={c} />
    case 'grupo': return <Grupo c={c} />
    case 'cordelier': return <Cordelier c={c} />
    case 'danton': return <Danton c={c} />
    case 'tribunal1': return <Tribunal c={c} garantias />
    case 'pradial': return <Pradial c={c} />
    case 'tribunal2': return <Tribunal c={c} garantias={false} />
    case 'lente': return <Lente c={c} />
    case 'final': return <Final c={c} />
    default: return <Mira c={c} />
  }
}

export function actoColor(scene: Escena | undefined) {
  return PALETAS[scene?.acto ?? 0]
}
