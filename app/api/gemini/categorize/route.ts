import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type } from "@google/genai"

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn("GEMINI_API_KEY environment variable is not set")
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function POST(request: NextRequest) {
  if (!ai) {
    return NextResponse.json({ error: "Gemini API not configured" }, { status: 500 })
  }

  try {
    const { title, description } = await request.json()

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analiza el siguiente ticket de soporte de TI y devuelve su categoría y prioridad.
      Título: "${title}"
      Descripción: "${description}"
      
      Categorías Válidas: Hardware, Software, Red, Solicitud de Acceso, Otro.
      Prioridades Válidas: Baja, Media, Alta, Crítica.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "La categoría del ticket.",
            },
            priority: {
              type: Type.STRING,
              description: "El nivel de prioridad del ticket.",
            },
          },
        },
      },
    })

    const jsonStr = (response.text || "{}").trim()
    const result = JSON.parse(jsonStr)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al categorizar el ticket:", error)
    return NextResponse.json({ category: "Otro", priority: "Media" }, { status: 200 })
  }
}
