import { NextRequest, NextResponse } from 'next/server'
import { generateOTPCode } from '@/services/otpService'
import { emailService } from '@/services/emailService'
import { getUserByEmail } from '@/services/userService'

/**
 * Endpoint para enviar código de verificación OTP por email
 * POST /api/auth/send-verification-code
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el email tenga formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario exista en la base de datos
    const user = await getUserByEmail(email)
    if (!user) {
      // No revelar si el usuario existe o no por seguridad
      // Devolver éxito siempre para evitar enumeración de usuarios
      return NextResponse.json({
        success: true,
        message: 'Si el email está registrado, recibirás un código de verificación'
      })
    }

    // Generar código OTP
    const code = generateOTPCode(email)

    // Enviar código por email
    const emailSent = await emailService.sendVerificationCode(email, code)

    if (!emailSent) {
      console.error('[Auth] Error enviando código de verificación a:', email)
      return NextResponse.json(
        { error: 'Error al enviar código de verificación. Por favor intenta nuevamente.' },
        { status: 500 }
      )
    }

    console.log('[Auth] Código de verificación enviado a:', email)

    // Siempre devolver éxito (no revelar si el usuario existe)
    return NextResponse.json({
      success: true,
      message: 'Si el email está registrado, recibirás un código de verificación en tu correo'
    })

  } catch (error) {
    console.error('[Auth] Error inesperado enviando código:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

