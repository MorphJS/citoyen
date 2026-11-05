// Base visual de los documentos de época: papel, tinta, grabado, sellos. Todo SVG/CSS propio (sin imágenes externas).
import type { CSSProperties, ReactNode } from 'react'
import { hashSeed, makeRng } from '../../game/rng.ts'

export const FELL = "'IM Fell English', 'Cormorant Garamond', Georgia, serif"
export const FELL_SC = "'IM Fell English SC', 'IM Fell English', Georgia, serif"
export const BLACKLETTER = "'UnifrakturCook', 'IM Fell English', Georgia, serif"
export const HAND = "'Caveat', 'IM Fell English', cursive"
export const INK = '#2a1f16'

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.9 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
const FIBERS = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.5' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.55 -0.15'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>")`

/** Filtros reutilizables: tinta que sangra un poco y aristas de grabado. Se montan una sola vez en el shell. */
export function PaperDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="ink-bleed" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" />
      </filter>
      <filter id="woodcut-rough" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="9" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
      </filter>
    </svg>
  )
}

/** Borde irregular determinista (papel rasgado o cortado a mano). */
export function tornClip(seed: string, amp = 0.9): string {
  const r = makeRng('torn:' + seed)
  const pts: string[] = []
  const n = 34
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(1)}% ${(r() * amp).toFixed(2)}%`)
  for (let i = 1; i <= 14; i++) pts.push(`${(100 - r() * amp).toFixed(2)}% ${((i / 14) * 100).toFixed(1)}%`)
  for (let i = n; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(1)}% ${(100 - r() * amp).toFixed(2)}%`)
  for (let i = 13; i >= 1; i--) pts.push(`${(r() * amp).toFixed(2)}% ${((i / 14) * 100).toFixed(1)}%`)
  return `polygon(${pts.join(',')})`
}

