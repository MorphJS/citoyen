// Armazón móvil del jugador: una mano, pulgar abajo, tipografía grande, sin zoom accidental.
import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { PALETAS, type Acto, type Palette } from '../content/escenas.ts'
import type { Tono } from '../content/historias.ts'
import { PaperDefs } from './artifacts/paper.tsx'

export const buzz = (ms: number | number[] = 12) => {
  try { navigator.vibrate?.(ms) } catch { /* no soportado */ }
}

const ACTOS: Acto[] = [1, 2, 3, 4, 5]

export function Shell({ pal, acto, name, live, children }: { pal: Palette; acto: Acto; name: string; live: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col" style={{ background: `radial-gradient(120% 60% at 50% -10%, ${pal.glow}40, transparent 60%), #0a0806`, color: '#f3ece0' }}>
      <PaperDefs />
      <header className="sticky top-0 z-30 px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))]" style={{ background: 'linear-gradient(#0a0806 60%, transparent)' }}>
        <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.22em] text-parchment/60">
          <span className="truncate">{name}</span>
          <span style={{ color: live ? '#8fd19e' : '#e8a73a' }}>{live ? '● en vivo' : '○ reconectando'}</span>
        </div>
        <div className="mt-2 flex gap-1.5" aria-label={`Acto ${acto === 0 ? 'prólogo' : acto} de 5`}>
          {ACTOS.map((a) => (
            <i key={a} className="h-[3px] flex-1 rounded" style={{ background: a < acto ? pal.glow : a === acto ? PALETAS[a].accent : 'rgba(255,255,255,.14)', opacity: a <= acto ? 1 : 0.7 }} />
          ))}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-2">{children}</main>
    </div>
  )
}

export function Heading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <header>
      {kicker && <p className="mb-1 text-[12px] uppercase tracking-[0.28em] text-parchment/60">{kicker}</p>}
      <h2 className="m-0 text-[44px] leading-[0.95] text-gold" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>{title}</h2>
    </header>
  )
}

/**
 * Barra inferior pegada al borde (zona del pulgar).
 * Por defecto está COLAPSADA: primero se lee el documento y solo entonces se abre el panel de decisión.
 * `always` la deja abierta (formularios, descargas).
 */
export function Dock({ children, always = false, label = 'Decidir' }: { children: ReactNode; always?: boolean; label?: string }) {
  const [open, setOpen] = useState(false)
  if (always) {
    return (
      <div className="sticky bottom-0 z-20 -mx-4 mt-auto flex flex-col gap-2.5 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6" style={{ background: 'linear-gradient(to top, #0a0806 72%, transparent)' }}>
        {children}
      </div>
    )
  }
  return (
    <>
      <div className="sticky bottom-0 z-20 -mx-4 mt-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6" style={{ background: 'linear-gradient(to top, #0a0806 72%, transparent)' }}>
        <button onClick={() => { buzz(14); setOpen(true) }} className="flex min-h-[60px] w-full items-center justify-between rounded-2xl px-5 text-[19px] font-semibold text-[#1a1208] active:scale-[0.985]" style={{ background: '#c9a24b' }}>
          <span>{label}</span><span aria-hidden>▲</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setOpen(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }} onClick={(e) => e.stopPropagation()}
              className="flex max-h-[88dvh] w-full flex-col gap-2.5 overflow-y-auto rounded-t-3xl border-t border-white/15 px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-5" style={{ background: '#14100c' }} role="dialog" aria-modal="true" aria-label={label}>
              <div className="mx-auto mb-1 h-1.5 w-12 rounded bg-white/25" aria-hidden />
              {children}
              <GhostButton onClick={() => setOpen(false)}>Volver a leer</GhostButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function OptionButton({ label, sub, onClick, disabled, danger }: { label: string; sub?: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => { buzz(10); onClick() }}
      className="min-h-[60px] w-full rounded-2xl border px-5 py-3 text-left text-[18px] font-medium leading-snug text-parchment transition active:scale-[0.985] disabled:opacity-40"
      style={{ borderColor: danger ? 'rgba(232,110,100,.6)' : 'rgba(201,162,75,.55)', background: 'rgba(255,255,255,.06)' }}
    >
      {label}
      {sub && <span className="mt-0.5 block text-[14px] font-normal text-parchment/60">{sub}</span>}
    </button>
  )
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="min-h-[48px] text-[16px] text-parchment/60 underline">{children}</button>
}

/** Confirmación antes de una decisión que no se puede deshacer. Da peso a la elección. */
export function Sheet({ open, title, text, confirm, onConfirm, onCancel }: { open: boolean; title: string; text: string; confirm: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(0,0,0,.7)' }} role="dialog" aria-modal="true" aria-label={title}>
          <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} className="w-full rounded-t-3xl border-t border-white/15 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6" style={{ background: '#14100c' }}>
            <p className="font-serif text-[28px] font-bold leading-tight text-gold">{title}</p>
            <p className="mb-5 mt-2 text-[17px] leading-snug text-parchment/80">{text}</p>
            <div className="flex flex-col gap-2.5">
              <OptionButton label={confirm} onClick={() => { buzz([30, 40, 30]); onConfirm() }} danger />
              <GhostButton onClick={onCancel}>Volver y pensarlo</GhostButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const TONO: Record<Tono, string> = { bien: '#8fd19e', mal: '#e98a7e', mixto: '#e8c26a' }

/** Consecuencia de lo que acabas de decidir + el paralelo de hoy. */
export function Eco({ text, hoy, tono, title }: { text: string; hoy?: string; tono?: Tono; title?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5" aria-live="polite">
      {title && <p className="mb-1 text-[12px] uppercase tracking-[0.25em]" style={{ color: tono ? TONO[tono] : '#c9a24b' }}>{title}</p>}
      <p className="m-0 text-[19px] leading-snug">{text}</p>
      {hoy && (
        <p className="mb-0 mt-4 border-t border-white/10 pt-3 text-[15px] leading-snug text-parchment/65">
          <b className="text-[12px] uppercase tracking-[0.2em] text-gold/80">Hoy</b>
          <br />
          {hoy}
        </p>
      )}
    </motion.section>
  )
}

export function Waiting({ title = 'Mira el proyector', text }: { title?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <motion.span className="h-3 w-3 rounded-full bg-gold" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      <p className="m-0 font-serif text-[30px] leading-tight text-gold">{title}</p>
      {text && <p className="m-0 max-w-[300px] text-[17px] leading-snug text-parchment/70">{text}</p>}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-[17px] leading-snug text-parchment/85">{children}</p>
}

/** Ambiente de la plaza: cuántos ya reaccionaron, en vivo. Presión social real (y luego se debate). */
export function Plaza({ items, total }: { items: { label: string; n: number }[]; total: number }) {
  return (
    <section aria-label="Ambiente de la plaza" className="rounded-2xl border border-white/12 bg-black/30 p-4">
      <p className="m-0 mb-2 text-[12px] uppercase tracking-[0.25em] text-parchment/55">La plaza ahora · {total} han reaccionado</p>
      {items.map((x) => (
        <div key={x.label} className="mb-1.5 flex items-center gap-3 text-[15px]">
          <span className="w-24 text-parchment/80">{x.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-white/10"><motion.div className="h-full rounded bg-gold" animate={{ width: `${total ? (x.n / total) * 100 : 0}%` }} transition={{ duration: 0.6 }} /></div>
          <span className="w-6 text-right tabular-nums text-parchment/70">{x.n}</span>
        </div>
      ))}
    </section>
  )
}
