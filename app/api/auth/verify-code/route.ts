import { NextRequest, NextResponse } from 'next/server'
import { verifyOTPCode } from '@/services/otpService'
import { getUserByEmail } from '@/services/userService'

/**
 * Endpoint para verificar código OTP
 * POST /api/auth/verify-code
 * 
 * Si el código es válido, devuelve información del usuario (sin password)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Código es requerido' },
        { status: 400 }
      )
    }

    // Verificar el código OTP
    const isValid = verifyOTPCode(email, code)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código inválido o expirado. Por favor solicita un nuevo código.' },
        { status: 400 }
      )
    }

    // Si el código es válido, obtener el usuario
    const user = await getUserByEmail(email)

    if (!user) {
      // Esto no debería pasar si el código fue válido y el usuario existe
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Devolver información del usuario (sin datos sensibles)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })

  } catch (error) {
    console.error('[Auth] Error verificando código:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

