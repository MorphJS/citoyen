import { useState, type CSSProperties } from 'react'
import { hostEndSession } from '../lib/api.ts'
import { clearCreds } from '../lib/hostCreds.ts'
import type { HostCreds } from './ops.ts'

/**
 * Botón pequeño y discreto para cerrar la actividad y BORRAR todos los datos de la sala.
 * Pide escribir el código de la sala para confirmar (no se puede deshacer).
 */
export default function EndButton({ creds, onDone, style }: { creds: HostCreds; onDone: () => void; style?: CSSProperties }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const ok = typed.trim().toUpperCase() === creds.code

  async function wipe() {
    setBusy(true); setMsg(null)
    try {
      await hostEndSession(creds.code, creds.secret)
      clearCreds()
      setMsg('Listo: se borraron todos los datos de la sala.')
      setTimeout(onDone, 1600)
    } catch (e) {
      setMsg('No se pudo borrar: ' + (e instanceof Error ? e.message : 'error de red') + '. Reintenta.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setTyped(''); setMsg(null) }} aria-label="Cerrar la actividad y borrar los datos" title="Cerrar actividad"
        style={{ opacity: 0.22, background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontSize: 11, letterSpacing: '0.2em', padding: '10px 12px', ...style }}>
        cerrar
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Cerrar la actividad" className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.82)' }} onClick={() => !busy && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/20 p-5 text-parchment" style={{ background: '#14100c' }}>
            <p className="m-0 font-serif text-[26px] font-bold text-gold">Cerrar la actividad</p>
            <p className="mb-3 mt-2 text-[16px] leading-snug text-parchment/80">Se borrarán <b>todos los datos de la sala {creds.code}</b>: jugadores, decisiones y textos. Los celulares verán que la actividad terminó. <b>No se puede deshacer.</b></p>
            <label className="block text-[13px] uppercase tracking-widest text-parchment/60">Escribe el código para confirmar
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" autoComplete="off" placeholder={creds.code}
                className="mt-1 min-h-12 w-full rounded-lg border border-white/25 bg-black/40 px-4 text-lg uppercase tracking-widest text-parchment outline-none focus:border-gold" />
            </label>
            {msg && <p role="status" className="mb-0 mt-3 text-[15px] text-parchment/85">{msg}</p>}
            <div className="mt-4 flex gap-3">
              <button disabled={busy} onClick={() => setOpen(false)} className="min-h-12 flex-1 rounded-lg border border-white/30 text-[16px]">Cancelar</button>
              <button disabled={!ok || busy} onClick={() => void wipe()} className="min-h-12 flex-1 rounded-lg border border-red-400/70 text-[16px] font-semibold text-red-200 disabled:opacity-35">{busy ? 'Borrando…' : 'Borrar todo'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
