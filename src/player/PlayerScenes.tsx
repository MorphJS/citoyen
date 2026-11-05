import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BALANCE as B } from '../content/balance.ts'
import { promptsDe, type Opcion, type Prompt } from '../content/decisiones.ts'
import { PALETAS, type Escena } from '../content/escenas.ts'
import { CIERRE_ETICO, FATE_TEXT, FINALES } from '../content/finales.ts'
import { ESTAMENTO_LABEL } from '../content/identidades.ts'
import { desenlaceA1, ecoDe, ECO_A1_MAIN, HOY, OPCIONES_TRAS, REVELA_A1, VEREDICTO_TXT } from '../content/historias.ts'
import { computeEnding, computeState, GRUPOS, grupoDe, resumenHistoria, variantePanfleto } from '../game/engine.ts'
import { submitPost, type DecisionRow, type Payload, type PlayerRow, type PostRow, type SessionRow } from '../lib/api.ts'
import { CartaVecina, Citacion, JournalClip, LeyPradial, Manifiesto, PapelesCiudadano, Panfleto, Placard } from './artifacts/documents.tsx'
import { buzz, Dock, Eco, GhostButton, Heading, Note, OptionButton, Plaza, Sheet, Waiting } from './ui.tsx'

export type PCtx = {
  creds: { player_id: string; token: string }
  session: SessionRow
  scene: Escena
  me: PlayerRow
  decisions: DecisionRow[]
  posts: PostRow[]
  payload: Payload
  crowd: { total: number; players: number; by: Record<string, number> }
  send: (key: string, choice: string, meta?: Record<string, unknown>) => Promise<void>
  refresh: () => Promise<void>
}

const decisionOf = (c: PCtx, key = 'main') => c.decisions.find((d) => d.scene === c.scene.id && d.prompt_key === key)
const wasCited = (c: PCtx) => c.payload.cited?.includes(c.me.id) ?? false
const published = (c: PCtx) => c.payload.published?.includes(c.scene.id) ?? false
const seedNum = (c: PCtx) => (c.me.identity.seed.length * 997 + c.me.identity.seed.charCodeAt(0)) % 9000 + 100

type Risky = Record<string, { title: string; text: string; confirm: string }>

/** Opciones en el dock. Las graves piden confirmación; todas responden con vibración corta. */
function Options({ c, prompt, risky, onPick }: { c: PCtx; prompt: Prompt; risky?: Risky; onPick?: (o: Opcion) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ask, setAsk] = useState<Opcion | null>(null)

  async function commit(o: Opcion) {
    setAsk(null)
    if (onPick) return onPick(o)
    setBusy(true); setErr(null)
    try { await c.send(prompt.key, o.id) } catch (e) { setErr(e instanceof Error && e.message.includes('scene_not_active') ? 'La escena cambió. Mira el proyector.' : 'No se pudo enviar. Reintenta.') } finally { setBusy(false) }
  }
  return (
    <>
      {err && <p role="alert" className="m-0 text-[16px] text-red-300">{err}</p>}
      {prompt.opciones.map((o) => (
        <OptionButton key={o.id} label={o.label} sub={o.sub} disabled={busy} danger={Boolean(risky?.[o.id])} onClick={() => (risky?.[o.id] ? setAsk(o) : void commit(o))} />
      ))}
      <Sheet open={Boolean(ask)} title={ask ? risky?.[ask.id]?.title ?? '' : ''} text={ask ? risky?.[ask.id]?.text ?? '' : ''} confirm={ask ? risky?.[ask.id]?.confirm ?? 'Confirmar' : ''} onConfirm={() => ask && void commit(ask)} onCancel={() => setAsk(null)} />
    </>
  )
}

const question = (t: string) => <p className="m-0 text-[21px] leading-snug">{t}</p>

