import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getColombiaTimestamp } from '@/utils/colombiaTime'

interface MockSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      order: (column: string, options?: any) => Promise<{ data: any[]; error: null }>
      eq: (
        column: string,
        value: any,
      ) => {
        single: () => Promise<{ data: any; error: null }>
      }
    }
    insert: (data: any[]) => {
      select: () => {
        single: () => Promise<{ data: any; error: null }>
      }
    }
    update: (data: any) => {
      eq: (
        column: string,
        value: any,
      ) => {
        select: () => {
          single: () => Promise<{ data: any; error: null }>
        }
      }
    }
    delete: () => {
      eq: (column: string, value: any) => Promise<{ error: null }>
    }
  }
  rpc: (functionName: string, params?: any) => Promise<{ data: any; error: null }>
}

// Mock data - usando localStorage para persistencia
const getMockUsers = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('fixit_mock_users')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error("[v0] Error parsing mock users from localStorage:", e)
      // Fallback to default users if parsing fails
    }
  }
  
  // Datos iniciales por defecto
  const defaultUsers = [
    {
      id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      email: "tech@emprendetucarrera.com.co",
      name: "Administrador",
      phone: "+573001234567",
      role: "admin",
      created_at: "2025-09-16T03:05:58.368131+00:00",
      updated_at: "2025-09-16T03:05:58.368131+00:00",
    },
    {
      id: "user-2",
      email: "user@fixit.com",
      name: "Usuario Test",
      phone: "+573007654321",
      role: "level1",
      created_at: "2025-09-16T03:05:58.368131+00:00",
      updated_at: "2025-09-16T03:05:58.368131+00:00",
    },
  ]
  
  // Guardar datos iniciales si no existen
  if (typeof window !== 'undefined') {
    localStorage.setItem('fixit_mock_users', JSON.stringify(defaultUsers))
  }
  
  return defaultUsers
}

const saveMockUsers = (users: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fixit_mock_users', JSON.stringify(users))
  }
}

const getMockTickets = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('fixit_mock_tickets')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error("[v0] Error parsing mock tickets from localStorage:", e)
      // Fallback to default tickets
    }
  }
  
  // Datos iniciales por defecto
  const defaultTickets = [
    {
      id: "ticket-1",
      title: "Problema con el sistema",
      description: "El sistema no responde correctamente",
      status: "Abierto",
      priority: "Alta",
      requester_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      assigned_to: null,
      created_at: "2025-09-16T03:05:58.368131+00:00",
      updated_at: "2025-09-16T03:05:58.368131+00:00",
      comments: [],
    },
    {
      id: "ticket-2",
      title: "Error en la base de datos",
      description: "La base de datos no se conecta correctamente",
      status: "Resuelto",
      priority: "Crítica",
      requester_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      assigned_to: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      created_at: "2025-09-15T10:30:00.000Z",
      updated_at: "2025-09-15T14:45:00.000Z",
      comments: [],
    },
    {
      id: "ticket-3",
      title: "Problema con el login",
      description: "Los usuarios no pueden iniciar sesión",
      status: "Cerrado",
      priority: "Alta",
      requester_id: "user-2",
      assigned_to: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      created_at: "2025-09-14T09:15:00.000Z",
      updated_at: "2025-09-14T16:20:00.000Z",
      comments: [],
    },
    {
      id: "ticket-4",
      title: "Error en el reporte",
      description: "El reporte no se genera correctamente",
      status: "Resuelto",
      priority: "Media",
      requester_id: "user-2",
      assigned_to: "user-2",
      created_at: "2025-09-13T11:00:00.000Z",
      updated_at: "2025-09-13T15:30:00.000Z",
      comments: [],
    },
  ]
  
  // Guardar datos iniciales si no existen
  if (typeof window !== 'undefined') {
    localStorage.setItem('fixit_mock_tickets', JSON.stringify(defaultTickets))
  }
  
  return defaultTickets
}

const saveMockTickets = (tickets: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fixit_mock_tickets', JSON.stringify(tickets))
  }
}

const mockTickets = [
  {
    id: "ticket-1",
    title: "Problema con el sistema",
    description: "El sistema no responde correctamente",
    status: "Abierto",
    priority: "Alta",
    requester_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
    assigned_to: null,
    created_at: "2025-09-16T03:05:58.368131+00:00",
    updated_at: "2025-09-16T03:05:58.368131+00:00",
    comments: [],
  },
]

