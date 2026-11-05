import type { HostCreds } from '../host/ops.ts'

const KEY = 'citoyen:host'

// El host secret vive solo en sessionStorage (se borra al cerrar la pestaña) y nunca en el repo.
export function loadCreds(): HostCreds | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HostCreds) : null
  } catch {
    return null
  }
}
export function saveCreds(c: HostCreds) {
  try { sessionStorage.setItem(KEY, JSON.stringify(c)) } catch { /* modo privado: se pedirá de nuevo */ }
}
export function clearCreds() {
  try { sessionStorage.removeItem(KEY) } catch { /* nada */ }
}

export function randomCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O/0/I/1 para evitar confusiones al dictar
  return Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
}

export function joinUrlFor(code: string): string {
  return `${location.origin}${location.pathname}#/jugar?code=${code}`
}