// ------------------------------------------------------------------ Lobby
function Lobby({ c }: { c: PCtx }) {
  const id = c.me.identity
  return (
    <>
      <Heading kicker="Francia · 1750–1794" title="Tus papeles" />
      <motion.div initial={{ opacity: 0, y: 24, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9 }}>
        <PapelesCiudadano nombre={id.nombreFrances} oficio={id.oficio} ciudad={id.ciudad} estamento={ESTAMENTO_LABEL[id.estamento]} familia={id.familia} />
      </motion.div>
      <Note>Vas a decidir como esta persona. <b>No hay respuestas correctas</b>: casi todas las decisiones cuestan algo. Al final hablaremos de lo que hicimos.</Note>
      <Waiting title="Esperando al presentador" />
    </>
  )
}

// ------------------------------------------------------------------ Acto 1: el panfleto
function Rumor({ c }: { c: PCtx }) {
  const v = (['A', 'B', 'C'] as const)[variantePanfleto(c.me.identity.seed)]
  const main = decisionOf(c)
  const tras = decisionOf(c, 'tras')
  const prompts = promptsDe('a1_rumor')
  const [verifying, setVerifying] = useState(false)
  const [tick, setTick] = useState(0)
  const copias = c.crowd.by.compartir ?? 0

  useEffect(() => {
    if (!verifying) return
    const t = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [verifying])

  async function pick(o: Opcion) {
    if (o.id === 'verificar') {
      setVerifying(true)
      await new Promise((r) => setTimeout(r, B.verificarMs)) // verificar cuesta tiempo, y el panfleto sigue circulando
      setVerifying(false)
    }
    try { await c.send('main', o.id, { variante: v }) } catch { /* se verá al refrescar */ }
  }

  const sabe = main?.choice === 'verificar'
  return (
    <>
      <Heading kicker="Acto I · Tu barrio" title="Un panfleto" />
      {!main && <p className="m-0 text-[17px] leading-snug text-parchment/75">Esta mañana alguien lo dejó bajo tu puerta. Ya lo están leyendo en la fila del pan.</p>}
      <Panfleto v={v} copias={copias} />
      <p className="m-0 text-center text-[13px] italic text-parchment/50">Documento ficticio recreado con el estilo de la época. Toca y desliza para leerlo entero.</p>

      {verifying && (
        <Eco title="Caminas hasta la municipalidad…" text={`Mientras tanto, el panfleto sigue circulando: ya van ${copias + tick} copias.`} />
      )}
      {sabe && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 text-[18px] leading-snug" style={{ background: '#e9d9b4', color: '#2a1f16', fontFamily: "'IM Fell English', serif" }}>
          <p className="m-0 mb-1 text-[12px] uppercase tracking-[0.25em] opacity-70">Lo que encuentras</p>
          {REVELA_A1[v]}
        </motion.section>
      )}

      {main && !sabe && <Eco text={ECO_A1_MAIN[main.choice] ?? ''} hoy={HOY.a1_rumor} />}
      {sabe && tras && <Eco title="Tu decisión" tono={desenlaceA1(v, 'verificar', tras.choice).tono} text={desenlaceA1(v, 'verificar', tras.choice).texto} hoy={HOY.a1_rumor} />}
      {main && !sabe && <Waiting title="El rumor sigue su camino" text="Mira el proyector: pronto sabremos qué era el panfleto." />}
      {sabe && tras && <Waiting text="Mira el proyector." />}

      {!main && !verifying && (
        <Dock>
          {question('¿Qué haces?')}
          <Options c={c} prompt={prompts[0]} onPick={(o) => void pick(o)} risky={{ denunciar: { title: '¿Denunciarlo?', text: 'Llevarás el panfleto a la Guardia y señalarás al panadero Gauthier (personaje ficticio). Esto no se puede deshacer.', confirm: 'Sí, denunciar' } }} />
        </Dock>
      )}
      {sabe && !tras && (
        <Dock>
          {question('Ya sabes la verdad. ¿Qué haces con ella?')}
          <Options c={c} prompt={prompts[1]} risky={{ guardia: { title: '¿Avisar a la Guardia?', text: 'Lo que cuentes puede perjudicar a alguien. No se puede deshacer.', confirm: 'Sí, avisar' } }} />
        </Dock>
      )}
    </>
  )
}

