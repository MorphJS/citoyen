import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { identidadPara } from '../content/identidades.ts'
import { ESCENAS } from '../content/escenas.ts'
import { joinSession, submitDecision } from '../lib/api.ts'
import { normalizeCode } from '../lib/code.ts'
import { usePlayerData } from '../hooks/usePlayerData.ts'
import { actoColor, SceneView, type PCtx } from '../player/PlayerScenes.tsx'
import { Shell } from '../player/ui.tsx'

type Creds = { player_id: string; token: string; nickname: string }
const credKey = (code: string) => `citoyen:player:${code}`
function loadCreds(code: string): Creds | null {
  try { const r = localStorage.getItem(credKey(code)); return r ? (JSON.parse(r) as Creds) : null } catch { return null }
}

const field = 'min-h-14 w-full rounded-xl border border-white/25 bg-black/40 px-4 text-xl text-parchment outline-none focus:border-gold'
const btn = 'min-h-14 w-full rounded-xl border border-gold/60 px-6 text-xl font-medium text-parchment active:bg-gold/20 disabled:opacity-40'

function CodeEntry() {
  const [v, setV] = useState('')
  const [, setParams] = useSearchParams()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 pb-[env(safe-area-inset-bottom)]">
      <h1 className="font-serif text-5xl font-bold text-gold">Citoyen</h1>
      <p className="text-parchment/70">Escribe el código que ves en el proyector.</p>
      <input className={field + ' text-center uppercase tracking-[0.3em]'} value={v} maxLength={6} inputMode="text" autoCapitalize="characters" onChange={(e) => setV(e.target.value.toUpperCase())} />
      <button className={btn} disabled={!normalizeCode(v)} onClick={() => setParams({ code: normalizeCode(v)! })}>Continuar</button>
    </main>
  )
}

function Join({ code, onJoined }: { code: string; onJoined: (c: Creds) => void }) {
  const [nick, setNick] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function join() {
    setBusy(true); setError(null)
    try {
      const identity = identidadPara(crypto.randomUUID())
      const r = await joinSession(code, nick.trim(), identity)
      const creds = { player_id: r.player_id, token: r.token, nickname: nick.trim() }
      try { localStorage.setItem(credKey(code), JSON.stringify(creds)) } catch { /* sin almacenamiento: no podrá reconectar */ }
      onJoined(creds)
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      setError(m.includes('session_not_found') ? 'No existe una sala con ese código.' : m.includes('players_session_nick') || m.includes('duplicate') ? 'Ese apodo ya está en uso. Elige otro.' : 'No se pudo entrar. Reintenta.')
    } finally { setBusy(false) }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 pb-[env(safe-area-inset-bottom)]">
      <p className="text-sm uppercase tracking-[0.3em] text-parchment/60">Sala {code}</p>
      <h1 className="font-serif text-5xl font-bold text-gold">Citoyen</h1>
      <p className="text-parchment/70">Vas a vivir esta historia como un ciudadano francés. Elige un apodo: solo lo verá el presentador. En el proyector aparecerá tu nombre francés ficticio.</p>
      <input className={field} value={nick} maxLength={20} placeholder="Tu apodo" onChange={(e) => setNick(e.target.value)} autoComplete="off" />
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button className={btn} disabled={busy || nick.trim().length === 0} onClick={() => void join()}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </main>
  )
}

function Play({ code, creds }: { code: string; creds: Creds }) {
  const pd = usePlayerData(code, creds.player_id)
  const send = useCallback(async (key: string, choice: string, meta?: Record<string, unknown>) => {
    if (!pd.session) throw new Error('sin sesión')
    await submitDecision({ player: creds.player_id, token: creds.token, scene: pd.session.scene, choice, key, meta })
    pd.addLocalDecision({ player_id: creds.player_id, scene: pd.session.scene, prompt_key: key, choice, meta: meta ?? {} })
    void pd.refresh()
  }, [pd, creds])

  if (pd.ended) {
    try { localStorage.removeItem(credKey(code)) } catch { /* nada */ }
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="m-0 font-serif text-[40px] font-bold text-gold">Gracias por jugar</p>
        <p className="m-0 text-[18px] leading-snug text-parchment/80">La actividad terminó y el presentador borró todos los datos. Tus decisiones ya no están guardadas en ningún lugar.</p>
      </main>
    )
  }
  if (!pd.session || !pd.me) {
    return <main className="flex min-h-dvh items-center justify-center text-parchment/70">{pd.error ? 'Sin conexión… reintentando' : 'Entrando a la sala…'}</main>
  }
  if (pd.me.status === 'kicked') {
    return <main className="flex min-h-dvh items-center justify-center px-6 text-center text-xl text-parchment/80">El presentador te sacó de la sala.</main>
  }
  const scene = ESCENAS.find((s) => s.id === pd.session!.scene) ?? ESCENAS[0]
  const pal = actoColor(scene)
  const c: PCtx = { creds, session: pd.session, scene, me: pd.me, decisions: pd.decisions, posts: pd.posts, payload: pd.session.scene_payload, crowd: pd.crowd, send, refresh: pd.refresh }
  return (
    <Shell pal={pal} acto={scene.acto} name={pd.me.identity.nombreFrances} live={pd.live}>
      <motion.div key={scene.id} className="flex flex-1 flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SceneView c={c} />
      </motion.div>
    </Shell>
  )
}

export default function Jugar() {
  const [params] = useSearchParams()
  const code = normalizeCode(params.get('code'))
  const [creds, setCreds] = useState<Creds | null>(() => (code ? loadCreds(code) : null))
  if (!code) return <CodeEntry />
  if (!creds) return <Join code={code} onJoined={setCreds} />
  return <Play code={code} creds={creds} />
}
