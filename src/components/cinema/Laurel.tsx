// Sello de laurel (como los de premios en un cartel de cine), en SVG propio.
function Branch({ flip }: { flip?: boolean }) {
  // Hojas sobre un arco de la circunferencia, de abajo hacia arriba.
  const n = 11
  return (
    <g transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const a = ((112 + t * 138) * Math.PI) / 180 // 112°..250°
        const r = 40
        const x = 50 + r * Math.cos(a)
        const y = 50 + r * Math.sin(a)
        const rot = (a * 180) / Math.PI + 90 + 28 // hoja inclinada hacia afuera
        return <ellipse key={i} cx={x} cy={y} rx="3.4" ry="8.5" transform={`rotate(${rot} ${x} ${y})`} fill="currentColor" opacity={0.92} />
      })}
    </g>
  )
}

export function Laurel({ label }: { label: string }) {
  return (
    <div className="relative" style={{ width: '9.5cqw', height: '9.5cqw', color: 'var(--accent)' }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <Branch />
        <Branch flip />
      </svg>
      <div className="absolute flex items-center justify-center text-center" style={{ inset: '28%', fontSize: '0.8cqw', letterSpacing: '0.1em', fontWeight: 600, lineHeight: 1.2, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}