/** Resultados del Acto 1: la verdad sobre TU panfleto y lo que provocó tu decisión. */
function VerdadA1({ c }: { c: PCtx }) {
  const v = (['A', 'B', 'C'] as const)[variantePanfleto(c.me.identity.seed)]
  const main = decisionOf(c, 'main') ?? c.decisions.find((d) => d.scene === 'a1_rumor' && d.prompt_key === 'main')
  const tras = c.decisions.find((d) => d.scene === 'a1_rumor' && d.prompt_key === 'tras')
  const r = desenlaceA1(v, main?.choice, tras?.choice)
  const t = VEREDICTO_TXT[r.verdad]
  return (
    <>
      <Heading kicker="Acto I · La verdad" title={t.titulo} />
      <Note>{t.resumen} {REVELA_A1[v]}</Note>
      <Eco title="Lo que provocó tu decisión" tono={r.tono} text={r.texto} hoy={HOY.a1_rumor} />
      <Note>Mira el proyector: <b>¿qué panfleto convenció más a la clase?</b> ¿Era el que decía la verdad?</Note>
    </>
  )
}

// ------------------------------------------------------------------ Acto 2
function Rey({ c }: { c: PCtx }) {
  const soyRey = c.payload.rey_player_id === c.me.id
  const prompts = promptsDe('a2_rey')
  if (!soyRey) return (
    <>
      <Heading kicker="Acto II · La Asamblea" title="Un solo poder" />
      <Waiting text="Otro ciudadano tiene en sus manos las tres funciones: crear la ley, aplicarla y juzgar. Mira el proyector." />
    </>
  )
  const next = prompts.find((p) => !decisionOf(c, p.key))
  const last = [...prompts].reverse().find((p) => decisionOf(c, p.key))
  const lastEco = last ? ecoDe('a2_rey', last.key, decisionOf(c, last.key)!.choice) : undefined
  return (
    <>
      <Heading kicker="Acto II · La Asamblea" title="Eres el “rey”" />
      <Note>Haces la ley, la aplicas y decides el castigo. Nadie puede decirte que no. Decide cada caso.</Note>
      {lastEco && <Eco title="Tu última decisión" text={lastEco} />}
      {next && <section className="rounded-2xl border border-gold/40 bg-white/[0.06] p-5"><p className="m-0 mb-1 text-[12px] uppercase tracking-[0.25em] text-gold/80">Caso {prompts.indexOf(next) + 1} de {prompts.length}</p><p className="m-0 text-[24px] leading-snug">{next.pregunta}</p></section>}
      {next ? (
        <Dock key={next.key} label={`Decidir el caso ${prompts.indexOf(next) + 1}`}>
          <p className="m-0 text-[12px] uppercase tracking-[0.25em] text-gold/80">Caso {prompts.indexOf(next) + 1} de {prompts.length}</p>
          {question(next.pregunta)}
          <Options c={c} prompt={next} />
        </Dock>
      ) : <Waiting title="Decidiste los tres casos" text="Mira el proyector." />}
    </>
  )
}

