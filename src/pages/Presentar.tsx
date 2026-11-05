import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ESCENAS, img } from '../content/escenas.ts'
import Deck from '../host/Deck.tsx'
import MobileDeck from '../host/MobileDeck.tsx'
import { useNarrow } from '../hooks/useNarrow.ts'
import { makeDemo } from '../host/demo.ts'
import { applyArrests, enterScene, publishFates, type HostCreds, type HostCtx } from '../host/ops.ts'
import { useHostData } from '../hooks/useHostData.ts'
import { createSession, hostListPending } from '../lib/api.ts'
import { clearCreds, joinUrlFor, loadCreds, randomCode, saveCreds } from '../lib/hostCreds.ts'
import { normalizeCode } from '../lib/code.ts'

const field = 'min-h-12 w-full rounded-lg border border-white/25 bg-black/40 px-4 text-lg text-parchment outline-none focus:border-gold'
const btn = 'min-h-12 rounded-lg border border-gold/60 px-6 text-lg font-medium text-parchment transition hover:bg-gold/10 disabled:opacity-40'

function Gate({ onReady, onDemo }: { onReady: (c: HostCreds) => void; onDemo: () => void }) {
  const [code, setCode] = useState(randomCode)
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    setBusy(true); setError(null)
    const c = normalizeCode(code)
    if (!c) { setError('El código debe tener 4–6 letras o números.'); setBusy(false); return }
    try {
      await createSession(c, secret)
      onReady({ code: c, secret })
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      setError(m.includes('duplicate') ? 'Ese código ya existe. Si es tu sala, usa “Reanudar”.' : m.includes('too_short') ? 'La contraseña debe tener al menos 6 caracteres.' : 'No se pudo crear la sala: ' + m)
    } finally { setBusy(false) }
  }
  async function resume() {
    setBusy(true); setError(null)
    const c = normalizeCode(code)
    if (!c) { setError('Código inválido.'); setBusy(false); return }
    try {
      await hostListPending(c, secret) // verifica el secreto sin cambiar nada
      onReady({ code: c, secret })
    } catch { setError('Código o contraseña incorrectos.') } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="font-serif text-5xl font-bold text-gold">Presentar</h1>
      <p className="text-parchment/70">Crea una sala y proyecta el QR. La contraseña solo la sabes tú; sirve para controlar la presentación.</p>
      <label className="text-sm uppercase tracking-widest text-parchment/60">Código de sala
        <input className={field + ' mt-1 uppercase tracking-widest'} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </label>
      <label className="text-sm uppercase tracking-widest text-parchment/60">Contraseña de host
        <input className={field + ' mt-1'} type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="mínimo 6 caracteres" />
      </label>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <div className="flex gap-3">
        <button className={btn + ' flex-1'} disabled={busy || secret.length < 6} onClick={() => void create()}>Crear sala</button>
        <button className={btn + ' flex-1'} disabled={busy || secret.length < 6} onClick={() => void resume()}>Reanudar</button>
      </div>
      <button className="min-h-12 text-parchment/60 underline" onClick={onDemo}>Modo sin celulares (datos simulados)</button>
    </main>
  )
}