export function Paper({
  children, tilt = 0, seed = 'p', tone = 'warm', style,
}: { children: ReactNode; tilt?: number; seed?: string; tone?: 'warm' | 'cool'; style?: CSSProperties }) {
  const base = tone === 'warm' ? ['#e9d9b4', '#d8c294'] : ['#e6e0cf', '#d3cbb3']
  return (
    <div style={{ transform: `rotate(${tilt}deg)`, filter: 'drop-shadow(0 18px 22px rgba(0,0,0,.65)) drop-shadow(0 2px 3px rgba(0,0,0,.5))', ...style }}>
      <div
        className="relative"
        style={{
          clipPath: tornClip(seed),
          color: INK,
          background: `radial-gradient(ellipse at 50% 35%, rgba(255,247,222,.45), rgba(120,84,40,.34) 100%), linear-gradient(180deg, ${base[0]}, ${base[1]})`,
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: FIBERS, mixBlendMode: 'multiply', opacity: 0.5 }} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, mixBlendMode: 'multiply', opacity: 0.5 }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 14% 22%, rgba(110,70,30,.20), transparent 9%),
              radial-gradient(circle at 82% 68%, rgba(110,70,30,.16), transparent 12%),
              radial-gradient(circle at 60% 92%, rgba(90,55,25,.20), transparent 8%),
              linear-gradient(to bottom, transparent 33%, rgba(70,45,20,.20) 33.2%, rgba(255,255,255,.14) 33.7%, transparent 34.2%, transparent 66%, rgba(70,45,20,.18) 66.2%, rgba(255,255,255,.12) 66.7%, transparent 67.2%),
              linear-gradient(to right, transparent 49.6%, rgba(70,45,20,.12) 50%, transparent 50.4%)`,
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}

/** Filete doble de imprenta. */
export function Rule({ thick = false }: { thick?: boolean }) {
  return (
    <div aria-hidden style={{ margin: '10px 0' }}>
      <div style={{ height: thick ? 3 : 2, background: INK }} />
      <div style={{ height: 1, background: INK, marginTop: 3 }} />
    </div>
  )
}

export function Ornament() {
  return (
    <p aria-hidden style={{ textAlign: 'center', fontFamily: FELL, letterSpacing: '0.6em', margin: '8px 0', fontSize: 14 }}>
      ❦ ❦ ❦
    </p>
  )
}

/** Grabado en madera: sacos de trigo apilados frente a un sótano con reja. Sombreado con rayado. */
export function WoodcutGranary({ seed = 'g' }: { seed?: string }) {
  const r = makeRng('wc:' + seed)
  const lines = Array.from({ length: 26 }, (_, i) => ({ x: 6 + i * 11.2 + r() * 3, h: 14 + r() * 10 }))
  const Sack = ({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-26,0 C-34,-20 -30,-44 -14,-52 L-10,-62 Q0,-68 10,-62 L14,-52 C30,-44 34,-20 26,0 Z" fill="#e8d8b0" stroke={INK} strokeWidth="2.2" />
      <path d="M-12,-56 Q0,-48 12,-56" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M-9,-58 L-12,-70 M0,-60 L0,-72 M9,-58 L12,-70" stroke={INK} strokeWidth="1.8" fill="none" />
      <path d="M-24,-6 C-14,-18 8,-18 24,-8 M-26,-20 C-14,-30 10,-30 28,-22" fill="none" stroke={INK} strokeWidth="1" opacity="0.7" />
      <path d="M6,-50 C18,-44 26,-30 24,-4 L26,0 C32,-20 28,-42 14,-52 Z" fill="url(#hatch)" />
    </g>
  )
  return (
    <svg viewBox="0 0 300 150" width="100%" style={{ display: 'block', margin: '6px auto', filter: 'url(#woodcut-rough)' }} role="img" aria-label="Grabado: sacos de trigo en un sótano">
      <defs>
        <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="1.3" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="296" height="146" fill="none" stroke={INK} strokeWidth="2.4" />
      <rect x="8" y="8" width="284" height="134" fill="url(#hatch)" opacity="0.22" />
      {/* sótano: arco y reja */}
      <path d="M70,142 L70,60 Q70,22 110,22 Q150,22 150,60 L150,142 Z" fill="#cdb98c" stroke={INK} strokeWidth="2.4" />
      <path d="M70,142 L70,60 Q70,22 110,22 Q150,22 150,60 L150,142 Z" fill="url(#hatch)" opacity="0.7" />
      {[84, 97, 110, 123, 136].map((x) => <line key={x} x1={x} y1="34" x2={x} y2="142" stroke={INK} strokeWidth="2.6" />)}
      <line x1="72" y1="78" x2="148" y2="78" stroke={INK} strokeWidth="2.6" />
      <line x1="72" y1="108" x2="148" y2="108" stroke={INK} strokeWidth="2.6" />
      {/* sacos */}
      <Sack x={190} y={142} s={0.95} rot={-2} />
      <Sack x={236} y={142} s={0.9} rot={3} />
      <Sack x={213} y={90} s={0.85} rot={-4} />
      <Sack x={262} y={100} s={0.5} rot={6} />
      {/* suelo */}
      <line x1="2" y1="142" x2="298" y2="142" stroke={INK} strokeWidth="3" />
      {lines.map((l, i) => <line key={i} x1={l.x} y1="143" x2={l.x - 5} y2={143 + Math.min(5, l.h / 4)} stroke={INK} strokeWidth="1.2" />)}
    </svg>
  )
}

/** Sello de lacre (autoridad). Contorno irregular determinista. */
export function WaxSeal({ letter = 'V', size = 84, seed = 'seal' }: { letter?: string; size?: number; seed?: string }) {
  const r = makeRng('wax:' + seed)
  const n = 26
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const rad = 40 + r() * 6 - (i % 2 ? 2 : 0)
    return `${(50 + rad * Math.cos(a)).toFixed(1)},${(50 + rad * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.55))' }}>
      <defs>
        <radialGradient id={'wg' + seed} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#b3281d" />
          <stop offset="0.6" stopColor="#7d130d" />
          <stop offset="1" stopColor="#4d0906" />
        </radialGradient>
      </defs>
      <polygon points={pts} fill={`url(#wg${seed})`} />
      <circle cx="50" cy="50" r="29" fill="none" stroke="#e0705f" strokeOpacity="0.45" strokeWidth="2" />
      <circle cx="50" cy="50" r="31.5" fill="none" stroke="#2a0503" strokeOpacity="0.45" strokeWidth="1.5" />
      <text x="50" y="62" textAnchor="middle" fontFamily={FELL} fontWeight="bold" fontSize="34" fill="#a02218" stroke="#2a0503" strokeWidth="0.8" strokeOpacity="0.6">{letter}</text>
    </svg>
  )
}

