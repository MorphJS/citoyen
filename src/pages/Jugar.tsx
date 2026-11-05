import { useSearchParams } from 'react-router-dom'
import { normalizeCode } from '../lib/code.ts'

// Fase 1: formulario de apodo + join_session. Por ahora solo lee el código de la URL.
export default function Jugar() {
  const [params] = useSearchParams()
  const code = normalizeCode(params.get('code'))

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-4xl text-gold">Sala</h1>
      {code ? (
        <p className="text-lg">
          Código: <strong className="tracking-widest">{code}</strong>
        </p>
      ) : (
        <p className="text-lg text-parchment/70">Falta un código válido en el enlace.</p>
      )}
    </main>
  )
}
