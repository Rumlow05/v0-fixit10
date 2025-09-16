import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn("GEMINI_API_KEY environment variable is not set")
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function POST(request: NextRequest) {
  if (!ai) {
    return NextResponse.json(
      { report: "API de Gemini no disponible. Por favor, configura tu API Key para generar reportes de IA." },
      { status: 200 },
    )
  }

  try {
    const { tickets, users } = await request.json()

    const userMap = new Map(users.map((u: any) => [u.id, u.name]))
    const ticketsForPrompt = tickets.map((t: any) => ({
      ...t,
      requesterName: userMap.get(t.requesterId) || "Desconocido",
      assigneeName: t.assigneeId ? userMap.get(t.assigneeId) || "Sin asignar" : "Sin asignar",
    }))

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analiza los siguientes datos JSON de tickets de soporte. Proporciona un informe ejecutivo conciso. 
      El informe debe incluir:
      1. Número total de tickets.
      2. Desglose de tickets por estado (Abierto, En Progreso, Resuelto, Cerrado).
      3. Desglose de tickets por prioridad.
      4. Identifica cualquier tema recurrente o problema principal basado en los títulos y categorías de los tickets.
      
      Datos de Tickets:
      ${JSON.stringify(ticketsForPrompt, null, 2)}
      `,
    })

    return NextResponse.json({ report: response.text })
  } catch (error) {
    console.error("Error al generar el informe de administración:", error)
    return NextResponse.json({ report: "No se pudo generar el informe debido a un error de la API." }, { status: 200 })
  }
}
