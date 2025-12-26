import { createClient, createMockClient } from "@/lib/supabase/client"
import { Ticket, Priority, Status } from "@/types"
import { getColombiaTimestamp } from "@/utils/colombiaTime"

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

export const ticketServiceClient = {
  async fallbackToMockClient(): Promise<Ticket[]> {
    console.log("[v0] Attempting fallback to mock client...")
    try {
      const mockSupabase = createMockClient()
      const { data: mockData, error: mockError } = await mockSupabase
        .from("tickets")
        .select(`
          *,
          assigned_user:assigned_to(name, email),
          creator:created_by(name, email)
        `)
        .order("created_at", { ascending: false })

      if (mockError) {
         console.error("[v0] Mock client also failed:", mockError)
         return []
      }

      const normalized = (mockData || []).map((t: any) => ({
        ...t,
        requester_id: t.requester_id ?? t.created_by,
        priority: fromDbPriority(t.priority),
      }))
      return normalized
    } catch (mockCatchError) {
       console.error("[v0] Mock client exception:", mockCatchError)
       return []
    }
  },
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const supabase = createClient()

      // Intentar primero con las relaciones
      let { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          assigned_user:assigned_to(name, email),
          creator:created_by(name, email)
        `)
        .order("created_at", { ascending: false })

      // Si hay error de relación, intentar sin las relaciones y hacer joins manuales
      if (error && error.message?.includes("relationship")) {
        console.warn("[v0] Relationship error, trying manual joins:", error.message)
        
        // Obtener tickets sin relaciones
        const { data: ticketsData, error: ticketsError } = await supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false })

        if (ticketsError) {
          console.error("[v0] Error fetching tickets without relations:", ticketsError)
          return this.fallbackToMockClient()
        }

        // Obtener todos los usuarios para hacer join manual
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, email")

        if (usersError) {
          console.error("[v0] Error fetching users:", usersError)
          return this.fallbackToMockClient()
        }

        // Hacer join manual
        data = (ticketsData || []).map((ticket: any) => ({
          ...ticket,
          assigned_user: ticket.assigned_to 
            ? usersData?.find((u: any) => u.id === ticket.assigned_to) || null
            : null,
          creator: ticket.created_by 
            ? usersData?.find((u: any) => u.id === ticket.created_by) || null
            : null
        }))
        
        error = null // Limpiar el error ya que lo resolvimos
      }

      if (error) {
        console.error("[v0] Error fetching tickets:", error)
        return this.fallbackToMockClient()
      }

      const normalized = (data || []).map((t: any) => ({
        ...t,
        requester_id: t.requester_id ?? t.created_by,
        priority: fromDbPriority(t.priority),
      }))
      return normalized
    } catch (error) {
      console.error("[v0] Database connection error:", error)
      console.log("[v0] Attempting fallback to mock client after exception...")
      try {
        const mockSupabase = createMockClient()
        const { data: mockData, error: mockError } = await mockSupabase
          .from("tickets")
          .select(`
            *,
            assigned_user:assigned_to(name, email),
            creator:created_by(name, email)
          `)
          .order("created_at", { ascending: false })

        if (mockError) {
           console.error("[v0] Mock client also failed:", mockError)
           return []
        }

        const normalized = (mockData || []).map((t: any) => ({
          ...t,
          requester_id: t.requester_id ?? t.created_by,
          priority: fromDbPriority(t.priority),
        }))
        return normalized
      } catch (mockCatchError) {
         console.error("[v0] Mock client exception:", mockCatchError)
         return []
      }
    }
  },

  async createTicket(ticketData: CreateTicketData): Promise<Ticket> {
    const supabase = createClient()

    const payload: any = {
      title: ticketData.title,
      description: ticketData.description,
      priority: toDbPriority(ticketData.priority),
      status: Status.OPEN,
      category: ticketData.category,
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

    // Si hay error de relación, intentar sin las relaciones y hacer joins manuales
    if (error && error.message?.includes("relationship")) {
      console.warn("[v0] Relationship error in createTicket, trying without relations:", error.message)
      
      // Crear ticket sin relaciones
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .insert([payload])
        .select("*")
        .single()

      if (ticketError) {
        console.error("[v0] Error creating ticket without relations:", ticketError)
      } else {
        // Obtener usuarios relacionados para hacer join manual
        const userIds = [ticketData.assigned_to, ticketData.created_by].filter(Boolean)
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", userIds)

        // Hacer join manual
        data = {
          ...ticketData,
          assigned_user: ticketData.assigned_to 
            ? usersData?.find((u: any) => u.id === ticketData.assigned_to) || null
            : null,
          creator: ticketData.created_by 
            ? usersData?.find((u: any) => u.id === ticketData.created_by) || null
            : null
        }
        
        error = null // Limpiar el error ya que lo resolvimos
      }
    }

    if (error) {
      console.error("[v0] Error creating ticket:", error)
      console.log("[v0] Attempting fallback to mock client for creation...")
      try {
        const mockSupabase = createMockClient()
        const { data: mockData, error: mockError } = await mockSupabase
          .from("tickets")
          .insert([payload])
          .select()
          .single()

        if (mockError) {
          console.error("[v0] Mock client creation failed:", mockError)
          throw new Error("Error al crear ticket (mock)")
        }

        const normalized = {
          ...(mockData as any),
          requester_id: (mockData as any).requester_id ?? (mockData as any).created_by,
          priority: fromDbPriority((mockData as any).priority),
        }
        return normalized
      } catch (mockException) {
        console.error("[v0] Mock client exception during creation:", mockException)
        throw new Error("Error al crear ticket")
      }
    }

    const normalized = {
      ...(data as any),
      requester_id: (data as any).requester_id ?? (data as any).created_by,
      priority: fromDbPriority((data as any).priority),
    }
    return normalized
  },

  async updateTicket(id: string, ticketData: UpdateTicketData): Promise<Ticket> {
    const supabase = createClient()

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
  },

  async deleteTicket(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from("tickets").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting ticket:", error)
      throw new Error("Error al eliminar ticket")
    }
  },
}
