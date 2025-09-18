import { createClient } from "@/lib/supabase/client"
import { Comment } from "@/types"

export interface CreateCommentData {
  ticket_id: string
  user_id: string
  content: string
}

// Client-side functions for browser usage
export const commentService = {
  async createComment(commentData: CreateCommentData): Promise<Comment> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .insert([commentData])
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Error creating comment:", error)
      throw new Error("Error al crear comentario")
    }

    return data
  },

  async getCommentsByTicket(ticketId: string): Promise<Comment[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        user:user_id(name, email)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching comments:", error)
      return []
    }

    return data || []
  },

  async deleteComment(commentId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)

    if (error) {
      console.error("[v0] Error deleting comment:", error)
      throw new Error("Error al eliminar comentario")
    }
  }
}
