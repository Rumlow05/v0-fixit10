import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Si no hay variables de entorno, retornamos null o lanzamos error.
  // En un entorno de servidor real, no podemos usar el mock basado en localStorage.
  // Retornamos un cliente dummy que no hace nada o null.
  console.warn("[v0] Server client: Missing Supabase environment variables.")
  return null
}
