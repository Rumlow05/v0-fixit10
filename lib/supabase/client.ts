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

// Mock data
const mockUsers = [
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
            return { data: mockUsers, error: null }
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
              const user = mockUsers.find((u) => u[column as keyof typeof u] === value)
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
              mockUsers.push(newItem)
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
                const userIndex = mockUsers.findIndex((u) => u[column as keyof typeof u] === value)
                if (userIndex >= 0) {
                  mockUsers[userIndex] = { ...mockUsers[userIndex], ...data }
                  return { data: mockUsers[userIndex], error: null }
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
            const userIndex = mockUsers.findIndex((u) => u[column as keyof typeof u] === value)
            if (userIndex >= 0) {
              mockUsers.splice(userIndex, 1)
            }
          }
          return { error: null }
        },
      }),
    }),
  }
}

export { createClient as createBrowserClient }
