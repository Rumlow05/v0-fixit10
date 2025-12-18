import { createClient } from "@/lib/supabase/client"
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
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const supabase = createClient()

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

    const { data, error } = await supabase
      .from("tickets")
      .insert([payload])
      .select(`
        *,
        assigned_user:assigned_to(name, email),
        creator:created_by(name, email)
      `)
      .single()

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
