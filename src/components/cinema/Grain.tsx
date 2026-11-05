// Grano de película, viñeta y el filtro "distress" (letras desgastadas) del título.
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export function FilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="distress" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 7.3" result="holes" />
        <feComposite in="SourceGraphic" in2="holes" operator="in" />
      </filter>
    </svg>
  )
}

export function Grain() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: NOISE, animation: 'grain 0.9s steps(6) infinite' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.65) 100%)' }}
      />
    </>
  )
}
