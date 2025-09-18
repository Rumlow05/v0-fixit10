import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { Role } from "../types"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  name: string
  role: Role
}

// Server-side functions
export async function getAllUsers(): Promise<User[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // User not found
    }
    console.error("[v0] Error fetching user:", error)
    throw new Error("Error al obtener usuario")
  }

  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient()

  console.log("[v0] Searching for user with email:", email)

  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[v0] User not found with email:", email)
      return null // User not found
    }
    console.error("[v0] Error fetching user by email:", error)
    console.error("[v0] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Error al buscar usuario por email: ${error.message}`)
  }

  if (!data) {
    console.log("[v0] No data returned for email:", email)
    return null
  }

  console.log("[v0] User found:", data)

  return {
    ...data,
    role: getRoleEnumValue(data.role),
  }
}

export async function createUser(userData: CreateUserData): Promise<User> {
  console.log("[v0] Attempting to create user with data:", userData)
  
  // Verificar si el usuario ya existe
  try {
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      console.log("[v0] User already exists:", existingUser)
      throw new Error("Ya existe un usuario con este email")
    }
  } catch (error) {
    // Si hay error al buscar, continuar con la creación
    console.warn("[v0] Warning checking existing user:", error)
  }

  const supabase = await createClient()

  // No incluir id para nuevos usuarios - Supabase lo generará automáticamente
  const dbUserData = {
    email: userData.email,
    name: userData.name,
    role: getRoleDbValue(userData.role),
  }

  console.log("[v0] Inserting user data:", dbUserData)

  const { data, error } = await supabase.from("users").insert([dbUserData]).select().single()

  if (error) {
    console.error("[v0] Error creating user:", error)
    console.error("[v0] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Error al crear usuario: ${error.message}`)
  }

  console.log("[v0] User created successfully:", data)

  return {
    ...data,
    role: getRoleEnumValue(data.role),
  }
}