function Grupo({ c }: { c: PCtx }) {
  const g = grupoDe(c.me.identity.seed)
  const prompt = promptsDe('a2_contrapesos')[g]
  const done = decisionOf(c, prompt.key)
  return (
    <>
      <Heading kicker="Acto II · Contrapesos" title={`Grupo ${GRUPOS[g]}`} />
      <Note>Un panfletista critica al gobierno. Ningún grupo puede resolverlo solo: cada uno decide <b>solo su parte</b>.</Note>
      {done ? <><Eco text={ecoDe('a2_contrapesos', prompt.key, done.choice) ?? ''} /><Waiting text="Mira el proyector: veremos qué decidieron los tres grupos juntos." /></> : (
        <Dock>{question(prompt.pregunta)}<Options c={c} prompt={prompt} /></Dock>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Acto 3: el Terror
function Decreto({ c }: { c: PCtx }) {
  const done = decisionOf(c)
  const by = c.crowd.by
  const prompt = promptsDe('a3_decreto')[0]
  return (
    <>
      <Heading kicker="Acto III · Tu sección" title="Un aviso" />
      <p className="m-0 text-[17px] leading-snug text-parchment/75">Esta mañana lo pegaron en la puerta de la sección. Los vecinos se juntan a leerlo. Todos se miran.</p>
      <Placard />
      <p className="m-0 text-center text-[13px] italic text-parchment/50">Decreto ficticio, basado en el clima del Terror (1793–1794).</p>
      <Plaza total={c.crowd.total} items={[{ label: 'Aplauden', n: by.aplaudir ?? 0 }, { label: 'Callan', n: by.callar ?? 0 }, { label: 'Critican', n: by.criticar ?? 0 }]} />
      {done ? (
        <>
          <Eco text={ecoDe('a3_decreto', 'main', done.choice) ?? ''} hoy={HOY.a3_decreto} />
          <Waiting text="Mira el proyector." />
        </>
      ) : (
        <Dock>
          {question('Todos esperan tu reacción.')}
          <Options c={c} prompt={prompt} risky={{ criticar: { title: '¿Hablar en voz alta?', text: 'Hay vecinos mirando. En tiempos así, quien habla puede ser señalado.', confirm: 'Sí, criticar' } }} />
        </Dock>
      )}
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
      <p className="m-0 text-[17px] leading-snug text-parchment/75">Camille Desmoulins criticó los excesos del Terror y pidió clemencia en su periódico. ¿Te atreves a escribir algo así? Saldría impreso, sin tu nombre. Antes pasa por moderación.</p>
      <JournalClip text={done?.choice === 'escribir' ? text : text} />
      {done ? (
        <>
          <Eco text={done.choice === 'escribir' ? (approved ? 'Tu texto fue aprobado y aparece en el proyector.' : 'Enviado a moderación. Si se aprueba, aparecerá sin tu nombre.') : (ecoDe('a3_cordelier', 'main', 'no_escribir') ?? '')} hoy={HOY.a3_cordelier} />
          <Waiting text="Mira el proyector." />
        </>
      ) : writing ? (
        <>
          <label className="block">
            <span className="mb-1 block text-[13px] uppercase tracking-[0.2em] text-parchment/60">Tu texto · {text.length}/{B.maxPost}</span>
            <textarea className="min-h-32 w-full rounded-2xl border border-white/25 bg-black/50 p-4 text-[18px] leading-snug text-parchment outline-none focus:border-gold" style={{ fontSize: 18 }} maxLength={B.maxPost} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe en 140 caracteres…" autoFocus />
          </label>
          {err && <p role="alert" className="m-0 text-red-300">{err}</p>}
          <Dock always>
            <OptionButton label="Enviar a moderación" sub="Lo verá el presentador antes que nadie" disabled={busy || text.trim().length === 0} onClick={() => void publish()} />
            <GhostButton onClick={() => setWriting(false)}>Volver</GhostButton>
          </Dock>
        </>
      ) : (
        <Dock label="Decidir">
          {question('¿Pides clemencia por escrito?')}
          <OptionButton label="Escribir" sub={`Máx. ${B.maxPost} caracteres, con moderación`} onClick={() => setWriting(true)} />
          <OptionButton label="No escribir" onClick={() => void c.send('main', 'no_escribir')} />
        </Dock>
      )}
    </>
  )
}

function Danton({ c }: { c: PCtx }) {
  const id = c.me.identity
  const arrestado = c.payload.arrestados?.includes(c.me.id) || c.me.fate === 'arrestado'
  const done = decisionOf(c)
  const prompt = promptsDe('a3_danton')[0]
  if (arrestado) {
    return (
      <>
        <Heading kicker="Acto III · Abril de 1794" title="Detenido" />
        <Citacion nombre={id.nombreFrances} oficio={id.oficio} ciudad={id.ciudad} titulo="Orden de detención" numero={seedNum(c)}
          texto="queda detenido y será llevado ante el Tribunal Revolucionario." nota="Esta detención la decidió el AZAR del juego. No fue decisión de nadie de tu clase." />
        <Note>Desmoulins y Danton fueron ejecutados en abril de 1794, antes del Gran Terror. Su caso muestra que la persecución también alcanzaba a participantes de la propia Revolución.</Note>
        <Waiting title="Espera" text="Mira el proyector." />
      </>
    )
  }
  return (
    <>
      <Heading kicker="Acto III · Abril de 1794" title="Un vecino" />
      <Note>Esta vez no fuiste alcanzado. Pero <b>Duval</b>, impresor y vecino tuyo <i>(personaje ficticio)</i>, fue arrestado esta mañana. Lo conoces desde hace años. Los demás vecinos miran al suelo.</Note>
      {done ? (
        <>
          <Eco text={ecoDe('a3_danton', 'main', done.choice) ?? ''} hoy={HOY.a3_danton} />
          <Waiting text="Mira el proyector." />
        </>
      ) : (
        <Dock>
          {question(prompt.pregunta)}
          <Options c={c} prompt={prompt} risky={{ abogar: { title: '¿Hablar por Duval?', text: 'Pedir un juicio justo te hará visible. Puede costarte caro.', confirm: 'Sí, hablar' } }} />
        </Dock>
      )}
    </>
  )
}

function Tribunal({ c, garantias }: { c: PCtx; garantias: boolean }) {
  const id = c.me.identity
  const cited = wasCited(c)
  const prompt = promptsDe(c.scene.id)[0]
  const done = decisionOf(c)
  return (
    <>
      <Heading kicker="Acto III · Tribunal Revolucionario" title={garantias ? 'El tribunal' : 'Sin defensa'} />
      {!cited ? (
        <Waiting title="No fuiste citado" text="Observa el proyector." />
      ) : (
        <>
          <Citacion nombre={id.nombreFrances} oficio={id.oficio} ciudad={id.ciudad} titulo="Citación" numero={seedNum(c) + (garantias ? 0 : 1)}
            texto={garantias ? 'comparecerá ante el Tribunal Revolucionario para responder por su conducta.' : 'comparecerá de nuevo ante el Tribunal Revolucionario. Ya no hay defensa posible.'}
            nota="Citado por tu conducta en el juego o por el azar del sistema: nunca por decisión de un compañero." />
          {published(c) ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-0 rounded-2xl border border-white/15 bg-white/[0.06] p-6 text-center font-serif text-[32px] leading-tight">{FATE_TEXT[c.me.fate ?? 'no_citado']}</motion.p>
          ) : done ? (
            <><Eco text={ecoDe(c.scene.id, 'main', done.choice) ?? ''} /><Waiting title="Esperando la sentencia" /></>
          ) : (
            <Dock>{question(prompt.pregunta)}<Options c={c} prompt={prompt} /></Dock>
          )}
        </>
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
    buzz(200)
    const t = setTimeout(() => setDone(true), 1500 * opts.length + 1400)
    return () => clearTimeout(t)
  }, [cited, opts.length])
  return (
    <>
      <Heading kicker="10 de junio de 1794" title="Cambia la ley" />
      <LeyPradial />
      {cited ? (
        <Dock always>
          {opts.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.2 + i * 1.5, duration: 1.2 }}>
              <OptionButton label={o.label} onClick={() => {}} disabled />
            </motion.div>
          ))}
          {done && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-0 rounded-2xl border border-white/15 bg-white/[0.06] p-5 text-center font-serif text-[26px]">Esperar la sentencia</motion.p>}
        </Dock>
      ) : <Waiting title="No estás citado" text="Observa el proyector." />}
    </>
  )
}

// ------------------------------------------------------------------ Acto 4: la nación
function Narrativa({ c, intro, doc, risky }: { c: PCtx; intro: string; doc?: ReactNode; risky?: Risky }) {
  const prompt = promptsDe(c.scene.id)[0]
  const done = decisionOf(c)
  return (
    <>
      <Heading kicker={c.scene.kicker} title={c.scene.title} />
      <p className="m-0 text-[17px] leading-snug text-parchment/75">{intro}</p>
      {doc}
      {done ? (
        <>
          <Eco text={ecoDe(c.scene.id, 'main', done.choice) ?? ''} hoy={HOY[c.scene.id]} />
          <Waiting text="Mira el proyector." />
        </>
      ) : (
        <Dock>{question(prompt.pregunta)}<Options c={c} prompt={prompt} risky={risky} /></Dock>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Resúmenes y Acto 5
function Resumen({ c }: { c: PCtx }) {
  const historia = resumenHistoria(c.decisions, c.me.fate, c.payload.rey_player_id === c.me.id)
  const vec = c.decisions.find((d) => d.scene === 'a4_vecino')
  const a4 = c.scene.id === 'a4_resultados'
  return (
    <>
      <Heading kicker={c.scene.kicker} title={c.scene.title} />
      <section className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
        <p className="m-0 mb-2 text-[12px] uppercase tracking-[0.25em] text-parchment/55">Tu recorrido</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[18px] leading-snug">
          {historia.length === 0 ? <li className="text-parchment/60">Aún no tomaste decisiones registradas.</li> : historia.map((h) => <li key={h}>· {h}</li>)}
        </ul>
      </section>
      {a4 && vec && <Eco text={ecoDe('a4_vecino', 'main', vec.choice) ?? ''} hoy={HOY.a4_vecino} />}
      <Note>Mira el proyector y <b>habla con tus compañeros</b>: ¿por qué decidiste lo que decidiste?</Note>
    </>
  )
}

function Lente({ c }: { c: PCtx }) {
  const kant = c.scene.id === 'a5_kant'
  const historia = resumenHistoria(c.decisions, c.me.fate, c.payload.rey_player_id === c.me.id)
  const prompt = promptsDe(c.scene.id)[0]
  const done = decisionOf(c)
  return (
    <>
      <Heading kicker={kant ? 'Acto V · Primera lente' : 'Acto V · Segunda lente'} title={kant ? 'Kant' : 'Bentham y Mill'} />
      <section className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
        <p className="m-0 mb-2 text-[12px] uppercase tracking-[0.25em] text-parchment/55">Tu historia</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[17px] leading-snug">{historia.map((h) => <li key={h}>· {h}</li>)}</ul>
      </section>
      <p className="m-0 text-[18px] leading-snug text-parchment/85">
        {kant
          ? '¿Actuaste según un principio que aceptarías para todos? ¿Trataste a alguien solo como instrumento? Como devolver una cartera porque es lo correcto, no por la recompensa.'
          : '¿Qué consecuencias produjeron tus decisiones para el bienestar general? Como elegir dónde construir un servicio de agua potable: ¿qué reduce más el sufrimiento?'}
      </p>
      {done ? <><Eco text={ecoDe(c.scene.id, 'main', done.choice) ?? ''} /><Waiting text="Mira el proyector." /></> : (
        <Dock>{question(prompt.pregunta)}<Options c={c} prompt={prompt} /></Dock>
      )}
    </>
  )
}

function Final({ c }: { c: PCtx }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const state = computeState(c.decisions, { arrestado: c.payload.arrestados?.includes(c.me.id), cordelierAprobado: c.posts.some((p) => p.scene === 'a3_cordelier') })
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
        <p className="m-0 text-[12px] uppercase tracking-[0.3em] text-gold/80">Citoyen · Francia 1750–1794</p>
        <p className="m-0 mt-4 font-serif text-[32px] font-bold leading-tight text-parchment">{id.nombreFrances}</p>
        <p className="m-0 capitalize text-gold">{id.oficio} · {id.ciudad}</p>
        <p className="m-0 mt-5 text-[50px] leading-none text-gold" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>{f.titulo}</p>
        <p className="m-0 mt-3 text-[17px] leading-snug text-parchment/85">{f.texto}</p>
        <ul className="m-0 mt-4 flex list-none flex-col gap-1 p-0 text-[15px] text-parchment/75">{historia.map((h) => <li key={h}>· {h}</li>)}</ul>
        <p className="m-0 mt-5 border-t border-gold/30 pt-3 font-serif text-[18px] italic text-parchment/90">“{CIERRE_ETICO}”</p>
      </div>
      <Dock always>
        <OptionButton label={busy ? 'Generando…' : 'Descargar tarjeta (PNG)'} disabled={busy} onClick={() => void download()} />
      </Dock>
    </>
  )
}

function Mira({ c }: { c: PCtx }) {
  const fate = c.scene.id === 'a3_caida' && c.me.fate && c.me.fate !== 'arrestado' ? FATE_TEXT[c.me.fate] : undefined
  return (
    <>
      <Heading kicker={c.scene.kicker} title={c.scene.title} />
      {fate ? <p className="m-0 rounded-2xl border border-white/15 bg-white/[0.06] p-5 text-center font-serif text-[26px]">{fate}</p> : null}
      <Waiting />
    </>
  )
}

export function SceneView({ c }: { c: PCtx }): ReactNode {
  switch (c.scene.jug ?? 'mira') {
    case 'lobby': return <Lobby c={c} />
    case 'prompt':
      switch (c.scene.id) {
        case 'a1_rumor': return <Rumor c={c} />
        case 'a3_decreto': return <Decreto c={c} />
        case 'a4_fiesta': return <Narrativa c={c} intro="Tu pueblo celebra su lengua y su cultura: música, versos, comida. Hace años que no veías a tantos vecinos juntos." />
        case 'a4_union': return <Narrativa c={c} intro="Esta noche reparten un papel en la plaza. Habla de unir en un solo Estado a todos los que hablan vuestra lengua." doc={<Manifiesto />} />
        case 'a4_vecino': return <Narrativa c={c} intro="Llega una carta del pueblo vecino, que habla vuestro mismo idioma. Tu pueblo está decidido a unirse… y ellos no." doc={<CartaVecina />} risky={{ presionar: { title: '¿Presionar al pueblo vecino?', text: 'Cerrarás el camino del mercado a sus carros hasta que cedan. Tendrá consecuencias para ambos pueblos.', confirm: 'Sí, presionar' } }} />
        default: return <Mira c={c} />
      }
    case 'rey': return <Rey c={c} />
    case 'grupo': return <Grupo c={c} />
    case 'cordelier': return <Cordelier c={c} />
    case 'danton': return <Danton c={c} />
    case 'tribunal1': return <Tribunal c={c} garantias />
    case 'pradial': return <Pradial c={c} />
    case 'tribunal2': return <Tribunal c={c} garantias={false} />
    case 'verdad': return <VerdadA1 c={c} />
    case 'resumen': return <Resumen c={c} />
    case 'lente': return <Lente c={c} />
    case 'final': return <Final c={c} />
    default: return <Mira c={c} />
  }
}

export function actoColor(scene: Escena | undefined) {
  return PALETAS[scene?.acto ?? 0]
}
export { OPCIONES_TRAS }
