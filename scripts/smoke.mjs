// Humo de seguridad contra Supabase REAL, usando solo la anon key (igual que un celular).
// Equivale a docs/SMOKE_TEST.sql pero pasando por PostgREST, que es el camino que usará la app.
// Uso: npm run smoke   (lee .env.local)
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(2)
}
const sb = createClient(url, key, { auth: { persistSession: false } })

const results = []
function check(name, pass, detail = '') {
  results.push(pass)
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}
const fails = (res) => res.error != null
const rpc = (fn, args) => sb.rpc(fn, args)

const code = 'Z' + Math.random().toString(36).slice(2, 5).toUpperCase() // 4 chars, A-Z0-9
const secret = 'secreto-' + randomUUID().slice(0, 8)

// 1
let r = await rpc('create_session', { p_code: code, p_host_secret: secret })
check('1  crear sesión', !fails(r), r.error?.message)
// 2
r = await rpc('create_session', { p_code: 'ZZ' + code.slice(1, 3), p_host_secret: 'abc' })
check('2  secreto corto falla', fails(r), r.error?.message)
// 3
r = await rpc('join_session', { p_code: code, p_nickname: 'Morph', p_identity: { nombre: 'Jean' } })
const joined = Array.isArray(r.data) ? r.data[0] : r.data
check('3  unirse devuelve player_id + token', !fails(r) && joined?.player_id && joined?.token, r.error?.message)
const { player_id, token } = joined ?? {}
// 4
r = await rpc('submit_decision', { p_player: player_id, p_token: token, p_scene: 'a1_rumor', p_choice: 'verificar' })
check('4  decisión en escena NO activa falla', fails(r), r.error?.message)
// 5
r = await rpc('host_set_scene', { p_code: code, p_host_secret: 'malo', p_scene: 'a1_rumor' })
check('5  host con secreto malo falla', fails(r), r.error?.message)
// 6
r = await rpc('host_set_scene', { p_code: code, p_host_secret: secret, p_scene: 'a1_rumor' })
check('6  host cambia escena con secreto correcto', !fails(r), r.error?.message)
// 7
await rpc('submit_decision', { p_player: player_id, p_token: token, p_scene: 'a1_rumor', p_choice: 'verificar' })
r = await rpc('submit_decision', { p_player: player_id, p_token: token, p_scene: 'a1_rumor', p_choice: 'creer' })
const dec = await sb.from('decisions').select('choice').eq('player_id', player_id)
check('7  decisión duplicada: sin error y 1 sola fila (la primera)', !fails(r) && dec.data?.length === 1 && dec.data[0].choice === 'verificar')
// 8
r = await rpc('submit_decision', { p_player: player_id, p_token: randomUUID(), p_scene: 'a1_rumor', p_choice: 'x', p_prompt_key: 'k2' })
check('8  token falso falla', fails(r), r.error?.message)
// 9
for (const t of ['host_secrets', 'player_secrets']) {
  const s = await sb.from(t).select('*')
  check(`9  anon no lee ${t}`, fails(s) || (s.data?.length ?? 0) === 0, s.error?.message ?? `${s.data?.length} filas`)
}
// 10
r = await sb.from('decisions').insert({ session_id: randomUUID(), player_id: randomUUID(), scene: 'x', choice: 'y' })
check('10 insert directo falla', fails(r), r.error?.message)
// 11
await rpc('host_set_scene', { p_code: code, p_host_secret: secret, p_scene: 'a3_cordelier' })
await rpc('submit_post', { p_player: player_id, p_token: token, p_scene: 'a3_cordelier', p_body: 'Piedad, ciudadanos' })
const before = await sb.from('posts').select('id')
const pend = await rpc('host_list_pending_posts', { p_code: code, p_host_secret: secret })
const postId = pend.data?.[0]?.id
await rpc('host_moderate_post', { p_code: code, p_host_secret: secret, p_post: postId, p_status: 'approved' })
const after = await sb.from('posts').select('id')
check('11 post pendiente invisible → aprobado visible', before.data?.length === 0 && after.data?.length === 1, `${before.data?.length} → ${after.data?.length}`)
// 12
r = await rpc('host_set_fates', { p_code: code, p_host_secret: secret, p_fates: [{ player_id, fate: 'absuelto' }] })
const pl = await sb.from('players').select('fate').eq('id', player_id)
check('12 host fija destinos', !fails(r) && pl.data?.[0]?.fate === 'absuelto', r.error?.message)
// 13
await rpc('host_kick_player', { p_code: code, p_host_secret: secret, p_player: player_id })
r = await rpc('submit_decision', { p_player: player_id, p_token: token, p_scene: 'a3_cordelier', p_choice: 'x', p_prompt_key: 'k3' })
check('13 jugador expulsado no puede decidir', fails(r), r.error?.message)

console.log(`\nSesión de prueba: ${code}  (bórrala: delete from public.sessions where code = '${code}';)`)
const failed = results.filter((x) => !x).length
console.log(failed === 0 ? 'HUMO VERDE' : `HUMO ROJO: ${failed} fallo(s)`)
process.exit(failed === 0 ? 0 : 1)
