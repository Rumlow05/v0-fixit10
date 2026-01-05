import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserByEmail, createUser } from '@/services/userService'
import { Role } from '@/types'

/**
 * Callback route que maneja la respuesta de Google OAuth
 * Después de autenticar con Google, busca o crea el usuario en la tabla users
 * y redirige a la aplicación con los datos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Si hay un error en el proceso de OAuth
    if (error) {
      console.error('[Auth Callback] Error de OAuth:', error)
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Error al autenticar con Google')}`)
    }

    // Intercambiar el código por la sesión
    if (code) {
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error('[Auth Callback] Error intercambiando código por sesión:', sessionError)
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Error al crear sesión')}`)
      }

      // Obtener el usuario autenticado
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !authUser) {
        console.error('[Auth Callback] Error obteniendo usuario:', userError)
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Error al obtener datos del usuario')}`)
      }

      // Buscar el usuario en la tabla users por email
      // Esto permite que usuarios registrados con email puedan acceder con Google usando el mismo perfil
      let user = await getUserByEmail(authUser.email!)

      // Si el usuario no existe en la tabla users, crearlo
      if (!user) {
        console.log('[Auth Callback] Usuario no encontrado, creando nuevo usuario...')
        try {
          // Crear usuario con rol por defecto (Usuario)
          // En producción, podrías querer asignar un rol diferente o requerir aprobación
          user = await createUser({
            email: authUser.email!,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email!.split('@')[0],
            role: Role.USER, // Rol por defecto
            phone: authUser.user_metadata?.phone || undefined,
          })
          console.log('[Auth Callback] Usuario creado exitosamente:', user.email)
        } catch (createError) {
          // Si hay un error al crear (por ejemplo, usuario duplicado), intentar buscar nuevamente
          if (createError instanceof Error && createError.message.includes('Ya existe')) {
            console.log('[Auth Callback] Usuario ya existe, buscando nuevamente...')
            user = await getUserByEmail(authUser.email!)
            if (!user) {
              throw createError
            }
          } else {
            console.error('[Auth Callback] Error creando usuario:', createError)
            const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Error al crear usuario en el sistema')}`)
          }
        }
      } else {
        console.log('[Auth Callback] Usuario existente encontrado - accediendo al mismo perfil:', user.email)
        console.log('[Auth Callback] Datos del usuario:', { id: user.id, name: user.name, role: user.role })
        
        // Opcional: Actualizar el nombre si viene de Google y es diferente
        // Esto es útil si el usuario cambió su nombre en Google
        const googleName = authUser.user_metadata?.full_name || authUser.user_metadata?.name
        if (googleName && googleName !== user.name) {
          console.log('[Auth Callback] Nombre de Google diferente, actualizando...', { 
            actual: user.name, 
            nuevo: googleName 
          })
          // No actualizamos automáticamente para evitar sobrescribir cambios manuales
          // Si quieres actualizar automáticamente, descomenta las siguientes líneas:
          /*
          try {
            const { updateUser } = await import('@/services/userService')
            user = await updateUser(user.id, { name: googleName })
            console.log('[Auth Callback] Nombre actualizado exitosamente')
          } catch (updateError) {
            console.warn('[Auth Callback] No se pudo actualizar el nombre:', updateError)
            // Continuar con el usuario original si falla la actualización
          }
          */
        }
      }

      // Redirigir a la aplicación con los datos del usuario en la URL (será leído por el cliente)
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }))

      // Redirigir a la página principal con los datos del usuario
      return NextResponse.redirect(`${origin}?googleAuth=true&user=${userData}`)
    }

    // Si no hay código, redirigir a la página principal con error
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Código de autorización no encontrado')}`)
  } catch (error) {
    console.error('[Auth Callback] Error inesperado:', error)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${origin}?error=${encodeURIComponent('Error interno del servidor')}`)
  }
}

