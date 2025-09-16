import type { Ticket } from "../types"

export const categorizeTicket = async (
  title: string,
  description: string,
): Promise<{ category: string; priority: string }> => {
  try {
    const response = await fetch("/api/gemini/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description }),
    })

    if (!response.ok) {
      throw new Error("Failed to categorize ticket")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error al categorizar el ticket:", error)
    return { category: "Otro", priority: "Media" }
  }
}

export const suggestSolution = async (title: string, description: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description }),
    })

    if (!response.ok) {
      throw new Error("Failed to get suggestion")
    }

    const result = await response.json()
    return result.suggestion
  } catch (error) {
    console.error("Error al sugerir una solución:", error)
    return "No se pudo generar una solución en este momento. Por favor, investiga manualmente."
  }
}

export const generateAdminReport = async (tickets: Ticket[], users: any[]): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tickets, users }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate report")
    }

    const result = await response.json()
    return result.report
  } catch (error) {
    console.error("Error al generar el informe de administración:", error)
    return "No se pudo generar el informe debido a un error de la API."
  }
}
