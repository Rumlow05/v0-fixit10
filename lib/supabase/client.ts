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
}

// Mock data - usando localStorage para persistencia
const getMockUsers = (): any[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('fixit_mock_users')
    if (stored) {
      return JSON.parse(stored)
    }
  }
  
  // Datos iniciales por defecto
  const defaultUsers = [
    {
      id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
      email: "admin@fixit.com",
      name: "Administrador",
      role: "admin",
      created_at: "2025-09-16T03:05:58.368131+00:00",
      updated_at: "2025-09-16T03:05:58.368131+00:00",
    },
    {
      id: "user-2",
      email: "user@fixit.com",
      name: "Usuario Test",
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

const mockTickets = [
  {
    id: "ticket-1",
    title: "Problema con el sistema",
    description: "El sistema no responde correctamente",
    status: "open",
    priority: "high",
    user_id: "2af4b6bf-01fe-4b9f-9611-35178dc75c30",
    assigned_to: null,
    created_at: "2025-09-16T03:05:58.368131+00:00",
    updated_at: "2025-09-16T03:05:58.368131+00:00",
  },
]

export function createClient(): MockSupabaseClient {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        order: async (column: string, options?: any) => {
          console.log(`[v0] Mock query: SELECT ${columns} FROM ${table} ORDER BY ${column}`)
          if (table === "users") {
            return { data: getMockUsers(), error: null }
          }
          if (table === "tickets") {
            return { data: mockTickets, error: null }
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
          return { error: null }
        },
      }),
    }),
  }
}

export { createClient as createBrowserClient }
