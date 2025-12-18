import { createBrowserClient, createMockClient } from '../lib/supabase/client'
import { Attachment } from '../types'

// Interfaz para crear un nuevo attachment
export interface CreateAttachmentData {
  ticket_id: string
  filename: string
  original_name: string
  file_size: number
  file_type: string
  file_path: string
  uploaded_by: string
}

// Interfaz para subir archivo
export interface UploadFileData {
  file: File
  ticket_id: string
  uploaded_by: string
}

/**
 * Servicio para manejar archivos adjuntos de tickets
 */
export class AttachmentService {
  /**
   * Obtiene todos los attachments de un ticket específico
   */
  static async getAttachmentsByTicketId(ticketId: string): Promise<Attachment[]> {
    try {
      console.log(`[AttachmentService] Obteniendo attachments para ticket: ${ticketId}`)
      
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[AttachmentService] Error obteniendo attachments:', error)
        console.log('[AttachmentService] Attempting fallback to mock client...')
        const mockSupabase = createMockClient()
        const { data: mockData, error: mockError } = await mockSupabase
          .from('attachments')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false })

        if (mockError) {
           console.error('[AttachmentService] Mock client also failed:', mockError)
           throw error
        }
        return mockData || []
      }

      console.log(`[AttachmentService] Attachments obtenidos:`, data)
      return data || []
    } catch (error) {
      console.error('[AttachmentService] Error en getAttachmentsByTicketId:', error)
      throw error
    }
  }

  /**
   * Obtiene el icono correspondiente al tipo de archivo
   */
  static getFileIcon(fileType: string): string {
    if (!fileType) return '📄'
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦'
    return '📄'
  }

  /**
   * Formatea el tamaño del archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obtiene la URL de descarga del archivo
   */
  static getFileDownloadUrl(attachment: Attachment): string {
    return attachment.file_path
  }

  /**
   * Crea un nuevo attachment en la base de datos
   */
  static async createAttachment(attachmentData: CreateAttachmentData): Promise<Attachment> {
    try {
      console.log('[AttachmentService] Creando attachment:', attachmentData)
      
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('attachments')
        .insert([attachmentData])
        .select()
        .single()

      if (error) {
        console.error('[AttachmentService] Error creando attachment:', error)
        throw error
      }

      console.log('[AttachmentService] Attachment creado:', data)
      return data
    } catch (error) {
      console.error('[AttachmentService] Error en createAttachment:', error)
      throw error
    }
  }

  /**
   * Elimina un attachment de Vercel Blob y base de datos
   */
  static async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      console.log(`[AttachmentService] Eliminando attachment: ${attachmentId}`)
      
      // Primero obtener el attachment para conseguir la URL de Vercel Blob
      const supabase = createBrowserClient()
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single()

      if (fetchError) {
        console.error('[AttachmentService] Error obteniendo attachment:', fetchError)
        throw fetchError
      }

      // Eliminar de Vercel Blob
      try {
        const deleteResponse = await fetch('/api/delete-blob', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: attachment.file_path }),
        })

        if (!deleteResponse.ok) {
          console.warn('[AttachmentService] Error eliminando archivo de Vercel Blob, continuando...')
        } else {
          console.log('[AttachmentService] Archivo eliminado de Vercel Blob exitosamente')
        }
      } catch (blobError) {
        console.warn('[AttachmentService] Error eliminando de Vercel Blob:', blobError)
        // Continuar con la eliminación de la base de datos
      }

      // Eliminar de base de datos
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) {
        console.error('[AttachmentService] Error eliminando attachment de BD:', error)
        throw error
      }

      console.log('[AttachmentService] Attachment eliminado exitosamente')
    } catch (error) {
      console.error('[AttachmentService] Error en deleteAttachment:', error)
      throw error
    }
  }

  /**
   * Sube un archivo a Vercel Blob Storage
   */
  static async uploadFileToBlob(file: File, ticketId: string): Promise<{url: string, pathname: string, size: number}> {
    try {
      console.log(`[AttachmentService] Subiendo archivo a Vercel Blob: ${file.name}`)
      
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&ticketId=${ticketId}`, {
        method: 'POST',
        body: file,
      })

      const result = await response.json()
      
      console.log(`[AttachmentService] Archivo subido exitosamente:`, result)
      return result
    } catch (error) {
      console.error('[AttachmentService] Error en uploadFileToBlob:', error)
      throw error
    }
  }
}

// Exportar como singleton/cliente para mantener consistencia
export const attachmentServiceClient = AttachmentService
