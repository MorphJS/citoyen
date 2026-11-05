// Capa fina sobre Supabase: SOLO RPCs para escribir y selects públicos para leer (DATA_MODEL.sql).
import type { Identidad } from '../content/identidades.ts'
import type { Fate } from '../game/types.ts'
import { supabase } from './supabase.ts'

export type Payload = {
  rey_player_id?: string
  arrestados?: string[] // ids arrestados por el sistema (azar) en a3_danton
  cited?: string[] // ids citados en el tribunal de la escena actual
  published?: string[] // escenas cuyos destinos ya se publicaron
}
export type SessionRow = { id: string; code: string; scene: string; scene_started_at: string; scene_payload: Payload; status: string }
export type PlayerRow = { id: string; session_id: string; nickname: string; identity: Identidad; status: 'active' | 'kicked'; fate: Fate | null }
export type DecisionRow = { player_id: string; scene: string; prompt_key: string; choice: string; meta: Record<string, unknown> }
export type PostRow = { id: string; player_id: string; scene: string; body: string; status: 'pending' | 'approved' | 'rejected'; created_at: string }

// El borde con Supabase no está tipado (sin generar tipos): se castea aquí y solo aquí.
function check<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function getSessionByCode(code: string): Promise<SessionRow | null> {
  const res = await supabase.from('sessions').select('*').eq('code', code).maybeSingle()
  return check<SessionRow | null>(res)
}
export async function listPlayers(sessionId: string): Promise<PlayerRow[]> {
  return check<PlayerRow[]>(await supabase.from('players').select('*').eq('session_id', sessionId).order('created_at'))
}
export async function listDecisions(sessionId: string): Promise<DecisionRow[]> {
  return check<DecisionRow[]>(await supabase.from('decisions').select('player_id,scene,prompt_key,choice,meta').eq('session_id', sessionId).limit(5000))
}
export async function listApprovedPosts(sessionId: string): Promise<PostRow[]> {
  return check<PostRow[]>(await supabase.from('posts').select('id,player_id,scene,body,status,created_at').eq('session_id', sessionId).order('created_at'))
}
export async function myDecisions(playerId: string): Promise<DecisionRow[]> {
  return check<DecisionRow[]>(await supabase.from('decisions').select('player_id,scene,prompt_key,choice,meta').eq('player_id', playerId))
}
export async function getPlayer(playerId: string): Promise<PlayerRow | null> {
  return check<PlayerRow | null>(await supabase.from('players').select('*').eq('id', playerId).maybeSingle())
}
export async function myApprovedPosts(playerId: string): Promise<PostRow[]> {
  return check<PostRow[]>(await supabase.from('posts').select('id,player_id,scene,body,status,created_at').eq('player_id', playerId))
}

// ---- Host ----
export async function createSession(code: string, secret: string): Promise<void> {
  check(await supabase.rpc('create_session', { p_code: code, p_host_secret: secret }))
}
export async function hostSetScene(code: string, secret: string, scene: string, payload: Payload | null): Promise<void> {
  check(await supabase.rpc('host_set_scene', { p_code: code, p_host_secret: secret, p_scene: scene, p_payload: payload }))
}
export async function hostSetFates(code: string, secret: string, fates: { player_id: string; fate: Fate }[]): Promise<void> {
  if (fates.length === 0) return
  check(await supabase.rpc('host_set_fates', { p_code: code, p_host_secret: secret, p_fates: fates }))
}
export async function hostListPending(code: string, secret: string): Promise<PostRow[]> {
  return check<PostRow[]>(await supabase.rpc('host_list_pending_posts', { p_code: code, p_host_secret: secret }))
}
export async function hostModerate(code: string, secret: string, post: string, status: 'approved' | 'rejected'): Promise<void> {
  check(await supabase.rpc('host_moderate_post', { p_code: code, p_host_secret: secret, p_post: post, p_status: status }))
}
export async function hostKick(code: string, secret: string, player: string): Promise<void> {
  check(await supabase.rpc('host_kick_player', { p_code: code, p_host_secret: secret, p_player: player }))
}

// ---- Jugador ----
export async function joinSession(code: string, nickname: string, identity: Identidad): Promise<{ player_id: string; token: string }> {
  const data = check<{ player_id: string; token: string }[] | { player_id: string; token: string }>(
    await supabase.rpc('join_session', { p_code: code, p_nickname: nickname, p_identity: identity }),
  )
  return Array.isArray(data) ? data[0] : data
}
export async function submitDecision(p: { player: string; token: string; scene: string; choice: string; key?: string; meta?: Record<string, unknown> }): Promise<void> {
  check(await supabase.rpc('submit_decision', { p_player: p.player, p_token: p.token, p_scene: p.scene, p_choice: p.choice, p_prompt_key: p.key ?? 'main', p_meta: p.meta ?? {} }))
}
export async function submitPost(player: string, token: string, scene: string, body: string): Promise<void> {
  check(await supabase.rpc('submit_post', { p_player: player, p_token: token, p_scene: scene, p_body: body }))
}

/** Suscripción Realtime: cualquier cambio en estas tablas dispara `onChange` (los datos se vuelven a leer). */
export function subscribeTables(name: string, tables: string[], onChange: () => void, onStatus?: (ok: boolean) => void) {
  let ch = supabase.channel(name)
  for (const t of tables) ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, onChange)
  ch.subscribe((status: string) => onStatus?.(status === 'SUBSCRIBED'))
  return () => { void supabase.removeChannel(ch) }
}
