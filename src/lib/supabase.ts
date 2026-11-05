import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // No lanzamos: la landing debe cargar aunque falte la config (degradación elegante).
  console.warn('Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local')
}

// La anon key es pública por diseño; la seguridad la dan RLS y las RPCs (CLAUDE.md regla 10).
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing', {
  auth: { persistSession: false }, // no usamos cuentas de usuario
})
