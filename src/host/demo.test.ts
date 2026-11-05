import { describe, expect, it } from 'vitest'
import { makeDemo } from './demo.ts'
import { debrief, reyVsGrupos } from './stats.ts'

describe('modo sin celulares', () => {
  const demo = makeDemo()
  it('genera 28 jugadores con identidades ficticias y destinos coherentes', () => {
    expect(demo.players).toHaveLength(28)
    expect(demo.players.every((p) => p.identity.nombreFrances && p.fate)).toBe(true)
  })
  it('los resultados agregados cuadran (nunca más citados que jugadores)', () => {
    const x = debrief(demo.decisions, demo.players)
    expect(x.callaron + x.criticaron).toBeLessThanOrEqual(x.total)
    expect(x.absueltos).toBeLessThanOrEqual(x.citados)
  })
  it('hay rey con tres decisiones y un resultado por grupo', () => {
    const r = reyVsGrupos(demo.decisions, demo.session.scene_payload)
    expect(r.rey.every((x) => x.eleccion)).toBe(true)
    expect(r.grupos.every((g) => g.top)).toBe(true)
  })
  it('solo hay textos aprobados', () => {
    expect(demo.posts.every((p) => p.status === 'approved')).toBe(true)
  })
})
