"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { userServiceClient } from '@/services/userService'
import { Role } from '@/types'

/**
 * Componente interno que maneja la lógica del callback
 */
function AuthCallbackContent() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createBrowserClient()
        
        // Obtener los tokens del hash fragment (Supabase los pasa así)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // Si hay un error en el proceso de OAuth
        if (errorParam) {
          console.error('[Auth Callback] Error de OAuth:', errorParam, errorDescription)
          setError(errorDescription || 'Error al autenticar con Google')
          setIsLoading(false)
          // Redirigir a la página principal con error después de 3 segundos
          setTimeout(() => {
            router.push(`/?error=${encodeURIComponent(errorDescription || 'Error al autenticar con Google')}`)
          }, 3000)
          return
        }

        // Si no hay tokens, redirigir con error
        if (!accessToken) {
          setError('No se recibieron tokens de autenticación')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/?error=' + encodeURIComponent('No se recibieron tokens de autenticación'))
          }, 3000)
          return
        }

        // Establecer la sesión en Supabase con los tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('[Auth Callback] Error estableciendo sesión:', sessionError)
          setError('Error al establecer sesión')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/?error=' + encodeURIComponent('Error al establecer sesión'))
          }, 3000)
          return
        }

        // Obtener el usuario autenticado
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !authUser) {
          console.error('[Auth Callback] Error obteniendo usuario:', userError)
          setError('Error al obtener datos del usuario')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/?error=' + encodeURIComponent('Error al obtener datos del usuario'))
          }, 3000)
          return
        }

        // Buscar el usuario en la tabla users por email usando el cliente del navegador
        // Esto permite que usuarios registrados con email puedan acceder con Google usando el mismo perfil
        let user = await userServiceClient.getUserByEmail(authUser.email!)

        // Si el usuario no existe en la tabla users, crearlo
        if (!user) {
          console.log('[Auth Callback] Usuario no encontrado, creando nuevo usuario...')
          try {
            // Crear usuario con rol por defecto (Usuario)
            user = await userServiceClient.createUser({
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
              user = await userServiceClient.getUserByEmail(authUser.email!)
              if (!user) {
                throw createError
              }
            } else {
              console.error('[Auth Callback] Error creando usuario:', createError)
              setError('Error al crear usuario en el sistema')
              setIsLoading(false)
              setTimeout(() => {
                router.push('/?error=' + encodeURIComponent('Error al crear usuario en el sistema'))
              }, 3000)
              return
            }
          }
        } else {
          console.log('[Auth Callback] Usuario existente encontrado - accediendo al mismo perfil:', user.email)
        }

        // Redirigir a la página principal con los datos del usuario en la URL
        const userData = encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }))

        router.push(`/?googleAuth=true&user=${userData}`)
      } catch (error) {
        console.error('[Auth Callback] Error inesperado:', error)
        setError('Error interno del servidor')
        setIsLoading(false)
        setTimeout(() => {
          router.push('/?error=' + encodeURIComponent('Error interno del servidor'))
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  // Mostrar mensaje de carga o error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-2xl rounded-2xl border border-gray-100 text-center">
        {isLoading ? (
          <>
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="animate-spin h-8 w-8 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Procesando autenticación...</h2>
            <p className="text-gray-600">Por favor espera mientras completamos tu inicio de sesión.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Error de autenticación</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-gray-600 text-sm mt-4">Serás redirigido en unos momentos...</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

