// Ensayo del celular SIN base de datos: un jugador simulado en cualquier escena. Sirve para probar la experiencia móvil a solas.
// Parámetros: s=<id_escena> v=A|B|C (panfleto) arr=1 (arrestado) cited=1 (citado) fate=absuelto|condenado rey=1 bar=0 (ocultar controles)
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ESCENAS } from '../content/escenas.ts'
import { identidadPara } from '../content/identidades.ts'
import { variantePanfleto } from '../game/engine.ts'
import type { DecisionRow, Payload, PlayerRow, PostRow, SessionRow } from '../lib/api.ts'
import { actoColor, SceneView, type PCtx } from '../player/PlayerScenes.tsx'
import { Shell } from '../player/ui.tsx'
import type { Fate } from '../game/types.ts'

function seedFor(v: 'A' | 'B' | 'C') {
  for (let i = 0; i < 500; i++) if ('ABC'[variantePanfleto('ensayo' + i)] === v) return 'ensayo' + i
  return 'ensayo0'
}

export default function Ensayo() {
  const [p, setP] = useSearchParams()
  const sceneId = p.get('s') ?? 'a1_rumor'
  const v = (p.get('v') ?? 'A') as 'A' | 'B' | 'C'
  const scene = ESCENAS.find((s) => s.id === sceneId) ?? ESCENAS[1]
  const [decisions, setDecisions] = useState<DecisionRow[]>([])
  const [posts] = useState<PostRow[]>([])

  const me: PlayerRow = useMemo(() => ({
    id: 'yo', session_id: 's', nickname: 'ensayo', identity: identidadPara(seedFor(v)), status: 'active',
    fate: (p.get('fate') as Fate | null) ?? (p.get('arr') ? 'arrestado' : null),
  }), [v, p])
  const payload: Payload = {
    rey_player_id: p.get('rey') ? 'yo' : 'otro',
    arrestados: p.get('arr') ? ['yo'] : [],
    cited: p.get('cited') || p.get('arr') ? ['yo'] : [],
    published: p.get('fate') ? [scene.id] : [],
  }
  const session: SessionRow = { id: 's', code: 'ENSA', scene: scene.id, scene_started_at: '', scene_payload: payload, status: 'open' }

  const send = useCallback(async (key: string, choice: string, meta?: Record<string, unknown>) => {
    await new Promise((r) => setTimeout(r, 250))
    setDecisions((d) => [...d, { player_id: 'yo', scene: scene.id, prompt_key: key, choice, meta: meta ?? {} }])
  }, [scene.id])

  const c: PCtx = {
    creds: { player_id: 'yo', token: 't' }, session, scene, me, decisions, posts, payload,
    crowd: { total: 18, players: 24, by: { compartir: 9, creer: 4, verificar: 2, aplaudir: 11, callar: 6, criticar: 1 } },
    send, refresh: async () => {},
  }
  return (
    <>
      <Shell pal={actoColor(scene)} acto={scene.acto} name={me.identity.nombreFrances} live>
        <motion.div key={scene.id + v} className="flex flex-1 flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SceneView c={c} />
        </motion.div>
      </Shell>
      {p.get('bar') !== '0' && (
        <div className="fixed left-2 top-12 z-40 flex gap-1 rounded-lg bg-black/80 p-1 text-[12px]">
          <select aria-label="Escena" value={scene.id} onChange={(e) => { setDecisions([]); setP({ s: e.target.value, v }, { replace: true }) }} className="max-w-[150px] bg-black text-parchment">
            {ESCENAS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
          </select>
          <select aria-label="Panfleto" value={v} onChange={(e) => { setDecisions([]); setP({ s: scene.id, v: e.target.value }, { replace: true }) }} className="bg-black text-parchment">
            {['A', 'B', 'C'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      )}
    </>
  )
}
