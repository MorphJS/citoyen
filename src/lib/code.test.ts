import { describe, expect, it } from 'vitest'
import { normalizeCode } from './code.ts'

describe('normalizeCode', () => {
  it('normaliza a mayúsculas y recorta espacios', () => {
    expect(normalizeCode('  test ')).toBe('TEST')
  })
  it('rechaza longitudes fuera de 4–6 y caracteres no alfanuméricos', () => {
    expect(normalizeCode('abc')).toBeNull()
    expect(normalizeCode('abcdefg')).toBeNull()
    expect(normalizeCode('ab-cd')).toBeNull()
    expect(normalizeCode(null)).toBeNull()
  })
})
