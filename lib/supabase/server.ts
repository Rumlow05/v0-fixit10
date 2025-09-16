import { createClient as createSupabaseClient } from "./client"

export async function createClient() {
  return createSupabaseClient()
}
