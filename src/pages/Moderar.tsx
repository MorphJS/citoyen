import { useCallback, useEffect, useState } from 'react'
import { ESCENAS } from '../content/escenas.ts'
import { applyArrests, enterScene, publishFates, type HostCreds, type HostCtx } from '../host/ops.ts'
import { useHostData } from '../hooks/useHostData.ts'
import { hostKick, hostListPending, hostModerate, type PostRow } from '../lib/api.ts'
import { loadCreds, saveCreds } from '../lib/hostCreds.ts'
import { normalizeCode } from '../lib/code.ts'

const field = 'min-h-12 w-full rounded-lg border border-white/25 bg-black/40 px-4 text-lg text-parchment outline-none focus:border-gold'
const btn = 'min-h-12 rounded-lg border border-gold/60 px-4 text-base font-medium text-parchment transition hover:bg-gold/10 disabled:opacity-40'
const card = 'rounded-xl border border-white/15 bg-white/5 p-4'

function Login({ onReady }: { onReady: (c: HostCreds) => void }) {
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  async function go() {
    const c = normalizeCode(code)
    if (!c) return setError('Código inválido')
    try { await hostListPending(c, secret); onReady({ code: c, secret }) } catch { setError('Código o contraseña incorrectos') }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="font-serif text-4xl text-gold">Moderación y mando</h1>
      <p className="text-parchment/70">Ábrelo en otra pestaña o en tu celular: los textos sin aprobar nunca deben verse en el proyector.</p>
      <input className={field + ' uppercase tracking-widest'} placeholder="Código de sala" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
      <input className={field} type="password" placeholder="Contraseña de host" value={secret} onChange={(e) => setSecret(e.target.value)} />
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button className={btn} onClick={() => void go()}>Entrar</button>
    </main>
  )
}

function Panel({ creds }: { creds: HostCreds }) {
  const data = useHostData(creds.code)
  const [pending, setPending] = useState<PostRow[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let alive = true
    const tick = async () => { try { const p = await hostListPending(creds.code, creds.secret); if (alive) setPending(p) } catch { /* reintenta */ } }
    void tick()
    const t = setInterval(() => void tick(), 2000) // sondeo cada 2 s (ROADMAP Fase 3)
    return () => { alive = false; clearInterval(t) }
  }, [creds])

  const ctx = useCallback((): HostCtx | null => (data.session ? { ...creds, session: data.session, players: data.players, decisions: data.decisions, posts: data.posts } : null), [creds, data])
  const run = useCallback(async (label: string, fn: (c: HostCtx) => Promise<string | void>) => {
    const c = ctx(); if (!c) return
    try { setMsg((await fn(c)) || label); await data.refresh() } catch (e) { setMsg('Error: ' + (e instanceof Error ? e.message : '')) }
  }, [ctx, data])

  const s = data.session
  const idx = Math.max(0, ESCENAS.findIndex((e) => e.id === s?.scene))
  const moderate = async (id: string, st: 'approved' | 'rejected') => {
    try { await hostModerate(creds.code, creds.secret, id, st); setPending((p) => p.filter((x) => x.id !== id)); setMsg(st === 'approved' ? 'Aprobado' : 'Rechazado') } catch { setMsg('Error al moderar') }
  }
  const nickOf = (id: string) => data.players.find((p) => p.id === id)?.nickname ?? '?'

  if (!s) return <main className="p-6 text-parchment/70">Conectando…</main>
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-gold">Sala {creds.code}</h1>
        <span className="text-sm text-parchment/60">{data.live ? '● en vivo' : '○ sondeo'} · {data.players.filter((p) => p.status === 'active').length} jugadores</span>
      </header>
      {msg && <p className="rounded-lg bg-white/10 px-3 py-2 text-sm" role="status">{msg}</p>}

      <section className={card}>
        <h2 className="mb-2 text-sm uppercase tracking-widest text-parchment/60">Escena {idx + 1}/{ESCENAS.length}</h2>
        <p className="mb-3 text-lg">{ESCENAS[idx].title}</p>
        <div className="flex gap-3">
          <button className={btn + ' flex-1'} disabled={idx === 0} onClick={() => void run('', async (c) => { await enterScene(c, ESCENAS[idx - 1].id) })}>← Anterior</button>
          <button className={btn + ' flex-1'} disabled={idx >= ESCENAS.length - 1} onClick={() => void run('', async (c) => { await enterScene(c, ESCENAS[idx + 1].id) })}>Siguiente →</button>
        </div>
        <select className={field + ' mt-3'} value={idx} onChange={(e) => void run('', async (c) => { await enterScene(c, ESCENAS[Number(e.target.value)].id) })}>
          {ESCENAS.map((e, i) => <option key={e.id} value={i}>{String(i + 1).padStart(2, '0')} · {e.title}</option>)}
        </select>
      </section>

      <section className={card}>
        <h2 className="mb-2 text-sm uppercase tracking-widest text-parchment/60">Acciones del Terror</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button className={btn} disabled={s.scene !== 'a3_danton'} onClick={() => void run('', async (c) => `Arrestos por azar del sistema: ${await applyArrests(c)}`)}>Arrestos (A)</button>
          <button className={btn} disabled={!s.scene.startsWith('a3_tribunal')} onClick={() => void run('', async (c) => { const r = await publishFates(c); return `Destinos publicados · absueltos ${r.absueltos} · condenados ${r.condenados}` })}>Destinos (F)</button>
          <button className={btn} disabled={s.scene !== 'a2_rey'} onClick={() => void run('Nuevo “rey”', async (c) => { await enterScene(c, 'a2_rey', true) })}>Re-sortear rey (R)</button>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-2 text-sm uppercase tracking-widest text-parchment/60">Textos pendientes ({pending.length})</h2>
        {pending.length === 0 && <p className="text-parchment/50">Nada por moderar.</p>}
        <ul className="flex flex-col gap-3">
          {pending.map((p) => (
            <li key={p.id} className="rounded-lg border border-white/15 p-3">
              <p className="text-lg">“{p.body}”</p>
              <p className="mb-2 text-xs text-parchment/50">de {nickOf(p.player_id)}</p>
              <div className="flex gap-3">
                <button className={btn + ' flex-1'} onClick={() => void moderate(p.id, 'approved')}>Aprobar</button>
                <button className={btn + ' flex-1'} onClick={() => void moderate(p.id, 'rejected')}>Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-2 text-sm uppercase tracking-widest text-parchment/60">Jugadores</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.players.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
              <span className={p.status === 'kicked' ? 'text-parchment/40 line-through' : ''}>{p.nickname} <small className="text-parchment/50">· {p.identity.nombreFrances}</small></span>
              {p.status === 'active' && <button className="min-h-10 px-2 text-sm text-red-300 underline" onClick={() => void run('Expulsado', async () => { await hostKick(creds.code, creds.secret, p.id) })}>Expulsar</button>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default function Moderar() {
  const [creds, setCreds] = useState<HostCreds | null>(loadCreds)
  return creds ? <Panel creds={creds} /> : <Login onReady={(c) => { saveCreds(c); setCreds(c) }} />
}
