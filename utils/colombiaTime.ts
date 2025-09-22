// Utilidad para manejar fechas y horas en zona horaria de Colombia

/**
 * Obtiene el timestamp actual en zona horaria de Colombia (America/Bogota)
 * @returns ISO string con la fecha/hora actual en Colombia
 */
export const getColombiaTimestamp = (): string => {
  const now = new Date()
  // Convertir a zona horaria de Colombia y luego a ISO string
  const colombiaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }))
  return colombiaTime.toISOString()
}

/**
 * Formatea una fecha a string en zona horaria de Colombia
 * @param dateString - Fecha en formato ISO string
 * @returns Fecha formateada en zona horaria de Colombia
 */
export const formatColombiaDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * Formatea solo la fecha (sin hora) en zona horaria de Colombia
 * @param dateString - Fecha en formato ISO string
 * @returns Solo la fecha formateada en zona horaria de Colombia
 */
export const formatColombiaDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}
