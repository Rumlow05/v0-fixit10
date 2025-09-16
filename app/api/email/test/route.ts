import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "../../../../services/emailService"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Enviar email de prueba
    const testTicketData = {
      ticketId: "TEST-001",
      title: "Ticket de Prueba",
      description: "Este es un ticket de prueba para verificar el sistema de notificaciones.",
      priority: "Media",
      status: "Abierto",
      createdBy: "Sistema FixIT",
      createdAt: new Date().toISOString(),
    }

    const success = await emailService.sendTicketCreatedNotification(testTicketData, email)

    if (success) {
      return NextResponse.json({
        message: "Email de prueba enviado exitosamente",
        testData: testTicketData,
      })
    } else {
      return NextResponse.json({ error: "Error al enviar el email de prueba" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Email Test API] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
