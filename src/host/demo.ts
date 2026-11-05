// Modo sin celulares (Fase 5): datos SIMULADOS para que cada escena del host funcione sola si falla el wifi.
// Se rotula siempre como "datos simulados" en pantalla. Nada de esto toca la base de datos.
import { promptsDe } from '../content/decisiones.ts'
import { identidadPara } from '../content/identidades.ts'
import { pickArrested, tribunalOutcome, grupoDe, variantePanfleto, computeState, bonusDe, citadoConGarantias, citadoSinGarantias } from '../game/engine.ts'
import { makeRng } from '../game/rng.ts'
import type { DecisionRow, Payload, PlayerRow, PostRow, SessionRow } from '../lib/api.ts'
import type { Fate } from '../game/types.ts'

export type DemoData = { session: SessionRow; players: PlayerRow[]; decisions: DecisionRow[]; posts: PostRow[] }

const PESOS: Record<string, number[]> = {
  a1_rumor: [3, 4, 2, 1], a3_decreto: [4, 4, 2], a3_cordelier: [2, 8], a4_union: [3, 4, 3], a4_vecino: [4, 1, 5],
  a3_tribunal_garantias: [4, 2, 1], a4_fiesta: [1, 1, 1], a5_kant: [6, 4], a5_mill: [5, 5],
}

function weighted(rnd: () => number, w: number[]): number {
  const total = w.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i }
  return w.length - 1
}

const POSTS_DEMO = [
  'Piedad, ciudadanos: la libertad no se defiende con miedo.',
  'Pedir cuentas no es traicionar a la República.',
  'Quien calla por temor también pierde su voz.',
]

export function makeDemo(n = 28): DemoData {
  const sid = 'demo-session'
  const rnd = makeRng('demo')
  const players: PlayerRow[] = Array.from({ length: n }, (_, i) => ({
    id: 'demo-' + i, session_id: sid, nickname: 'demo' + i, identity: identidadPara('demo-seed-' + i), status: 'active', fate: null,
  }))
  const decisions: DecisionRow[] = []
  const add = (player_id: string, scene: string, prompt_key: string, choice: string, meta: Record<string, unknown> = {}) =>
    decisions.push({ player_id, scene, prompt_key, choice, meta })

  const rey = players[Math.floor(rnd() * n)].id
  for (const p of players) {
    const seed = p.identity.seed
    for (const scene of ['a1_rumor', 'a3_decreto', 'a3_cordelier', 'a4_fiesta', 'a4_union', 'a4_vecino', 'a5_kant', 'a5_mill']) {
      const pr = promptsDe(scene)[0]
      const o = pr.opciones[weighted(rnd, PESOS[scene] ?? pr.opciones.map(() => 1))]
      add(p.id, scene, 'main', o.id, scene === 'a1_rumor' ? { variante: 'ABC'[variantePanfleto(seed)] } : {})
    }
    const g = grupoDe(seed)
    const gp = promptsDe('a2_contrapesos')[g]
    add(p.id, 'a2_contrapesos', gp.key, gp.opciones[weighted(rnd, [1, 5, 4])].id)
  }
  for (const pr of promptsDe('a2_rey')) add(rey, 'a2_rey', pr.key, pr.opciones[1].id)

  const posts: PostRow[] = POSTS_DEMO.map((body, i) => ({
    id: 'demo-post-' + i, player_id: players[i].id, scene: 'a3_cordelier', body, status: 'approved', created_at: new Date().toISOString(),
  }))

  // Terror: arrestos al azar, citaciones y destinos con el mismo engine que el juego real.
  const arrestados = pickArrested(players.map((p) => p.id), sid + ':danton')
  const stateOf = (id: string, arrestado: boolean) =>
    computeState(decisions.filter((d) => d.player_id === id), { arrestado, cordelierAprobado: posts.some((x) => x.player_id === id) })
  const cited1: string[] = []
  const cited2: string[] = []
  const fates = new Map<string, Fate>()
  for (const p of players) {
    const arr = arrestados.includes(p.id)
    const st = stateOf(p.id, arr)
    if (citadoConGarantias(arr, st.riesgo)) {
      cited1.push(p.id)
      const choice = decisions.find((d) => d.player_id === p.id && d.scene === 'a3_tribunal_garantias')?.choice
      fates.set(p.id, tribunalOutcome(`${sid}:${p.id}:a3_tribunal_garantias`, st.riesgo, bonusDe(choice), true).absuelto ? 'absuelto' : 'condenado')
    } else fates.set(p.id, 'no_citado')
  }
  for (const p of players) {
    const st = stateOf(p.id, arrestados.includes(p.id))
    if (citadoSinGarantias(fates.get(p.id) === 'condenado', st.riesgo, `${sid}:${p.id}:a3_tribunal_sin_garantias:azar`)) {
      cited2.push(p.id)
      fates.set(p.id, tribunalOutcome(`${sid}:${p.id}:a3_tribunal_sin_garantias`, st.riesgo, 0, false).absuelto ? 'absuelto' : 'condenado')
    }
  }
  for (const p of players) p.fate = fates.get(p.id) ?? 'no_citado'

  const payload: Payload = { rey_player_id: rey, arrestados, cited: cited1, published: ['a3_tribunal_garantias', 'a3_tribunal_sin_garantias'] }
  const session: SessionRow = { id: sid, code: 'DEMO', scene: 'lobby', scene_started_at: new Date().toISOString(), scene_payload: { ...payload, cited: cited2 }, status: 'open' }
  return { session, players, decisions, posts }
}
