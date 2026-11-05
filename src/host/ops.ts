// Operaciones del host: calculan con el engine (puro) y publican con RPCs protegidas por el host secret.
import { BALANCE as B } from '../content/balance.ts'
import {
  bonusDe, citadoConGarantias, citadoSinGarantias, computeState, pickArrested, pickRey, tribunalOutcome,
} from '../game/engine.ts'
import type { Fate, State } from '../game/types.ts'
import {
  hostSetFates, hostSetScene, type DecisionRow, type Payload, type PlayerRow, type PostRow, type SessionRow,
} from '../lib/api.ts'

export type HostCreds = { code: string; secret: string }
export type HostCtx = HostCreds & { session: SessionRow; players: PlayerRow[]; decisions: DecisionRow[]; posts: PostRow[] }

const activos = (c: HostCtx) => c.players.filter((p) => p.status === 'active')

/** Estado de juego de un jugador a partir de datos públicos. */
export function stateOf(c: Pick<HostCtx, 'decisions' | 'posts' | 'session'>, playerId: string): State {
  return computeState(
    c.decisions.filter((d) => d.player_id === playerId),
    {
      arrestado: c.session.scene_payload.arrestados?.includes(playerId) ?? false,
      cordelierAprobado: c.posts.some((p) => p.player_id === playerId && p.scene === 'a3_cordelier' && p.status === 'approved'),
    },
  )
}

/** Cambia de escena y prepara lo que cada escena necesita (rey, citados). */
export async function enterScene(c: HostCtx, scene: string, rerollRey = false): Promise<Payload> {
  const payload: Payload = { ...c.session.scene_payload }
  if (scene === 'a2_rey' && (rerollRey || !payload.rey_player_id)) {
    payload.rey_player_id = pickRey(activos(c).map((p) => p.id), c.session.id + ':rey:' + Date.now()) ?? undefined
  }
  if (scene === 'a3_tribunal_garantias') {
    const arr = new Set(payload.arrestados ?? [])
    payload.cited = activos(c).filter((p) => citadoConGarantias(arr.has(p.id), stateOf(c, p.id).riesgo)).map((p) => p.id)
  }
  if (scene === 'a3_tribunal_sin_garantias') {
    // condenados antes: los ya condenados no vuelven a ser citados
    payload.cited = activos(c)
      .filter((p) => citadoSinGarantias(p.fate === 'condenado', stateOf(c, p.id).riesgo, `${c.session.id}:${p.id}:${scene}:azar`))
      .map((p) => p.id)
  }
  await hostSetScene(c.code, c.secret, scene, payload)
  return payload
}

/** a3_danton: arrestos por AZAR del sistema (seed determinista), nunca por decisión de un compañero. */
export async function applyArrests(c: HostCtx): Promise<number> {
  const ids = pickArrested(activos(c).map((p) => p.id), c.session.id + ':danton', B.pArrestos)
  await hostSetFates(c.code, c.secret, ids.map((player_id) => ({ player_id, fate: 'arrestado' as Fate })))
  await hostSetScene(c.code, c.secret, c.session.scene, { ...c.session.scene_payload, arrestados: ids })
  return ids.length
}

/** Calcula y publica los destinos del tribunal de la escena actual (el host decide; los celulares solo leen). */
export async function publishFates(c: HostCtx): Promise<{ absueltos: number; condenados: number }> {
  const scene = c.session.scene
  const conGarantias = scene === 'a3_tribunal_garantias'
  if (!conGarantias && scene !== 'a3_tribunal_sin_garantias') throw new Error('Esta escena no es un tribunal')
  const cited = new Set(c.session.scene_payload.cited ?? [])
  const fates: { player_id: string; fate: Fate }[] = []
  let absueltos = 0, condenados = 0
  for (const p of activos(c)) {
    if (!cited.has(p.id)) {
      if (conGarantias && (p.fate == null || p.fate === 'arrestado')) fates.push({ player_id: p.id, fate: 'no_citado' })
      continue
    }
    const choice = c.decisions.find((d) => d.player_id === p.id && d.scene === scene)?.choice
    const { absuelto } = tribunalOutcome(`${c.session.id}:${p.id}:${scene}`, stateOf(c, p.id).riesgo, bonusDe(choice), conGarantias)
    fates.push({ player_id: p.id, fate: absuelto ? 'absuelto' : 'condenado' })
    if (absuelto) absueltos++
    else condenados++
  }
  await hostSetFates(c.code, c.secret, fates)
  const published = [...new Set([...(c.session.scene_payload.published ?? []), scene])]
  await hostSetScene(c.code, c.secret, scene, { ...c.session.scene_payload, published })
  return { absueltos, condenados }
}