function createMockClient(): MockSupabaseClient {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        order: async (column: string, options?: any) => {
          console.log(`[v0] Mock query: SELECT ${columns} FROM ${table} ORDER BY ${column}`)
          if (table === "users") {
            return { data: getMockUsers(), error: null }
          }
          if (table === "tickets") {
            const tickets = getMockTickets()
            const users = getMockUsers()
            // Simular joins
            const ticketsWithJoins = tickets.map(t => ({
              ...t,
              assigned_user: t.assigned_to ? users.find((u: any) => u.id === t.assigned_to) : null,
              creator: (t.requester_id || t.created_by) ? users.find((u: any) => u.id === (t.requester_id || t.created_by)) : null
            }))
            return { data: ticketsWithJoins, error: null }
          }
          return { data: [], error: null }
        },
        eq: (column: string, value: any) => ({
          single: async () => {
            console.log(`[v0] Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`)
            if (table === "users") {
              const users = getMockUsers()
              const user = users.find((u) => u[column as keyof typeof u] === value)
              return { data: user || null, error: null }
            }
            if (table === "tickets") {
              const tickets = getMockTickets()
              const users = getMockUsers()
              const ticket = tickets.find((t) => t[column as keyof typeof t] === value)
              
              if (ticket) {
                const ticketWithJoins = {
                  ...ticket,
                  assigned_user: ticket.assigned_to ? users.find((u: any) => u.id === ticket.assigned_to) : null,
                  creator: (ticket.requester_id || ticket.created_by) ? users.find((u: any) => u.id === (ticket.requester_id || ticket.created_by)) : null
                }
                return { data: ticketWithJoins, error: null }
              }
              return { data: null, error: null }
            }
            return { data: null, error: null }
          },
        }),
      }),
      insert: (data: any[]) => ({
        select: () => ({
          single: async () => {
            console.log(`[v0] Mock insert into ${table}:`, data)
            const newItem = { ...data[0], id: `${table}-${Date.now()}` }
            if (table === "users") {
              const users = getMockUsers()
              users.push(newItem)
              saveMockUsers(users)
            }
            if (table === "tickets") {
              const tickets = getMockTickets()
              // Asignar valores por defecto si no se proporcionan
              const ticketWithDefaults = {
                ...newItem,
                status: newItem.status || "Abierto",
                priority: newItem.priority || "Media",
                created_at: newItem.created_at || getColombiaTimestamp(),
                updated_at: newItem.updated_at || getColombiaTimestamp(),
                comments: newItem.comments || [],
              }
              tickets.push(ticketWithDefaults)
              saveMockTickets(tickets)
              return { data: ticketWithDefaults, error: null }
            }
            return { data: newItem, error: null }
          },
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              console.log(`[v0] Mock update ${table} SET ${JSON.stringify(data)} WHERE ${column} = ${value}`)
              if (table === "users") {
                const users = getMockUsers()
                const userIndex = users.findIndex((u) => u[column as keyof typeof u] === value)
                if (userIndex >= 0) {
                  users[userIndex] = { ...users[userIndex], ...data }
                  saveMockUsers(users)
                  return { data: users[userIndex], error: null }
                }
              }
              if (table === "tickets") {
                const tickets = getMockTickets()
                const ticketIndex = tickets.findIndex((t) => t[column as keyof typeof t] === value)
                if (ticketIndex >= 0) {
                  tickets[ticketIndex] = { ...tickets[ticketIndex], ...data }
                  saveMockTickets(tickets)
                  
                  const users = getMockUsers()
                  const updatedTicket = tickets[ticketIndex]
                  const ticketWithJoins = {
                    ...updatedTicket,
                    assigned_user: updatedTicket.assigned_to ? users.find((u: any) => u.id === updatedTicket.assigned_to) : null,
                    creator: (updatedTicket.requester_id || updatedTicket.created_by) ? users.find((u: any) => u.id === (updatedTicket.requester_id || updatedTicket.created_by)) : null
                  }
                  return { data: ticketWithJoins, error: null }
                }
              }
              return { data: null, error: null }
            },
          }),
        }),
      }),
      delete: () => ({
        eq: async (column: string, value: any) => {
          console.log(`[v0] Mock delete from ${table} WHERE ${column} = ${value}`)
          if (table === "users") {
            const users = getMockUsers()
            const userIndex = users.findIndex((u) => u[column as keyof typeof u] === value)
            if (userIndex >= 0) {
              users.splice(userIndex, 1)
              saveMockUsers(users)
              console.log(`[v0] User deleted successfully. Remaining users:`, users.length)
            }
          }
          if (table === "tickets") {
            const tickets = getMockTickets()
            const ticketIndex = tickets.findIndex((t) => t[column as keyof typeof t] === value)
            if (ticketIndex >= 0) {
              tickets.splice(ticketIndex, 1)
              saveMockTickets(tickets)
              console.log(`[v0] Ticket deleted successfully. Remaining tickets:`, tickets.length)
            }
          }
          return { error: null }
        },
      }),
    }),
    rpc: async (functionName: string, params?: any) => {
      console.log(`[v0] Mock RPC call: ${functionName}`, params)
      if (functionName === 'delete_user_bypass_rls') {
        const { user_id } = params
        const users = getMockUsers()
        const userIndex = users.findIndex((u) => u.id === user_id)
        if (userIndex >= 0) {
          const deletedUser = users[userIndex]
          users.splice(userIndex, 1)
          saveMockUsers(users)
          return { data: [deletedUser], error: null }
        }
        return { data: [], error: null }
      }
      return { data: null, error: null }
    },
  }
}

// Singleton para evitar múltiples instancias de GoTrueClient
let supabaseClientInstance: any = null
let mockClientInstance: any = null

// Función para crear cliente - usa Supabase real si está configurado, sino usa mock
export function createClient() {
  // Verificar si las variables de entorno de Supabase están configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseAnonKey) {
    if (!supabaseClientInstance) {
      console.log("[v0] Creating real Supabase connection")
      supabaseClientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    }
    return supabaseClientInstance
  } else {
    if (!mockClientInstance) {
      console.log("[v0] Creating mock Supabase client (no environment variables found)")
      mockClientInstance = createMockClient()
    }
    return mockClientInstance
  }
}

export { createClient as createBrowserClient }
