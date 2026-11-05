// Mismo formato que el CHECK de sessions.code en DATA_MODEL.sql: ^[A-Z0-9]{4,6}$
const CODE_RE = /^[A-Z0-9]{4,6}$/

/** Normaliza (trim + mayúsculas) y valida un código de sesión. Devuelve null si no es válido. */
export function normalizeCode(raw: string | null | undefined): string | null {
  const code = (raw ?? '').trim().toUpperCase()
  return CODE_RE.test(code) ? code : null
}
