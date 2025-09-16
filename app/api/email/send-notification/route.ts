import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "../../../../services/emailService"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ticketData, recipientEmail, updateType } = body

    if (!recipientEmail || !ticketData) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    let success = false

    switch (type) {
      case "ticket-created":
        success = await emailService.sendTicketCreatedNotification(ticketData, recipientEmail)
        break

      case "ticket-updated":
        success = await emailService.sendTicketUpdatedNotification(
          ticketData,
          recipientEmail,
          updateType || "Actualización",
        )
        break

      case "welcome":
        success = await emailService.sendWelcomeEmail(recipientEmail, ticketData.userName)
        break

      default:
        return NextResponse.json({ error: "Tipo de notificación no válido" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ message: "Email enviado exitosamente" })
    } else {
      return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Email API] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
