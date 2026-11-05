// Reglas del juego: funciones PURAS (sin React ni Supabase). Compartidas por host y celulares.
import { BALANCE as B } from '../content/balance.ts'
import { findOpcion, HISTORIA } from '../content/decisiones.ts'
import { hashSeed, rng01, seededShuffle } from './rng.ts'
import type { EndingId, EngineDecision, Fate, State } from './types.ts'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export type StateOpts = { arrestado?: boolean; cordelierAprobado?: boolean }

/** Medidores derivados de las decisiones (no se guardan). Inician en 50 y riesgo en 20. */
export function computeState(decisions: readonly EngineDecision[], opts: StateOpts = {}): State {
  let libertad = 50, seguridad = 50, lealtad = 50, riesgo: number = B.riesgoBase
  const flags = new Set<string>()
  for (const d of decisions) {
    const o = findOpcion(d.scene, d.prompt_key, d.choice)
    if (!o) continue
    if (o.flag) flags.add(o.flag)
    libertad += o.delta?.libertad ?? 0
    seguridad += o.delta?.seguridad ?? 0
    lealtad += o.delta?.lealtad ?? 0
    riesgo += o.delta?.riesgo ?? 0
  }
  if (opts.cordelierAprobado) { riesgo += B.riesgoCordelierAprobado; flags.add('voz_cordelier') }
  if (opts.arrestado) riesgo += B.riesgoArrestado
  return {
    libertad: clamp(libertad, 0, 100), seguridad: clamp(seguridad, 0, 100),
    lealtad: clamp(lealtad, 0, 100), riesgo: clamp(riesgo, 0, 100), flags: [...flags],
  }
}

/** Probabilidad de absolución. Nunca < 10 % ni > 85 %: la arbitrariedad es parte del mensaje. */
export function pAbsolucion(riesgo: number, conGarantias: boolean, bonus = 0): number {
  if (conGarantias) {
    const g = B.garantias
    return clamp(g.base - riesgo / g.div + bonus, g.min, g.max)
  }
  const s = B.sinGarantias
  return clamp(s.base - riesgo / s.div, s.min, s.max) // sin garantías no hay bonus
}

/** Sorteo determinista: seed = `${session_id}:${player_id}:${escena}`. */
export function tribunalOutcome(seed: string, riesgo: number, bonus: number, conGarantias: boolean) {
  const p = pAbsolucion(riesgo, conGarantias, conGarantias ? bonus : 0)
  return { p, absuelto: rng01(seed) < p }
}

/** Bonus de absolución según lo que eligió en el tribunal con garantías. */
export function bonusDe(choice: string | undefined): number {
  return choice ? (B.garantias.bonus[choice] ?? 0) : 0
}

/** Azar puro del sistema (nunca denuncia entre compañeros): ~pct de los jugadores, mínimo 1 si hay. */
export function pickArrested(playerIds: readonly string[], seed: string, pct: number = B.pArrestos): string[] {
  if (playerIds.length === 0) return []
  const n = Math.max(1, Math.round(playerIds.length * pct))
  return seededShuffle(playerIds, seed).slice(0, n)
}

export function pickRey(playerIds: readonly string[], seed: string): string | null {
  return playerIds.length === 0 ? null : seededShuffle(playerIds, seed)[0]
}

/** 0 legislativo · 1 ejecutivo · 2 judicial */
export function grupoDe(seedStr: string): 0 | 1 | 2 {
  return (hashSeed(seedStr) % 3) as 0 | 1 | 2
}
export const GRUPOS = ['legislativo', 'ejecutivo', 'judicial'] as const

/** 0 A · 1 B · 2 C */
export function variantePanfleto(seedStr: string): 0 | 1 | 2 {
  return (hashSeed('panfleto:' + seedStr) % 3) as 0 | 1 | 2
}

/** Citados al tribunal con garantías: arrestados por el sistema o con riesgo alto. */
export function citadoConGarantias(arrestado: boolean, riesgo: number): boolean {
  return arrestado || riesgo >= B.citarGarantiasRiesgo
}

/** Citados sin garantías: quien no fue condenado ya y tiene riesgo alto, más un poco de azar del sistema. */
export function citadoSinGarantias(condenadoAntes: boolean, riesgo: number, seed: string): boolean {
  if (condenadoAntes) return false
  return riesgo >= B.citarSinGarantiasRiesgo || rng01(seed) < B.citarSinGarantiasAzar
}

/** Final personalizado: gana el primero que cumple (SPEC §8). */
export function computeEnding(state: Pick<State, 'flags'>, fate: Fate | null | undefined): EndingId {
  const f = new Set(state.flags)
  if (fate === 'condenado') return 'condenado'
  if (f.has('voz_cordelier')) return 'voz'
  if (f.has('presiono')) return 'presiono'
  if (f.has('verifico') && !f.has('compartio')) return 'verificador'
  if (f.has('aplaudio')) return 'aplaudidor'
  if (f.has('callo')) return 'silencioso'
  return 'default'
}

/** Hasta 4 frases de “tu historia” para las lentes de Kant y Mill. */
export function resumenHistoria(decisions: readonly EngineDecision[], fate: Fate | null | undefined, fueRey: boolean): string[] {
  const out: string[] = []
  if (fueRey) out.push('Fuiste el “rey”: tuviste los tres poderes en tus manos.')
  for (const scene of ['a1_rumor', 'a3_decreto', 'a3_cordelier', 'a4_vecino']) {
    const d = decisions.find((x) => x.scene === scene && x.prompt_key === 'main')
    const t = d ? HISTORIA[scene]?.[d.choice] : undefined
    if (t) out.push(t)
  }
  if (fate === 'condenado') out.push('Tu caso fue condenado.')
  else if (fate === 'absuelto') out.push('Tu caso fue absuelto.')
  return out.slice(0, 4)
}
