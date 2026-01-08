import { createClient } from "@/lib/supabase/server"
import { Ticket, Priority, Status } from "@/types"
import { getColombiaTimestamp } from "@/utils/colombiaTime"

// Re-export types from types.ts
export { type Ticket, Priority, Status }

function toDbPriority(priority: Priority): string {
  return priority === Priority.CRITICAL ? "Urgente" : priority
}

function fromDbPriority(priority: string): Priority {
  return priority === "Urgente" ? Priority.CRITICAL : (priority as Priority)
}

export interface CreateTicketData {
  title: string
  description: string
  priority: Priority
  category: string
  assigned_to?: string
  requester_id: string
  origin?: 'Interna' | 'Externa'
  external_company?: string
  external_contact?: string
}

export interface UpdateTicketData {
  title?: string
  description?: string
  priority?: Priority
  status?: Status
  category?: string
  assigned_to?: string
  resolution_notes?: string
  resolved_at?: string
}

// Server-side functions
export async function getAllTickets(): Promise<Ticket[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        assigned_user:assigned_to(name, email),
        creator:created_by(name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching tickets:", error)
      return []
    }

    const normalized = (data || []).map((t: any) => ({
      ...t,
      requester_id: t.requester_id ?? t.created_by,
      priority: fromDbPriority(t.priority),
    }))
    return normalized
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    return []
  }
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:created_by(name, email)
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Ticket not found
    }
    console.error("[v0] Error fetching ticket:", error)
    throw new Error("Error al obtener ticket")
  }

  return data
    ? {
        ...(data as any),
        requester_id: (data as any).requester_id ?? (data as any).created_by,
        priority: fromDbPriority((data as any).priority),
      }
    : null
}

export async function createTicket(ticketData: CreateTicketData): Promise<Ticket> {
  const supabase = await createClient()

  const payload: any = {
    title: ticketData.title,
    description: ticketData.description,
    priority: toDbPriority(ticketData.priority),
    status: Status.OPEN,
    category: ticketData.category || 'Otro', // Categoría por defecto si no se proporciona
    assigned_to: ticketData.assigned_to ?? null,
    created_by: ticketData.requester_id,
    origin: ticketData.origin ?? 'Interna',
    external_company: ticketData.external_company ?? null,
    external_contact: ticketData.external_contact ?? null,
  }

  // Intentar primero con las relaciones
  let { data, error } = await supabase
    .from("tickets")
    .insert([payload])
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:created_by(name, email)
    `)
    .single()

  // Si hay error, intentar sin las relaciones y hacer joins manuales
  if (error) {
    console.warn("[v0] Error in createTicket (server), trying without relations:", error.message, "code:", error.code)
    
    // Crear ticket sin relaciones
    const { data: ticketDataWithoutRelations, error: ticketError } = await supabase
      .from("tickets")
      .insert([payload])
      .select("*")
      .single()

    if (ticketError) {
      console.error("[v0] Error creating ticket without relations (server):", ticketError)
      throw new Error("Error al crear ticket")
    }

    // Obtener usuarios relacionados para hacer join manual
    const userIds = [ticketDataWithoutRelations.assigned_to, ticketDataWithoutRelations.created_by].filter(Boolean)
    let usersData: any[] = []
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds)
      usersData = users || []
    }

    // Hacer join manual
    data = {
      ...ticketDataWithoutRelations,
      assigned_user: ticketDataWithoutRelations.assigned_to 
        ? usersData.find((u: any) => u.id === ticketDataWithoutRelations.assigned_to) || null
        : null,
      creator: ticketDataWithoutRelations.created_by 
        ? usersData.find((u: any) => u.id === ticketDataWithoutRelations.created_by) || null
        : null
    }
    
    error = null // Limpiar el error ya que lo resolvimos
  }

  if (error) {
    console.error("[v0] Error creating ticket:", error)
    throw new Error("Error al crear ticket")
  }

  const normalized = {
    ...(data as any),
    requester_id: (data as any).requester_id ?? (data as any).created_by,
    priority: fromDbPriority((data as any).priority),
  }
  return normalized
}

export async function updateTicket(id: string, ticketData: UpdateTicketData): Promise<Ticket> {
  const supabase = await createClient()

  const payload: any = { ...ticketData }

  // If status is being changed to resolved, set resolved_at
  if (ticketData.status === Status.RESOLVED) {
    payload.resolved_at = getColombiaTimestamp()
  }

  if (ticketData.priority) {
    payload.priority = toDbPriority(ticketData.priority)
  }

  const { data, error } = await supabase
    .from("tickets")
    .update(payload)
    .eq("id", id)
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:created_by(name, email)
    `)
    .single()

  if (error) {
    console.error("[v0] Error updating ticket:", error)
    throw new Error("Error al actualizar ticket")
  }

  const normalized = {
    ...(data as any),
    requester_id: (data as any).requester_id ?? (data as any).created_by,
    priority: fromDbPriority((data as any).priority),
  }
  return normalized
}

export async function deleteTicket(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("tickets").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting ticket:", error)
    throw new Error("Error al eliminar ticket")
  }
}

export async function getTicketsByUser(userId: string): Promise<Ticket[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:created_by(name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user tickets:", error)
    throw new Error("Error al obtener tickets del usuario")
  }

  const all = (data || []).map((t: any) => ({
    ...t,
    requester_id: t.requester_id ?? t.created_by,
    priority: fromDbPriority(t.priority),
  }))
  return all.filter((t: any) => t.requester_id === userId || t.assigned_to === userId)
}
