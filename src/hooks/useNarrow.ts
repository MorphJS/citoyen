import { useEffect, useState } from 'react'

const Q = '(max-width: 760px), (max-aspect-ratio: 1/1)'

/** Pantalla angosta o vertical (celular): el presentador usa la vista móvil en vez del lienzo 16:9. */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => (typeof matchMedia === 'function' ? matchMedia(Q).matches : false))
  useEffect(() => {
    const m = matchMedia(Q)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}
