// Prueba de carga (Fase 5): 30 clientes simulados contra el Supabase REAL, solo con la anon key.
// Uso: npm run load        (lee .env.local)
// Mide: tiempo de unirse, latencia Realtime del cambio de escena y respuestas recibidas.
// Deja datos de prueba: bórralos con el `delete` que imprime al final.
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
if (!url || !key) { console.error('Faltan variables en .env.local'); process.exit(2) }
const N = Number(process.env.N ?? 30)
const mk = () => createClient(url, key, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))]
const rpc = async (sb, fn, args) => { const r = await sb.rpc(fn, args); if (r.error) throw new Error(`${fn}: ${r.error.message}`); return r.data }

const code = 'L' + Math.random().toString(36).slice(2, 5).toUpperCase()
const secret = 'load-' + randomUUID().slice(0, 8)
const host = mk()
await rpc(host, 'create_session', { p_code: code, p_host_secret: secret })

// 1) N jugadores se unen a la vez (cada uno con su propio cliente, como un celular).
const t0 = Date.now()
const clients = await Promise.all(Array.from({ length: N }, async (_, i) => {
  const sb = mk()
  const t = Date.now()
  const r = await rpc(sb, 'join_session', { p_code: code, p_nickname: 'bot' + i, p_identity: { nombreFrances: 'Bot ' + i } })
  const row = Array.isArray(r) ? r[0] : r
  return { sb, id: row.player_id, token: row.token, joinMs: Date.now() - t }
}))
console.log(`Unirse: ${N} jugadores en ${Date.now() - t0} ms (p50 ${pct(clients.map((c) => c.joinMs), 0.5)} ms · p95 ${pct(clients.map((c) => c.joinMs), 0.95)} ms)`)

// 2) Todos se suscriben a la escena por Realtime; el host la cambia y medimos cuánto tarda en llegar.
const seen = new Map()
let sentAt = 0
let ready = 0
await Promise.all(clients.map((c) => new Promise((res) => {
  c.sb.channel('load-' + c.id.slice(0, 6))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, (p) => {
      if (p.new?.scene === 'a1_rumor' && !seen.has(c.id)) seen.set(c.id, Date.now() - sentAt)
    })
    .subscribe((s) => { if (s === 'SUBSCRIBED') { ready++; res() } })
  setTimeout(res, 15000)
})))
console.log(`Realtime: ${ready}/${N} suscritos`)
await sleep(1500) // los celulares reales se suscriben al unirse, mucho antes del primer cambio
sentAt = Date.now()
await rpc(host, 'host_set_scene', { p_code: code, p_host_secret: secret, p_scene: 'a1_rumor', p_payload: null })
// espera hasta 12 s a que lleguen todos
for (let i = 0; i < 120 && seen.size < N; i++) await sleep(100)
const lat = [...seen.values()]
console.log(`Cambio de escena recibido por ${lat.length}/${N} · p50 ${lat.length ? pct(lat, 0.5) : '—'} ms · p95 ${lat.length ? pct(lat, 0.95) : '—'} ms · máx ${lat.length ? Math.max(...lat) : '—'} ms`)

// 3) Todos responden a la vez.
const t1 = Date.now()
await Promise.all(clients.map((c, i) => rpc(c.sb, 'submit_decision', { p_player: c.id, p_token: c.token, p_scene: 'a1_rumor', p_choice: ['verificar', 'creer', 'compartir', 'denunciar'][i % 4], p_prompt_key: 'main', p_meta: { variante: 'ABC'[i % 3] } })))
const got = await host.from('decisions').select('player_id').eq('session_id', (await host.from('sessions').select('id').eq('code', code).single()).data.id)
console.log(`Respuestas: ${N} enviadas en ${Date.now() - t1} ms · ${got.data?.length}/${N} registradas`)

const ok = ready === N && lat.length === N && got.data?.length === N
console.log(`\nSala de prueba: ${code}  →  delete from public.sessions where code = '${code}';`)
console.log(ok ? 'CARGA OK' : 'CARGA CON FALLOS')
for (const c of clients) await c.sb.removeAllChannels()
process.exit(ok ? 0 : 1)
