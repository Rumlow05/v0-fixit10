import { type NextRequest, NextResponse } from "next/server"
import { updateTicket, getTicketById } from "@/services/ticketService"

// Simple API key validation for WhatsApp bot
const WHATSAPP_BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY || "fixit-whatsapp-bot-2024"

interface WhatsAppAssignTicketData {
  ticket_id: string
  assignee_email: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar API Key
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== WHATSAPP_BOT_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: "API key inválida o faltante",
        message: "Incluye 'x-api-key' en headers o 'Authorization: Bearer <key>'"
      }, { status: 401 })
    }

    const assignmentData: WhatsAppAssignTicketData = await request.json()

    // 2. Validar campos obligatorios
    if (!assignmentData.ticket_id || !assignmentData.assignee_email) {
      return NextResponse.json({ 
        success: false,
        error: "Campos obligatorios faltantes",
        message: "ticket_id y assignee_email son requeridos",
        required: ["ticket_id", "assignee_email"],
        received: Object.keys(assignmentData)
      }, { status: 400 })
    }

    // 3. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(assignmentData.assignee_email)) {
      return NextResponse.json({ 
        success: false,
        error: "Email inválido",
        message: `El formato del email '${assignmentData.assignee_email}' no es válido`
      }, { status: 400 })
    }

    // 4. Verificar que el ticket existe
    const existingTicket = await getTicketById(assignmentData.ticket_id)
    if (!existingTicket) {
      return NextResponse.json({ 
        success: false,
        error: "Ticket no encontrado",
        message: `No se encontró un ticket con ID: ${assignmentData.ticket_id}`
      }, { status: 404 })
    }

    // 5. Buscar usuario asignador por email
    const assigneeUserId = await findUserByEmail(assignmentData.assignee_email)
    if (!assigneeUserId) {
      return NextResponse.json({ 
        success: false,
        error: "Usuario asignador no encontrado",
        message: `No se encontró un usuario registrado con el email: ${assignmentData.assignee_email}`,
        suggestion: "Verifica que el usuario esté registrado en el sistema FixIT"
      }, { status: 404 })
    }

    // 6. Asignar el ticket
    const updatedTicket = await updateTicket(assignmentData.ticket_id, {
      assigned_to: assigneeUserId,
      status: 'En Progreso' as any // Cambiar estado a "En Progreso" cuando se asigna
    })

    // 7. Obtener información del usuario asignado para la respuesta
    const assigneeUser = await getUserById(assigneeUserId)

    // 8. Enviar notificación por email (opcional)
    try {
      if (assigneeUser?.email) {
        const { emailService } = await import("@/services/emailService")
        await emailService.sendTicketUpdatedNotification({
          ticketId: updatedTicket.id,
          title: updatedTicket.title,
          description: updatedTicket.description,
          priority: updatedTicket.priority,
          status: updatedTicket.status,
          assignedTo: assigneeUser.name,
          createdBy: existingTicket.creator?.name || 'Sistema',
          createdAt: updatedTicket.created_at,
          phoneNumber: (assigneeUser as any).phone // Para WhatsApp
        }, assigneeUser.email, "Asignación de Ticket")
      }
    } catch (emailError) {
      console.warn("[WhatsApp Assign API] Error sending email notification:", emailError)
      // No fallar por error de email
    }

    // 9. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "Ticket asignado exitosamente",
      ticket: {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assigned_to: assigneeUser?.name || assignmentData.assignee_email,
        assigned_email: assignmentData.assignee_email,
        updated_at: updatedTicket.updated_at,
        ticket_url: `https://dashboard.emprendetucarrera.com.co/tickets/${updatedTicket.id}`
      },
      whatsapp_response: `✅ *Ticket Asignado*\n\n🎫 *ID:* ${updatedTicket.id}\n📋 *Título:* ${updatedTicket.title}\n👤 *Asignado a:* ${assigneeUser?.name || assignmentData.assignee_email}\n📊 *Estado:* ${updatedTicket.status}\n⚡ *Prioridad:* ${updatedTicket.priority}\n\nEl ticket ha sido asignado exitosamente y el técnico ha sido notificado.`
    }, { status: 200 })

  } catch (error) {
    console.error("[WhatsApp Assign API] Error assigning ticket:", error)
    
    return NextResponse.json({ 
      success: false,
      error: "Error interno del servidor",
      message: "No se pudo asignar el ticket. Intenta nuevamente.",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

// Función auxiliar para buscar usuario por email
async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const { userServiceClient } = await import("@/services/userService")
    const users = await userServiceClient.getAllUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (user) {
      console.log(`[WhatsApp Assign API] Usuario encontrado por email: ${email} -> ${user.id}`)
      return user.id
    }
    
    console.log(`[WhatsApp Assign API] Usuario no encontrado por email: ${email}`)
    return null
  } catch (error) {
    console.error("[WhatsApp Assign API] Error buscando usuario por email:", error)
    return null
  }
}

// Función auxiliar para obtener usuario por ID
async function getUserById(userId: string) {
  try {
    const { userServiceClient } = await import("@/services/userService")
    return await userServiceClient.getUserById(userId)
  } catch (error) {
    console.warn("[WhatsApp Assign API] Error getting user:", error)
    return null
  }
}
