export type Meters = { libertad: number; seguridad: number; lealtad: number; riesgo: number }
export type Fate = 'absuelto' | 'condenado' | 'no_citado' | 'arrestado'
export type EngineDecision = { scene: string; prompt_key: string; choice: string }
export type State = Meters & { flags: string[] }
export type EndingId = 'condenado' | 'voz' | 'presiono' | 'verificador' | 'aplaudidor' | 'silencioso' | 'default'
