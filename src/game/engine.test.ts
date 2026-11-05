import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { identidadPara } from '../content/identidades.ts'
import {
  bonusDe, citadoConGarantias, citadoSinGarantias, computeEnding, computeState, grupoDe,
  pAbsolucion, pickArrested, pickRey, tribunalOutcome,
} from './engine.ts'
import { makeRng } from './rng.ts'

const d = (scene: string, choice: string, prompt_key = 'main') => ({ scene, prompt_key, choice })

describe('computeState', () => {
  it('inicia en 50/50/50 con riesgo 20', () => {
    expect(computeState([])).toMatchObject({ libertad: 50, seguridad: 50, lealtad: 50, riesgo: 20, flags: [] })
  })
  it('criticar sube riesgo +25 y compartir +5', () => {
    expect(computeState([d('a3_decreto', 'criticar')]).riesgo).toBe(45)
    expect(computeState([d('a1_rumor', 'compartir')]).riesgo).toBe(25)
  })
  it('cordelier aprobado +20 con flag, y arrestado +30', () => {
    const s = computeState([d('a3_decreto', 'criticar')], { cordelierAprobado: true, arrestado: true })
    expect(s.riesgo).toBe(95)
    expect(s.flags).toContain('voz_cordelier')
  })
  it('mantiene los medidores entre 0 y 100', () => {
    const many = Array.from({ length: 5 }, (_, i) => d('a3_decreto', 'criticar', 'p' + i))
    expect(computeState(many).riesgo).toBeLessThanOrEqual(100)
  })
  it('ignora opciones desconocidas', () => {
    expect(computeState([d('x', 'y')]).riesgo).toBe(20)
  })
})

describe('tribunal', () => {
  it('es determinista: misma semilla, mismo resultado', () => {
    const a = tribunalOutcome('s:p:e', 55, 0.1, true)
    const b = tribunalOutcome('s:p:e', 55, 0.1, true)
    expect(a).toEqual(b)
  })
  it('la probabilidad nunca baja de 10 % ni sube de 85 %', () => {
    for (let r = 0; r <= 100; r += 5) {
      for (const bonus of [0, 0.05, 0.1, 0.15, 0.3]) {
        for (const g of [true, false]) {
          const p = pAbsolucion(r, g, bonus)
          expect(p).toBeGreaterThanOrEqual(0.1)
          expect(p).toBeLessThanOrEqual(0.85)
        }
      }
    }
  })
  it('sin garantías ≤ con garantías para igual riesgo', () => {
    for (let r = 0; r <= 100; r += 5) expect(pAbsolucion(r, false)).toBeLessThanOrEqual(pAbsolucion(r, true))
  })
  it('sin garantías ignora el bonus', () => {
    expect(tribunalOutcome('x', 40, 0.15, false).p).toBe(pAbsolucion(40, false))
  })
  it('bonus por opción', () => {
    expect(bonusDe('defenderme')).toBe(0.1)
    expect(bonusDe('testigo')).toBe(0.15)
    expect(bonusDe('apelar')).toBe(0.05)
    expect(bonusDe(undefined)).toBe(0)
  })
  it('el sorteo respeta la probabilidad en el agregado', () => {
    const p = pAbsolucion(40, true, 0)
    let ok = 0
    const n = 4000
    for (let i = 0; i < n; i++) if (tribunalOutcome('sess:' + i + ':e', 40, 0, true).absuelto) ok++
    expect(Math.abs(ok / n - p)).toBeLessThan(0.04)
  })
})

describe('sorteos del sistema', () => {
  const ids = Array.from({ length: 30 }, (_, i) => 'p' + i)
  it('arrestos: ~15 %, sin duplicados, deterministas, mínimo 1', () => {
    const a = pickArrested(ids, 'sesion', 0.15)
    expect(a).toHaveLength(5) // round(4.5) = 5
    expect(new Set(a).size).toBe(a.length)
    expect(pickArrested(ids, 'sesion', 0.15)).toEqual(a)
    expect(pickArrested(['solo'], 'x', 0.15)).toEqual(['solo'])
    expect(pickArrested([], 'x')).toEqual([])
  })
  it('rey: uno de los jugadores, determinista', () => {
    const r = pickRey(ids, 'sesion')
    expect(ids).toContain(r)
    expect(pickRey(ids, 'sesion')).toBe(r)
    expect(pickRey([], 'x')).toBeNull()
  })
  it('los grupos se reparten en 3 de forma razonable', () => {
    const c = [0, 0, 0]
    for (let i = 0; i < 300; i++) c[grupoDe('seed' + i)]++
    for (const n of c) expect(n).toBeGreaterThan(70)
  })
  it('citaciones', () => {
    expect(citadoConGarantias(true, 20)).toBe(true)
    expect(citadoConGarantias(false, 60)).toBe(true)
    expect(citadoConGarantias(false, 59)).toBe(false)
    expect(citadoSinGarantias(true, 100, 'x')).toBe(false) // un condenado no vuelve a ser citado
    expect(citadoSinGarantias(false, 50, 'x')).toBe(true)
  })
})

describe('computeEnding (prioridad de SPEC §8)', () => {
  const st = (...flags: string[]) => ({ flags })
  it('condenado gana a todo', () => {
    expect(computeEnding(st('voz_cordelier', 'presiono', 'aplaudio'), 'condenado')).toBe('condenado')
  })
  it('orden: voz > presiono > verificador > aplaudidor > silencioso > default', () => {
    expect(computeEnding(st('voz_cordelier', 'presiono'), 'absuelto')).toBe('voz')
    expect(computeEnding(st('presiono', 'verifico'), null)).toBe('presiono')
    expect(computeEnding(st('verifico', 'aplaudio'), null)).toBe('verificador')
    expect(computeEnding(st('aplaudio', 'callo'), null)).toBe('aplaudidor')
    expect(computeEnding(st('callo'), null)).toBe('silencioso')
    expect(computeEnding(st(), null)).toBe('default')
  })
  it('verificador exige no haber compartido', () => {
    expect(computeEnding(st('verifico', 'compartio'), null)).toBe('default')
  })
})

describe('identidades y pureza', () => {
  it('la identidad es determinista y ficticia', () => {
    expect(identidadPara('abc')).toEqual(identidadPara('abc'))
    expect(identidadPara('abc').nombreFrances.length).toBeGreaterThan(3)
  })
  it('el RNG es estable', () => {
    expect(makeRng('x')()).toBe(makeRng('x')())
  })
  it('engine no importa React ni Supabase', () => {
    for (const f of ['engine.ts', 'rng.ts', 'types.ts']) {
      const src = readFileSync(new URL('./' + f, import.meta.url), 'utf8')
      expect(src).not.toMatch(/from ['"](react|@supabase|react-dom|framer-motion)/)
    }
  })
})