/** Sello de tinta circular: se usa para mostrar cuántas copias circulan (presión social “en el mundo”). */
export function InkStamp({ top, big, small, rot = -10 }: { top: string; big: string; small: string; rot?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={96} height={96} aria-hidden style={{ transform: `rotate(${rot}deg)`, mixBlendMode: 'multiply', opacity: 0.88, filter: 'url(#ink-bleed)' }}>
      <defs>
        <path id="arc-top" d="M 16,60 A 44,44 0 0 1 104,60" />
        <path id="arc-bot" d="M 12,66 A 48,48 0 0 0 108,66" />
      </defs>
      <circle cx="60" cy="60" r="55" fill="none" stroke="#8a1c14" strokeWidth="3" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="#8a1c14" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="30" fill="none" stroke="#8a1c14" strokeWidth="1.2" />
      <text fontFamily={FELL_SC} fontSize="10" fill="#8a1c14" letterSpacing="1"><textPath href="#arc-top" startOffset="50%" textAnchor="middle">{top}</textPath></text>
      <text fontFamily={FELL_SC} fontSize="10" fill="#8a1c14" letterSpacing="2"><textPath href="#arc-bot" startOffset="50%" textAnchor="middle" >{small}</textPath></text>
      <text x="60" y="72" textAnchor="middle" fontFamily={FELL} fontWeight="bold" fontSize="34" fill="#8a1c14">{big}</text>
    </svg>
  )
}

/** Clavo que sujeta un cartel a la pared. */
export function Nail({ style }: { style?: CSSProperties }) {
  return (
    <span aria-hidden style={{ position: 'absolute', width: 12, height: 12, borderRadius: 99, background: 'radial-gradient(circle at 35% 30%, #d9d1c1, #4b4234 70%)', boxShadow: '0 2px 3px rgba(0,0,0,.6)', ...style }} />
  )
}

export const seedOf = (s: string) => hashSeed(s)

/** Emblema de laurel con estrella, en tinta (para carteles oficiales). */
export function Emblem({ size = 70 }: { size?: number }) {
  const leaf = (a: number, flip: boolean) => {
    const rad = (a * Math.PI) / 180
    const x = 50 + 34 * Math.cos(rad)
    const y = 50 + 34 * Math.sin(rad)
    return <ellipse key={`${a}${flip}`} cx={flip ? 100 - x : x} cy={y} rx="3.2" ry="8" transform={`rotate(${(flip ? 180 - (a + 90) : a + 90) + (flip ? 0 : 0)} ${flip ? 100 - x : x} ${y})`} fill={INK} />
  }
  const angles = [105, 125, 145, 165, 185, 205, 225, 245]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ filter: 'url(#woodcut-rough)' }}>
      {angles.map((a) => leaf(a, false))}
      {angles.map((a) => leaf(a, true))}
      <polygon points="50,28 55,43 71,43 58,52 63,67 50,58 37,67 42,52 29,43 45,43" fill={INK} />
    </svg>
  )
}
