import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSessionByCode, listApprovedPosts, listDecisions, listPlayers, subscribeTables,
  type DecisionRow, type PlayerRow, type PostRow, type SessionRow,
} from '../lib/api.ts'

export type HostData = {
  session: SessionRow | null
  players: PlayerRow[]
  decisions: DecisionRow[]
  posts: PostRow[]
  live: boolean // Realtime conectado
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Lee sesión, jugadores, decisiones y posts aprobados.
 * Realtime avisa de cambios (re-lectura con debounce) y un sondeo cada 2,5 s cubre un wifi inestable.
 */
export function useHostData(code: string | null): HostData {
  const [session, setSession] = useState<SessionRow | null>(null)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [decisions, setDecisions] = useState<DecisionRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (!code || busy.current) return
    busy.current = true
    try {
      const s = await getSessionByCode(code)
      setSession(s)
      if (s) {
        const [p, d, po] = await Promise.all([listPlayers(s.id), listDecisions(s.id), listApprovedPosts(s.id)])
        setPlayers(p)
        setDecisions(d)
        setPosts(po)
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sin conexión')
    } finally {
      busy.current = false
    }
  }, [code])

  useEffect(() => {
    if (!code) return
    void refresh()
    let t: ReturnType<typeof setTimeout> | undefined
    const debounced = () => { clearTimeout(t); t = setTimeout(() => void refresh(), 120) }
    const unsub = subscribeTables('host-' + code, ['sessions', 'players', 'decisions', 'posts'], debounced, setLive)
    const poll = setInterval(() => void refresh(), 2500)
    return () => { clearTimeout(t); clearInterval(poll); unsub() }
  }, [code, refresh])

  return { session, players, decisions, posts, live, error, refresh }
}
