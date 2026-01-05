import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint para iniciar el proceso de login con Google
 * Redirige al usuario a la página de autenticación de Google
 * 
 * IMPORTANTE: En Google Cloud Console, el redirect_uri debe ser:
 * https://[tu-proyecto].supabase.co/auth/v1/callback
 * NO el callback de nuestra aplicación
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener la URL de redirección después del login
    // Esta será la URL a la que Supabase redirigirá después de autenticar
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${origin}/auth/callback`
    
    // Iniciar el proceso de OAuth con Google
    // Supabase manejará el callback inicial, luego redirigirá a redirectUrl
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, // URL a la que Supabase redirigirá después de autenticar
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

