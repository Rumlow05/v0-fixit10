import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, createUser } from "@/services/userService"

export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] API Error getting users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const user = await createUser(userData)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[v0] API Error creating user:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
