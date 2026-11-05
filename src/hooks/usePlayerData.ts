import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getPlayer, getSessionByCode, myApprovedPosts, myDecisions, subscribeTables,
  type DecisionRow, type PlayerRow, type PostRow, type SessionRow,
} from '../lib/api.ts'

export type PlayerData = {
  session: SessionRow | null
  me: PlayerRow | null
  decisions: DecisionRow[]
  posts: PostRow[]
  live: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Registra localmente una decisión recién enviada (respuesta inmediata en pantalla). */
  addLocalDecision: (d: DecisionRow) => void
}

/** Escena en vivo por Realtime; los datos propios se releen al cambiar la escena y cada 3 s por si el wifi falla. */
export function usePlayerData(code: string, playerId: string): PlayerData {
  const [session, setSession] = useState<SessionRow | null>(null)
  const [me, setMe] = useState<PlayerRow | null>(null)
  const [decisions, setDecisions] = useState<DecisionRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const [s, p, d, po] = await Promise.all([getSessionByCode(code), getPlayer(playerId), myDecisions(playerId), myApprovedPosts(playerId)])
      setSession(s)
      setMe(p)
      setDecisions((prev) => {
        // conserva decisiones locales aún no vistas en el servidor
        const keys = new Set(d.map((x) => x.scene + '|' + x.prompt_key))
        return [...d, ...prev.filter((x) => !keys.has(x.scene + '|' + x.prompt_key))]
      })
      setPosts(po.filter((x) => x.status === 'approved'))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sin conexión')
    } finally {
      busy.current = false
    }
  }, [code, playerId])

  useEffect(() => {
    void refresh()
    let t: ReturnType<typeof setTimeout> | undefined
    const debounced = () => { clearTimeout(t); t = setTimeout(() => void refresh(), 80) }
    const unsub = subscribeTables('p-' + playerId.slice(0, 8), ['sessions', 'players', 'posts'], debounced, setLive)
    const poll = setInterval(() => void refresh(), 3000)
    return () => { clearTimeout(t); clearInterval(poll); unsub() }
  }, [refresh, playerId])

  const addLocalDecision = useCallback((d: DecisionRow) => setDecisions((prev) => [...prev, d]), [])
  return { session, me, decisions, posts, live, error, refresh, addLocalDecision }
}
