import { createClient } from "@/lib/supabase/client"
import { User } from "@/types"

export interface ActivityEvent {
  id: string
  type: 'comment' | 'assignment' | 'status_change' | 'creation' | 'transfer'
  ticket_id: string
  user_id: string
  user_name: string
  description: string
  metadata?: any
  created_at: string
}

export interface CreateActivityData {
  type: 'comment' | 'assignment' | 'status_change' | 'creation' | 'transfer'
  ticket_id: string
  user_id: string
  description: string
  metadata?: any
}

// Client-side functions for browser usage
export const activityService = {
  async createActivity(activityData: CreateActivityData): Promise<ActivityEvent> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("activity_log")
      .insert([activityData])
      .select(`
        *,
        user:user_id(name, email)
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating activity:", error)
      throw new Error("Error al crear actividad")
    }

    return {
      ...data,
      user_name: data.user?.name || 'Usuario'
    }
  },

  async getActivityByTicket(ticketId: string): Promise<ActivityEvent[]> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("activity_log")
        .select(`
          *,
          user:user_id(name, email)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching activity:", error)
        return []
      }

      return (data || []).map((activity: any) => ({
        ...activity,
        user_name: activity.user?.name || 'Usuario'
      }))
    } catch (error) {
      console.error("[v0] Error fetching activity (exception):", error)
      return []
    }
  },

  async deleteActivity(activityId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from("activity_log")
      .delete()
      .eq("id", activityId)

    if (error) {
      console.error("[v0] Error deleting activity:", error)
      throw new Error("Error al eliminar actividad")
    }
  }
}

// Funciones auxiliares para crear eventos de actividad
export const createActivityEvents = {
  comment: (ticketId: string, userId: string, commentText: string) => ({
    type: 'comment' as const,
    ticket_id: ticketId,
    user_id: userId,
    description: `Agregó un comentario: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    metadata: { comment_text: commentText }
  }),

  assignment: (ticketId: string, userId: string, assignedToUserId: string, assignedToUserName: string) => ({
    type: 'assignment' as const,
    ticket_id: ticketId,
    user_id: userId,
    description: `Asignó el ticket a ${assignedToUserName}`,
    metadata: { assigned_to_user_id: assignedToUserId, assigned_to_user_name: assignedToUserName }
  }),

  statusChange: (ticketId: string, userId: string, oldStatus: string, newStatus: string) => ({
    type: 'status_change' as const,
    ticket_id: ticketId,
    user_id: userId,
    description: `Cambió el estado de "${oldStatus}" a "${newStatus}"`,
    metadata: { old_status: oldStatus, new_status: newStatus }
  }),

  creation: (ticketId: string, userId: string, ticketTitle: string) => ({
    type: 'creation' as const,
    ticket_id: ticketId,
    user_id: userId,
    description: `Creó el ticket: "${ticketTitle}"`,
    metadata: { ticket_title: ticketTitle }
  }),

  transfer: (ticketId: string, userId: string, fromLevel: string, toLevel: string, toUserName: string) => ({
    type: 'transfer' as const,
    ticket_id: ticketId,
    user_id: userId,
    description: `Transfirió de ${fromLevel} a ${toLevel} (${toUserName})`,
    metadata: { from_level: fromLevel, to_level: toLevel, to_user_name: toUserName }
  })
}
