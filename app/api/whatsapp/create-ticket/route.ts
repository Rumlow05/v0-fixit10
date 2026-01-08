import { type NextRequest, NextResponse } from "next/server"
import { createTicket } from "@/services/ticketService"
import { Priority } from "@/types"
import { emailService } from "@/services/emailService"

// Simple API key validation for WhatsApp bot
const WHATSAPP_BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY || "fixit-whatsapp-bot-2024"

interface WhatsAppTicketData {
  // Campos obligatorios
  title: string
  description: string
  
  // Identificación del usuario (una de las dos opciones)
  whatsapp_user_id?: string // remoteJid del usuario de WhatsApp
  requester_email?: string // Email del usuario registrado en el sistema
  whatsapp_user_name?: string // Nombre del usuario si está disponible
  
  // Campos opcionales con valores por defecto
  priority?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  category?: string
  
  // Campos de IA (opcionales)
  ai_summary?: string
  ai_classification?: {
    priority?: string
    category?: string
  }
  
  // Metadatos del mensaje de WhatsApp
  message_id?: string // Para idempotencia
  timestamp?: string
  
  // Adjuntos (opcional)
  attachments?: Array<{
    type: 'audio' | 'image' | 'document' | 'text'
    content?: string // Transcripción de audio o texto
    url?: string // URL si es imagen/documento
    metadata?: any
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Validar API Key
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== WHATSAPP_BOT_API_KEY) {
      return NextResponse.json({ 
        error: "API key inválida o faltante",
        message: "Incluye 'x-api-key' en headers o 'Authorization: Bearer <key>'"
      }, { status: 401 })
    }

    const ticketData: WhatsAppTicketData = await request.json()

    // Validar campos obligatorios
    if (!ticketData.title || !ticketData.description || (!ticketData.whatsapp_user_id && !ticketData.requester_email)) {
      return NextResponse.json({ 
        error: "Campos obligatorios faltantes",
        required: ["title", "description", "whatsapp_user_id OR requester_email"],
        received: Object.keys(ticketData)
      }, { status: 400 })
    }

    // Verificar idempotencia si se proporciona message_id
    if (ticketData.message_id) {
      // Aquí podrías verificar si ya existe un ticket con este message_id
      // Por simplicidad, asumimos que el bot maneja la idempotencia
    }

    // Buscar usuario por email o crear usuario basado en WhatsApp ID
    let userId: string
    let ticketOrigin: 'Interna' | 'Externa' = 'Externa'
    let externalCompany: string | null = 'WhatsApp Bot'
    let externalContact: string | null = ticketData.whatsapp_user_name || ticketData.whatsapp_user_id || null
    
    if (ticketData.requester_email) {
      // Buscar usuario existente por email
      const foundUserId = await findUserByEmail(ticketData.requester_email)
      if (foundUserId) {
        // El email está en el sistema, clasificar como Interna
        userId = foundUserId
        ticketOrigin = 'Interna'
        externalCompany = null
        externalContact = null
      } else {
        // El email NO está en el sistema, crear usuario con el email real y clasificar como Externa
        userId = await createExternalUser(
          ticketData.requester_email,
          ticketData.whatsapp_user_name,
          ticketData.whatsapp_user_id
        )
        ticketOrigin = 'Externa'
        externalCompany = 'WhatsApp Bot'
        externalContact = ticketData.whatsapp_user_name || ticketData.requester_email
      }
    } else {
      // No hay email, crear usuario basado en WhatsApp ID y clasificar como Externa
      userId = await findOrCreateWhatsAppUser(
        ticketData.whatsapp_user_id!, 
        ticketData.whatsapp_user_name
      )
      ticketOrigin = 'Externa'
      externalCompany = 'WhatsApp Bot'
      externalContact = ticketData.whatsapp_user_name || ticketData.whatsapp_user_id
    }

    // Preparar datos del ticket
    const createTicketPayload = {
      title: ticketData.title,
      description: buildTicketDescription(ticketData),
      priority: mapPriority(ticketData.priority || ticketData.ai_classification?.priority || 'Media'),
      category: ticketData.category || ticketData.ai_classification?.category || 'WhatsApp',
      requester_id: userId,
      origin: ticketOrigin,
      external_company: externalCompany,
      external_contact: externalContact,
    }

    // Crear ticket
    const ticket = await createTicket(createTicketPayload)

