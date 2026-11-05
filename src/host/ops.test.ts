import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DecisionRow, PlayerRow, SessionRow } from '../lib/api.ts'

// La base se simula: probamos la lógica del host (qué publica y a quién), no Supabase.
const calls = vi.hoisted(() => ({ fates: [] as { player_id: string; fate: string }[], scenes: [] as { scene: string; payload: Record<string, unknown> | null }[] }))
vi.mock('../lib/api.ts', () => ({
  hostSetFates: async (_c: string, _s: string, f: { player_id: string; fate: string }[]) => { calls.fates.push(...f) },
  hostSetScene: async (_c: string, _s: string, scene: string, payload: Record<string, unknown> | null) => { calls.scenes.push({ scene, payload }) },
}))

import { applyArrests, enterScene, publishFates, stateOf, type HostCtx } from './ops.ts'

const players: PlayerRow[] = Array.from({ length: 20 }, (_, i) => ({
  id: 'p' + i, session_id: 's', nickname: 'n' + i, identity: { seed: 'x' + i } as PlayerRow['identity'], status: 'active', fate: null,
}))
const d = (player_id: string, scene: string, choice: string, prompt_key = 'main'): DecisionRow => ({ player_id, scene, prompt_key, choice, meta: {} })
const session = (scene: string, payload = {}): SessionRow => ({ id: 'sess', code: 'TEST', scene, scene_started_at: '', scene_payload: payload, status: 'open' })
const ctx = (s: SessionRow, decisions: DecisionRow[] = [], ps = players): HostCtx => ({ code: 'TEST', secret: 'secreto', session: s, players: ps, decisions, posts: [] })

beforeEach(() => { calls.fates.length = 0; calls.scenes.length = 0 })

describe('ops del host', () => {
  it('arrestos: ~15 %, por azar, y se registran en el payload', async () => {
    const n = await applyArrests(ctx(session('a3_danton')))
    expect(n).toBe(3) // round(20 × 0.15)
    expect(calls.fates.every((f) => f.fate === 'arrestado')).toBe(true)
    expect(new Set(calls.fates.map((f) => f.player_id)).size).toBe(3)
    expect((calls.scenes.at(-1)!.payload!.arrestados as string[]).length).toBe(3)
  })

  it('arrestos son deterministas por sesión (no dependen de lo que votó nadie)', async () => {
    await applyArrests(ctx(session('a3_danton')))
    const a = calls.fates.map((f) => f.player_id)
    calls.fates.length = 0
    await applyArrests(ctx(session('a3_danton'), [d('p1', 'a3_decreto', 'aplaudir')]))
    expect(calls.fates.map((f) => f.player_id)).toEqual(a)
  })

  it('entrar al tribunal con garantías cita a arrestados y a riesgo ≥ 60', async () => {
    const dec = [d('p5', 'a3_decreto', 'criticar'), d('p6', 'a1_rumor', 'compartir')] // p5: 45, p6: 25
    const payload = await enterScene(ctx(session('a3_danton', { arrestados: ['p0'] }), dec), 'a3_tribunal_garantias')
    expect(payload.cited).toContain('p0') // arrestado: riesgo 20+30 = 50, pero citado por el sistema
    expect(payload.cited).not.toContain('p5')
    expect(payload.cited).not.toContain('p6')
  })

  it('publicar destinos: solo los citados, determinista, y los demás quedan no_citado', async () => {
    const s = session('a3_tribunal_garantias', { arrestados: ['p0', 'p1'], cited: ['p0', 'p1'] })
    const r = await publishFates(ctx(s))
    expect(r.absueltos + r.condenados).toBe(2)
    const cited = calls.fates.filter((f) => f.fate !== 'no_citado')
    expect(cited.map((f) => f.player_id).sort()).toEqual(['p0', 'p1'])
    expect(calls.fates.filter((f) => f.fate === 'no_citado')).toHaveLength(18)
    const again = calls.fates.map((f) => f.fate)
    calls.fates.length = 0
    await publishFates(ctx(s))
    expect(calls.fates.map((f) => f.fate)).toEqual(again)
    expect((calls.scenes.at(-1)!.payload!.published as string[])).toContain('a3_tribunal_garantias')
  })

  it('sin garantías no cita a los ya condenados', async () => {
    const ps = players.map((p, i) => (i === 0 ? { ...p, fate: 'condenado' as const } : p))
    const dec = [d('p0', 'a3_decreto', 'criticar')]
    const payload = await enterScene(ctx(session('a3_pradial'), dec, ps), 'a3_tribunal_sin_garantias')
    expect(payload.cited).not.toContain('p0')
  })

  it('publicar fuera de un tribunal falla', async () => {
    await expect(publishFates(ctx(session('a1_rumor')))).rejects.toThrow()
  })

  it('el rey se sortea al entrar a a2_rey y se puede re-sortear', async () => {
    const p = await enterScene(ctx(session('a1_rumor')), 'a2_rey')
    expect(players.map((x) => x.id)).toContain(p.rey_player_id)
    const keep = await enterScene(ctx(session('a2_rey', { rey_player_id: 'p3' })), 'a2_rey')
    expect(keep.rey_player_id).toBe('p3')
  })

  it('stateOf suma riesgo por arresto', () => {
    expect(stateOf(ctx(session('x', { arrestados: ['p0'] })), 'p0').riesgo).toBe(50)
  })
})
