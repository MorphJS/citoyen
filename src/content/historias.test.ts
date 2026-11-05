import { describe, expect, it } from 'vitest'
import { promptsDe } from './decisiones.ts'
import { DEBATE, desenlaceA1, ECO, ecoDe, HOY, PANFLETO, REVELA_A1, VERDAD_A1, type Variante } from './historias.ts'
import { ESCENAS } from './escenas.ts'

const V: Variante[] = ['A', 'B', 'C']
const ACCIONES = ['creer', 'compartir', 'denunciar', 'ignorar']

describe('historia del panfleto', () => {
  it('la verdad NO coincide con la apariencia: el firmado miente y el anónimo es cierto', () => {
    expect(VERDAD_A1.A).toBe('falso')
    expect(VERDAD_A1.B).toBe('cierto')
    expect(VERDAD_A1.C).toBe('mixto')
  })
  it('toda combinación variante × acción tiene desenlace con texto', () => {
    for (const v of V) {
      for (const a of ACCIONES) expect(desenlaceA1(v, a).texto.length).toBeGreaterThan(20)
      for (const t of ['difundir', 'guardia', 'callar']) expect(desenlaceA1(v, 'verificar', t).texto.length).toBeGreaterThan(20)
      expect(REVELA_A1[v].length).toBeGreaterThan(20)
    }
  })
  it('denunciar una mentira cuesta caro y verificar+difundir sale bien', () => {
    expect(desenlaceA1('A', 'denunciar').tono).toBe('mal')
    expect(desenlaceA1('A', 'verificar', 'difundir').tono).toBe('bien')
  })
  it('hacer lo correcto también tiene costo (ningún desenlace es perfecto)', () => {
    expect(desenlaceA1('B', 'verificar', 'guardia').tono).not.toBe('bien')
    expect(desenlaceA1('C', 'verificar', 'difundir').texto).toMatch(/acusaron|tibio/i)
  })
  it('el panfleto es ficticio y lo dice', () => {
    expect(PANFLETO.nota).toMatch(/ficticio/i)
  })
})

describe('ecos y debate', () => {
  it('cada opción de cada decisión tiene eco de consecuencia (salvo las del panfleto, que usan desenlaces)', () => {
    const faltan: string[] = []
    for (const e of ESCENAS) {
      if (e.id === 'a1_rumor') continue
      for (const p of promptsDe(e.id)) for (const o of p.opciones) if (!ecoDe(e.id, p.key, o.id)) faltan.push(`${e.id}|${p.key}|${o.id}`)
    }
    expect(faltan).toEqual([])
  })
  it('no hay ecos huérfanos', () => {
    for (const k of Object.keys(ECO)) {
      const [scene, key, choice] = k.split('|')
      expect(promptsDe(scene).find((p) => p.key === key)?.opciones.some((o) => o.id === choice), k).toBe(true)
    }
  })
  it('el debate y el “hoy” apuntan a escenas que existen', () => {
    const ids = new Set(ESCENAS.map((e) => e.id))
    for (const k of Object.keys(DEBATE)) expect(ids.has(k), k).toBe(true)
    for (const k of Object.keys(HOY)) expect(ids.has(k), k).toBe(true)
  })
  it('regla 3: ninguna denuncia apunta a un compañero ni a persona real', () => {
    const todo = JSON.stringify([PANFLETO, ECO, REVELA_A1])
    expect(todo).not.toMatch(/compañero/i)
    expect(todo).toMatch(/personaje ficticio|ficticio/i)
  })
})
