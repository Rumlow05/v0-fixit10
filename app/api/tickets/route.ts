import { type NextRequest, NextResponse } from "next/server"
import { getAllTickets, createTicket } from "@/services/ticketService"

export async function GET() {
  try {
    const tickets = await getAllTickets()
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("[v0] API Error getting tickets:", error)
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json()
    const ticket = await createTicket(ticketData)
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("[v0] API Error creating ticket:", error)
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 })
  }
}
