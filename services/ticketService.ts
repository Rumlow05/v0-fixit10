import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { Ticket, Priority, Status } from "@/types"

// Re-export types from types.ts
export { Ticket, Priority, Status }

export interface CreateTicketData {
  title: string
  description: string
  priority: Priority
  category: string
  assigned_to?: string
  requester_id: string
}

export interface UpdateTicketData {
  title?: string
  description?: string
  priority?: Priority
  status?: Status
  category?: string
  assigned_to?: string
  resolution_notes?: string
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
        creator:requester_id(name, email),
      comments:comments(*, user:user_id(name, email))
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching tickets:", error)
      return []
    }

    return data || []
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
      creator:requester_id(name, email)
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
}

export async function createTicket(ticketData: CreateTicketData): Promise<Ticket> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tickets")
    .insert([ticketData])
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:requester_id(name, email)
    `)
    .single()

  if (error) {
    console.error("[v0] Error creating ticket:", error)
    throw new Error("Error al crear ticket")
  }

  return data
}

export async function updateTicket(id: string, ticketData: UpdateTicketData): Promise<Ticket> {
  const supabase = await createClient()

  // If status is being changed to resolved, set resolved_at
  if (ticketData.status === "resuelto") {
    ticketData = {
      ...ticketData,
      resolved_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from("tickets")
    .update(ticketData)
    .eq("id", id)
    .select(`
      *,
      assigned_user:assigned_to(name, email),
      creator:requester_id(name, email)
    `)
    .single()

  if (error) {
    console.error("[v0] Error updating ticket:", error)
    throw new Error("Error al actualizar ticket")
  }

  return data
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
      creator:requester_id(name, email)
    `)
    .or(`requester_id.eq.${userId},assigned_to.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user tickets:", error)
    throw new Error("Error al obtener tickets del usuario")
  }

  return data || []
}

// Client-side functions for browser usage
export const ticketServiceClient = {
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          assigned_user:assigned_to(name, email),
          creator:requester_id(name, email),
      comments:comments(*, user:user_id(name, email))
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching tickets:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database connection error:", error)
      return []
    }
  },

  async createTicket(ticketData: CreateTicketData): Promise<Ticket> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("tickets")
      .insert([ticketData])
      .select(`
        *,
        assigned_user:assigned_to(name, email),
        creator:requester_id(name, email),
      comments:comments(*, user:user_id(name, email))
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating ticket:", error)
      throw new Error("Error al crear ticket")
    }

    return data
  },

  async updateTicket(id: string, ticketData: UpdateTicketData): Promise<Ticket> {
    const supabase = createBrowserClient()

    // If status is being changed to resolved, set resolved_at
    if (ticketData.status === "resuelto") {
      ticketData = {
        ...ticketData,
        resolved_at: new Date().toISOString(),
      }
    }

    const { data, error } = await supabase
      .from("tickets")
      .update(ticketData)
      .eq("id", id)
      .select(`
        *,
        assigned_user:assigned_to(name, email),
        creator:requester_id(name, email),
      comments:comments(*, user:user_id(name, email))
      `)
      .single()

    if (error) {
      console.error("[v0] Error updating ticket:", error)
      throw new Error("Error al actualizar ticket")
    }

    return data
  },

  async deleteTicket(id: string): Promise<void> {
    const supabase = createBrowserClient()

    const { error } = await supabase.from("tickets").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting ticket:", error)
      throw new Error("Error al eliminar ticket")
    }
  },
}