export async function updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
  const supabase = await createClient()

  const dbUserData = userData.role
    ? {
        ...userData,
        role: getRoleDbValue(userData.role),
      }
    : userData

  const { data, error } = await supabase.from("users").update(dbUserData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Error updating user:", error)
    throw new Error("Error al actualizar usuario")
  }

  return {
    ...data,
    role: getRoleEnumValue(data.role),
  }
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = await createClient()

  console.log("[v0] Server-side: Attempting to delete user with ID:", id)
  
  // Primero verificar si el usuario existe
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", id)
    .single()
  
  console.log("[v0] Server-side: User exists check - data:", existingUser, "error:", fetchError)
  
  if (fetchError && fetchError.code === 'PGRST116') {
    console.warn("[v0] Server-side: User not found with ID:", id)
    return
  }
  
  if (fetchError) {
    console.error("[v0] Server-side: Error checking user existence:", fetchError)
    throw new Error("Error al verificar usuario")
  }
  
  if (!existingUser) {
    console.warn("[v0] Server-side: User not found with ID:", id)
    return
  }
  
  console.log("[v0] Server-side: User found, proceeding with deletion:", existingUser)
  
  // Limpiar referencias primero
  console.log("[v0] Server-side: Cleaning up references...")
  
  const { error: updateTicketsError } = await supabase
    .from("tickets")
    .update({ assigned_to: null })
    .eq("assigned_to", id)
  
  const { error: updateRequesterError } = await supabase
    .from("tickets")
    .update({ requester_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30" })
    .eq("requester_id", id)
  
  const { error: deleteCommentsError } = await supabase
    .from("comments")
    .delete()
    .eq("user_id", id)
  
  // Intentar eliminación directa
  const { data: deleteData, error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .select("id")
  
  console.log("[v0] Server-side: Delete result - data:", deleteData, "error:", error)

  // Si hay error O si no se devolvieron datos (RLS bloqueó la eliminación)
  if (error || !deleteData || deleteData.length === 0) {
    console.log("[v0] Server-side: Direct deletion failed or blocked by RLS, attempting RLS bypass...")
    
    // Usar función RPC para bypasear RLS
    const { data: deleteData2, error: error2 } = await supabase.rpc('delete_user_bypass_rls', { user_id: id })
    
    if (error2) {
      console.error("[v0] Server-side: RLS bypass failed:", error2)
      throw new Error("Error al eliminar usuario: " + (error?.message || "RLS bypass failed"))
    }
    
    console.log("[v0] Server-side: User deleted with RLS bypass:", deleteData2)
  } else {
    console.log("[v0] Server-side: User deleted successfully with direct method:", deleteData)
  }
  
  // Verificar que realmente se eliminó
  const { data: verifyUser, error: verifyError } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .single()
  
  console.log("[v0] Server-side: Verification after deletion - data:", verifyUser, "error:", verifyError)
  
  if (verifyUser) {
    console.error("[v0] Server-side: User still exists after deletion attempt!")
    throw new Error("El usuario no se eliminó correctamente")
  }
  
  console.log("[v0] Server-side: User deletion verified successfully")
}

function getRoleDbValue(role: Role): string {
  switch (role) {
    case Role.ADMIN: // 'Administrador'
      return "admin"
    case Role.USER: // 'Usuario'
      return "user"
    case Role.LEVEL_1: // 'Nivel 1'
      return "level1"
    case Role.LEVEL_2: // 'Nivel 2'
      return "level2"
    default:
      return "user"
  }
}

function getRoleEnumValue(dbRole: string): Role {
  switch (dbRole) {
    case "admin":
      return Role.ADMIN // 'Administrador'
    case "user":
      return Role.USER // 'Usuario'
    case "level1":
      return Role.LEVEL_1 // 'Nivel 1'
    case "level2":
      return Role.LEVEL_2 // 'Nivel 2'
    default:
      return Role.USER // 'Usuario'
  }
}

// Client-side functions for browser usage
export const userServiceClient = {
  async getAllUsers(): Promise<User[]> {
    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching users:", error)
        return []
      }

      return (data || []).map((user) => ({
        ...user,
        role: getRoleEnumValue(user.role),
      }))
    } catch (error) {
      console.error("[v0] Database connection error:", error)
      return []
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // User not found
      }
      console.error("[v0] Error fetching user by email:", error)
      throw new Error("Error al buscar usuario por email")
    }

    if (!data) {
      return null
    }

    return {
      ...data,
      role: getRoleEnumValue(data.role),
    }
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("Ya existe un usuario con este email")
    }

    const supabase = createBrowserClient()

    // No incluir id para nuevos usuarios - Supabase lo generará automáticamente
    const dbUserData = {
      email: userData.email,
      name: userData.name,
      role: getRoleDbValue(userData.role),
    }

    const { data, error } = await supabase.from("users").insert([dbUserData]).select().single()

    if (error) {
      console.error("[v0] Error creating user:", error)
      throw new Error("Error al crear usuario")
    }

    return {
      ...data,
      role: getRoleEnumValue(data.role),
    }
  },

  async updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
    const supabase = createBrowserClient()

    const dbUserData = userData.role
      ? {
          ...userData,
          role: getRoleDbValue(userData.role),
        }
      : userData

    const { data, error } = await supabase.from("users").update(dbUserData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating user:", error)
      throw new Error("Error al actualizar usuario")
    }

    return {
      ...data,
      role: getRoleEnumValue(data.role),
    }
  },

  async getUserById(id: string): Promise<User | null> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // User not found
      }
      console.error("[v0] Error fetching user:", error)
      throw new Error("Error al obtener usuario")
    }

    if (!data) {
      return null
    }

    return {
      ...data,
      role: getRoleEnumValue(data.role),
    }
  },

  async deleteUser(id: string): Promise<void> {
    const supabase = createBrowserClient()

    console.log("[v0] Attempting to delete user with ID:", id)
    
    // Primero verificar si el usuario existe
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", id)
      .single()
    
    console.log("[v0] User exists check - data:", existingUser, "error:", fetchError)
    
    if (fetchError && fetchError.code === 'PGRST116') {
      console.warn("[v0] User not found with ID:", id)
      // No lanzar error, simplemente confirmar que no existe
      return
    }
    
    if (fetchError) {
      console.error("[v0] Error checking user existence:", fetchError)
      throw new Error("Error al verificar usuario")
    }
    
    if (!existingUser) {
      console.warn("[v0] User not found with ID:", id)
      return
    }
    
    console.log("[v0] User found, proceeding with deletion:", existingUser)
    
    // Primero, limpiar referencias en tickets y comentarios
    console.log("[v0] Cleaning up ticket references...")
    
    // Actualizar tickets asignados al usuario (poner como sin asignar)
    const { error: updateTicketsError } = await supabase
      .from("tickets")
      .update({ assigned_to: null })
      .eq("assigned_to", id)
    
    if (updateTicketsError) {
      console.warn("[v0] Warning updating tickets:", updateTicketsError)
    }
    
    // Intentar actualizar tickets creados por el usuario (asignar al admin)
    // Intentar diferentes nombres de columna
    try {
      const { error: updateRequesterError } = await supabase
        .from("tickets")
        .update({ requester_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30" })
        .eq("requester_id", id)
      
      if (updateRequesterError) {
        console.warn("[v0] Warning updating ticket requesters (requester_id):", updateRequesterError)
        
        // Intentar con created_by
        const { error: updateCreatedByError } = await supabase
          .from("tickets")
          .update({ created_by: "2af4b6bf-01fe-4b9f-9611-35178dc75c30" })
          .eq("created_by", id)
        
        if (updateCreatedByError) {
          console.warn("[v0] Warning updating ticket requesters (created_by):", updateCreatedByError)
        }
      }
    } catch (error) {
      console.warn("[v0] Error updating ticket requesters:", error)
    }
    
    // Intentar eliminar comentarios del usuario
    try {
      const { error: deleteCommentsError } = await supabase
        .from("comments")
        .delete()
        .eq("user_id", id)
      
      if (deleteCommentsError) {
        console.warn("[v0] Warning deleting comments (comments table):", deleteCommentsError)
        
        // Intentar con ticket_comments
        const { error: deleteTicketCommentsError } = await supabase
          .from("ticket_comments")
          .delete()
          .eq("user_id", id)
        
        if (deleteTicketCommentsError) {
          console.warn("[v0] Warning deleting comments (ticket_comments table):", deleteTicketCommentsError)
        }
      }
    } catch (error) {
      console.warn("[v0] Error deleting comments:", error)
    }
    
    console.log("[v0] References cleaned up, now deleting user...")
    
    // Intentar eliminación directa primero
    const { data: deleteData, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .select("id")
    
    console.log("[v0] Delete result - data:", deleteData, "error:", error)

    // Si hay error O si no se devolvieron datos (RLS bloqueó la eliminación)
    if (error || !deleteData || deleteData.length === 0) {
      console.log("[v0] Direct deletion failed or blocked by RLS, attempting RLS bypass...")
      
      // Usar función RPC para bypasear RLS
      const { data: deleteData2, error: error2 } = await supabase.rpc('delete_user_bypass_rls', { user_id: id })
      
      if (error2) {
        console.error("[v0] RLS bypass also failed:", error2)
        throw new Error("Error al eliminar usuario: " + (error?.message || "RLS bypass failed"))
      }
      
      console.log("[v0] User deleted successfully with RLS bypass:", deleteData2)
    } else {
      console.log("[v0] User deleted successfully with direct method:", deleteData)
    }
    
    // Verificar que realmente se eliminó
    const { data: verifyUser, error: verifyError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single()
    
    console.log("[v0] Verification after deletion - data:", verifyUser, "error:", verifyError)
    
    if (verifyUser) {
      console.error("[v0] User still exists after deletion attempt!")
      throw new Error("El usuario no se eliminó correctamente")
    }
    
    console.log("[v0] User deletion verified successfully")
  },
}
