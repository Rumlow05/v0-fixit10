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
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const existingUser = await getUserByEmail(userData.email)
  if (existingUser) {
    throw new Error("Ya existe un usuario con este email")
  }

  const supabase = await createClient()

  const dbUserData = {
    ...userData,
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

  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting user:", error)
    throw new Error("Error al eliminar usuario")
  }
}

function getRoleDbValue(role: Role): string {
  switch (role) {
    case Role.ADMIN: // 'Administrador'
      return "admin"
    case Role.USER: // 'Usuario'
      return "level1" // Mapping Usuario to level1 since 'user' might not be allowed
    case Role.LEVEL_1: // 'Nivel 1'
      return "level1"
    case Role.LEVEL_2: // 'Nivel 2'
      return "level2"
    default:
      return "level1"
  }
}

function getRoleEnumValue(dbRole: string): Role {
  switch (dbRole) {
    case "admin":
      return Role.ADMIN // 'Administrador'
    case "level1":
      return Role.USER // 'Usuario' - mapping level1 back to Usuario for display
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

    const dbUserData = {
      ...userData,
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

    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting user:", error)
      throw new Error("Error al eliminar usuario")
    }
  },
}
