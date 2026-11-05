// Agregados para el proyector: SOLO conteos y porcentajes, nunca quién votó qué.
import { findOpcion, promptsDe } from '../content/decisiones.ts'
import type { DecisionRow, Payload, PlayerRow } from '../lib/api.ts'

export type Conteo = { id: string; label: string; n: number; pct: number }

export function respondieron(decisions: readonly DecisionRow[], scene: string): number {
  return new Set(decisions.filter((d) => d.scene === scene).map((d) => d.player_id)).size
}

export function contar(decisions: readonly DecisionRow[], scene: string, prompt: string): { rows: Conteo[]; total: number } {
  const pr = promptsDe(scene).find((p) => p.key === prompt)
  const ds = decisions.filter((d) => d.scene === scene && d.prompt_key === prompt)
  const total = ds.length
  const rows = (pr?.opciones ?? []).map((o) => {
    const n = ds.filter((d) => d.choice === o.id).length
    return { id: o.id, label: o.label, n, pct: total ? Math.round((n / total) * 100) : 0 }
  })
  return { rows, total }
}

/** % que verificó el panfleto, por variante (A firma importante · B anónimo con fuente · C en disputa). */
export function porVariante(decisions: readonly DecisionRow[]) {
  return (['A', 'B', 'C'] as const).map((v) => {
    const ds = decisions.filter((d) => d.scene === 'a1_rumor' && d.meta?.variante === v)
    const verif = ds.filter((d) => d.choice === 'verificar').length
    return { v, total: ds.length, pct: ds.length ? Math.round((verif / ds.length) * 100) : 0 }
  })
}

export function debrief(decisions: readonly DecisionRow[], players: readonly PlayerRow[]) {
  const act = players.filter((p) => p.status === 'active')
  const dec = decisions.filter((d) => d.scene === 'a3_decreto')
  return {
    total: act.length,
    callaron: dec.filter((d) => d.choice === 'callar').length,
    criticaron: dec.filter((d) => d.choice === 'criticar').length,
    citados: act.filter((p) => p.fate === 'absuelto' || p.fate === 'condenado').length,
    absueltos: act.filter((p) => p.fate === 'absuelto').length,
  }
}

/** Lo que decidió el “rey” (un solo poder) frente a lo que decidieron los tres grupos. */
export function reyVsGrupos(decisions: readonly DecisionRow[], payload: Payload) {
  const rey = (payload.rey_player_id ? promptsDe('a2_rey') : []).map((pr) => {
    const d = decisions.find((x) => x.scene === 'a2_rey' && x.player_id === payload.rey_player_id && x.prompt_key === pr.key)
    return { pregunta: pr.pregunta, eleccion: d ? (findOpcion('a2_rey', pr.key, d.choice)?.label ?? '…') : null }
  })
  const grupos = promptsDe('a2_contrapesos').map((pr) => {
    const { rows, total } = contar(decisions, 'a2_contrapesos', pr.key)
    const top = [...rows].sort((a, b) => b.n - a.n)[0]
    return { grupo: pr.key, total, top: total && top ? top : null }
  })
  return { rey, grupos }
}