function Live({ creds, demo, onExit }: { creds: HostCreds | null; demo: boolean; onExit: () => void }) {
  const [params, setParams] = useSearchParams()
  const real = useHostData(demo ? null : creds?.code ?? null)
  const demoData = useMemo(() => (demo ? makeDemo() : null), [demo])
  const [toast, setToast] = useState<string | null>(null)
  const [localIdx, setLocalIdx] = useState<number | null>(null)
  const working = useRef(false)
  const [debate, setDebate] = useState(false)
  const narrow = useNarrow()

  const data = demoData ?? { session: real.session, players: real.players, decisions: real.decisions, posts: real.posts }
  const sessionIdx = demo
    ? Math.max(0, ESCENAS.findIndex((s) => s.id === params.get('s')))
    : Math.max(0, ESCENAS.findIndex((s) => s.id === real.session?.scene))
  const index = !demo && localIdx !== null ? localIdx : sessionIdx

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast((t) => (t === m ? null : t)), 3200) }, [])
  const ctx = useCallback((): HostCtx | null => (!demo && creds && real.session ? { ...creds, session: real.session, players: real.players, decisions: real.decisions, posts: real.posts } : null), [demo, creds, real.session, real.players, real.decisions, real.posts])

  useEffect(() => { if (localIdx !== null && localIdx === sessionIdx) setLocalIdx(null) }, [localIdx, sessionIdx])

  const go = useCallback(async (i: number) => {
    const j = Math.max(0, Math.min(ESCENAS.length - 1, i))
    setDebate(false)
    if (demo) { setParams({ s: ESCENAS[j].id }, { replace: true }); return }
    const c = ctx()
    if (!c || working.current) return
    working.current = true
    setLocalIdx(j)
    try { await enterScene(c, ESCENAS[j].id); await real.refresh() } catch (e) { setLocalIdx(null); say('Error: ' + (e instanceof Error ? e.message : '')) } finally { working.current = false }
  }, [demo, ctx, real, say, setParams])

  const doAction = useCallback(async (kind: 'arrestos' | 'destinos' | 'rey') => {
    const scene = ESCENAS[index].id
    if (demo) { say('Modo simulado: los resultados ya están calculados'); return }
    const c = ctx()
    if (!c) return
    try {
      if (kind === 'arrestos' && scene === 'a3_danton') say(`Arrestos por azar del sistema: ${await applyArrests(c)}`)
      else if (kind === 'destinos' && (scene === 'a3_tribunal_garantias' || scene === 'a3_tribunal_sin_garantias')) {
        const r = await publishFates(c); say(`Destinos publicados · absueltos ${r.absueltos} · condenados ${r.condenados}`)
      } else if (kind === 'rey' && scene === 'a2_rey') { await enterScene(c, 'a2_rey', true); say('Nuevo “rey” sorteado') }
      else say('Esa acción no aplica a esta escena')
      await real.refresh()
    } catch (e) { say('Error: ' + (e instanceof Error ? e.message : '')) }
  }, [index, demo, ctx, real, say])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).tagName === 'INPUT') return
      const k = ev.key.toLowerCase()
      if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); void go(index + 1) }
      else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') void go(index - 1)
      else if (k === 'd') setDebate((x) => !x)
      else if (k === 'a') void doAction('arrestos')
      else if (k === 'f') void doAction('destinos')
      else if (k === 'r') void doAction('rey')
      else if (k === 'm' || k === 'k') window.open(location.pathname + '#/moderar', '_blank')
      else if (k === 'p') {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, doAction, index])

  // Precarga la imagen de la siguiente escena: el cambio es instantáneo.
  useEffect(() => { const n = ESCENAS[index + 1]; if (n) new Image().src = img(n.bg) }, [index])

  if (!demo && !real.session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl text-parchment/80">{real.error ? 'Sin conexión con la sala…' : 'Conectando con la sala…'}</p>
        <button className="text-parchment/60 underline" onClick={onExit}>Volver</button>
      </main>
    )
  }
  const session = data.session!
  const Stage = narrow ? MobileDeck : Deck
  return (
    <Stage
      onAction={(k: 'arrestos' | 'destinos' | 'rey') => void doAction(k)} onToggleDebate={() => setDebate((x) => !x)}
      index={index} go={(i) => void go(i)} demo={demo} toast={toast} debate={debate}
      offline={!demo && !!real.error}
      joinUrl={demo ? undefined : joinUrlFor(session.code)}
      data={{ session, players: data.players, decisions: data.decisions, posts: data.posts }}
    />
  )
}

export default function Presentar() {
  const [params] = useSearchParams()
  const [creds, setCreds] = useState<HostCreds | null>(loadCreds)
  const [demo, setDemo] = useState(params.get('demo') === '1')

  if (!creds && !demo) {
    return <Gate onReady={(c) => { saveCreds(c); setCreds(c) }} onDemo={() => setDemo(true)} />
  }
  return <Live creds={creds} demo={demo} onExit={() => { clearCreds(); setCreds(null); setDemo(false) }} />
}
