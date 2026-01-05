import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint para iniciar el proceso de login con Google
 * Redirige al usuario a la página de autenticación de Google
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener la URL de redirección después del login
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${origin}/api/auth/callback`
    
    // Iniciar el proceso de OAuth con Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('[Auth] Error iniciando login con Google:', error)
      return NextResponse.json(
        { error: 'Error al iniciar login con Google', message: error.message },
        { status: 500 }
      )
    }

    // Redirigir a la URL de autenticación de Google
    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.json(
      { error: 'No se pudo obtener la URL de autenticación' },
      { status: 500 }
    )
  } catch (error) {
    console.error('[Auth] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