    // Enviar notificación por email (opcional)
    try {
      const user = await getUserById(userId)
      if (user?.email) {
        await emailService.sendTicketCreatedNotification({
          ticketId: ticket.id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          createdBy: user.name,
          createdAt: ticket.created_at,
          phoneNumber: (user as any).phone // Para WhatsApp
        }, user.email)
      }
    } catch (emailError) {
      console.warn("[WhatsApp API] Error sending email notification:", emailError)
      // No fallar por error de email
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: ticket.created_at,
        ticket_url: `https://dashboard.emprendetucarrera.com.co/tickets/${ticket.id}`
      },
      message: `Ticket #${ticket.id} creado exitosamente`,
      whatsapp_response: `✅ *Ticket Creado*\n\n🎫 *ID:* ${ticket.id}\n📋 *Título:* ${ticket.title}\n⚡ *Prioridad:* ${ticket.priority}\n📊 *Estado:* ${ticket.status}\n\nTu solicitud ha sido registrada y será atendida por nuestro equipo de soporte.`
    }, { status: 201 })

  } catch (error) {
    console.error("[WhatsApp API] Error creating ticket:", error)
    
    return NextResponse.json({ 
      success: false,
      error: "Error interno del servidor",
      message: "No se pudo crear el ticket. Intenta nuevamente.",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

// Función auxiliar para construir descripción del ticket
// Muestra exactamente lo que viene en el campo description
function buildTicketDescription(data: WhatsAppTicketData): string {
  return data.description || ''
}

// Función auxiliar para mapear prioridades
function mapPriority(priority: string): Priority {
  const priorityMap: { [key: string]: Priority } = {
    'baja': Priority.LOW,
    'media': Priority.MEDIUM,
    'alta': Priority.HIGH,
    'crítica': Priority.CRITICAL,
    'critica': Priority.CRITICAL,
    'low': Priority.LOW,
    'medium': Priority.MEDIUM,
    'high': Priority.HIGH,
    'critical': Priority.CRITICAL
  }
  
  return priorityMap[priority.toLowerCase()] || Priority.MEDIUM
}

// Función auxiliar para buscar usuario por email
async function findUserByEmail(email: string): Promise<string | null> {
  try {
    const { userServiceClient } = await import("@/services/userService")
    const users = await userServiceClient.getAllUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (user) {
      console.log(`[WhatsApp API] Usuario encontrado por email: ${email} -> ${user.id}`)
      return user.id
    }
    
    console.log(`[WhatsApp API] Usuario no encontrado por email: ${email}`)
    return null
  } catch (error) {
    console.error("[WhatsApp API] Error buscando usuario por email:", error)
    return null
  }
}

// Función auxiliar para crear usuario externo con email real
async function createExternalUser(email: string, name?: string, whatsappId?: string): Promise<string> {
  // Importar servicios de usuario
  const { userServiceClient } = await import("@/services/userService")
  
  try {
    // Verificar si ya existe un usuario con este email
    const users = await userServiceClient.getAllUsers()
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (existingUser) {
      return existingUser.id
    }
    
    // Crear nuevo usuario externo con el email real
    const newUser = await userServiceClient.createUser({
      name: name || email.split('@')[0],
      email: email,
      phone: whatsappId || null, // Guardar el WhatsApp ID si está disponible
      role: 'Usuario' as any
    })
    
    console.log(`[WhatsApp API] Usuario externo creado: ${email} -> ${newUser.id}`)
    return newUser.id
  } catch (error) {
    console.error("[WhatsApp API] Error creating external user:", error)
    throw new Error("Error al crear usuario externo")
  }
}

// Función auxiliar para encontrar o crear usuario de WhatsApp (sin email)
async function findOrCreateWhatsAppUser(whatsappId: string, name?: string): Promise<string> {
  // Importar servicios de usuario
  const { userServiceClient } = await import("@/services/userService")
  
  try {
    // Buscar usuario existente por email (usando WhatsApp ID como email)
    const email = `${whatsappId.replace('@', '_at_')}@whatsapp.bot`
    const users = await userServiceClient.getAllUsers()
    const existingUser = users.find(u => u.email === email)
    
    if (existingUser) {
      return existingUser.id
    }
    
    // Crear nuevo usuario
    const newUser = await userServiceClient.createUser({
      name: name || `Usuario WhatsApp ${whatsappId.split('@')[0]}`,
      email: email,
      phone: whatsappId, // Guardar el WhatsApp ID en el campo phone
      role: 'Usuario' as any
    })
    
    return newUser.id
  } catch (error) {
    console.error("[WhatsApp API] Error managing user:", error)
    throw new Error("Error al gestionar usuario de WhatsApp")
  }
}

// Función auxiliar para obtener usuario por ID
async function getUserById(userId: string) {
  try {
    const { userServiceClient } = await import("@/services/userService")
    return await userServiceClient.getUserById(userId)
  } catch (error) {
    console.warn("[WhatsApp API] Error getting user:", error)
    return null
  }
}
