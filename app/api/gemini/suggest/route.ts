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
      { suggestion: "API de Gemini no disponible. Por favor, configura tu API Key para obtener sugerencias de IA." },
      { status: 200 },
    )
  }

  try {
    const { title, description } = await request.json()

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Eres un especialista de soporte de TI de Nivel 1. Basado en el siguiente ticket, proporciona una lista concisa y procesable de pasos iniciales para la solución de problemas.
      Título: "${title}"
      Descripción: "${description}"`,
    })

    return NextResponse.json({ suggestion: response.text })
  } catch (error) {
    console.error("Error al sugerir una solución:", error)
    return NextResponse.json(
      { suggestion: "No se pudo generar una solución en este momento. Por favor, investiga manualmente." },
      { status: 200 },
    )
  }
}
