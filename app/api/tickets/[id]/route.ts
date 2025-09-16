import { type NextRequest, NextResponse } from "next/server"
import { getTicketById, updateTicket, deleteTicket } from "@/services/ticketService"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ticket = await getTicketById(id)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("[v0] API Error getting ticket:", error)
    return NextResponse.json({ error: "Error al obtener ticket" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ticketData = await request.json()
    const ticket = await updateTicket(id, ticketData)
    return NextResponse.json(ticket)
  } catch (error) {
    console.error("[v0] API Error updating ticket:", error)
    return NextResponse.json({ error: "Error al actualizar ticket" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteTicket(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API Error deleting ticket:", error)
    return NextResponse.json({ error: "Error al eliminar ticket" }, { status: 500 })
  }
}
