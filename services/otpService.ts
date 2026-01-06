/**
 * Servicio para manejar códigos OTP (One-Time Password) para verificación de email
 * Los códigos se almacenan en memoria con expiración de 10 minutos
 */

interface OtpCode {
  code: string
  email: string
  expiresAt: number // Timestamp en milisegundos
  attempts: number // Intentos de verificación fallidos
}

// Almacenamiento en memoria de los códigos OTP
// En producción, deberías usar Redis o una base de datos con expiración
const otpStore = new Map<string, OtpCode>()

// Configuración
const OTP_EXPIRATION_TIME = 10 * 60 * 1000 // 10 minutos en milisegundos
const MAX_ATTEMPTS = 5 // Máximo de intentos antes de invalidar el código
const OTP_LENGTH = 6 // Longitud del código (6 dígitos)

/**
 * Genera un código OTP aleatorio de 6 dígitos
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Limpia códigos expirados del almacenamiento
 */
function cleanExpiredCodes(): void {
  const now = Date.now()
  for (const [email, otpData] of otpStore.entries()) {
    if (otpData.expiresAt < now || otpData.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email)
    }
  }
}

/**
 * Genera y almacena un código OTP para un email
 * @param email Email del usuario
 * @returns Código OTP generado
 */
export function generateOTPCode(email: string): string {
  // Limpiar códigos expirados antes de generar uno nuevo
  cleanExpiredCodes()

  const code = generateOTP()
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME

  otpStore.set(email.toLowerCase(), {
    code,
    email: email.toLowerCase(),
    expiresAt,
    attempts: 0,
  })

  console.log(`[OTP Service] Código generado para ${email}: ${code} (expira en ${OTP_EXPIRATION_TIME / 1000 / 60} minutos)`)
  
  return code
}

/**
 * Verifica un código OTP para un email
 * @param email Email del usuario
 * @param code Código a verificar
 * @returns true si el código es válido, false en caso contrario
 */
export function verifyOTPCode(email: string, code: string): boolean {
  cleanExpiredCodes()

  const emailKey = email.toLowerCase()
  const otpData = otpStore.get(emailKey)

  if (!otpData) {
    console.log(`[OTP Service] No se encontró código OTP para ${email}`)
    return false
  }

  // Verificar si el código ha expirado
  if (otpData.expiresAt < Date.now()) {
    console.log(`[OTP Service] Código OTP expirado para ${email}`)
    otpStore.delete(emailKey)
    return false
  }

  // Verificar si se han excedido los intentos máximos
  if (otpData.attempts >= MAX_ATTEMPTS) {
    console.log(`[OTP Service] Se excedieron los intentos máximos para ${email}`)
    otpStore.delete(emailKey)
    return false
  }

  // Verificar el código
  if (otpData.code === code) {
    // Código válido, eliminar del almacenamiento
    otpStore.delete(emailKey)
    console.log(`[OTP Service] Código OTP verificado correctamente para ${email}`)
    return true
  } else {
    // Código incorrecto, incrementar intentos
    otpData.attempts++
    otpStore.set(emailKey, otpData)
    console.log(`[OTP Service] Código OTP incorrecto para ${email}. Intentos: ${otpData.attempts}/${MAX_ATTEMPTS}`)
    return false
  }
}

/**
 * Elimina un código OTP (útil para invalidar códigos manualmente)
 * @param email Email del usuario
 */
export function invalidateOTPCode(email: string): void {
  otpStore.delete(email.toLowerCase())
  console.log(`[OTP Service] Código OTP invalidado para ${email}`)
}

/**
 * Obtiene información sobre un código OTP (sin revelar el código)
 * @param email Email del usuario
 * @returns Información del código o null si no existe
 */
export function getOTPInfo(email: string): { expiresAt: number; attempts: number } | null {
  const otpData = otpStore.get(email.toLowerCase())
  if (!otpData) {
    return null
  }
  return {
    expiresAt: otpData.expiresAt,
    attempts: otpData.attempts,
  }
}

/**
 * Limpia todos los códigos OTP (útil para testing o mantenimiento)
 */
export function clearAllOTPCodes(): void {
  otpStore.clear()
  console.log('[OTP Service] Todos los códigos OTP han sido limpiados')
}

