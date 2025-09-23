import { supabase } from '../lib/supabase/client'
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
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[AttachmentService] Error obteniendo attachments:', error)
        throw error
      }

      console.log(`[AttachmentService] Attachments obtenidos:`, data)
      return data || []
    } catch (error) {
      console.error('[AttachmentService] Error en getAttachmentsByTicketId:', error)
      throw error
    }
  }

  /**
   * Crea un nuevo attachment en la base de datos
   */
  static async createAttachment(attachmentData: CreateAttachmentData): Promise<Attachment> {
    try {
      console.log('[AttachmentService] Creando attachment:', attachmentData)
      
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
   * Elimina un attachment
   */
  static async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      console.log(`[AttachmentService] Eliminando attachment: ${attachmentId}`)
      
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) {
        console.error('[AttachmentService] Error eliminando attachment:', error)
        throw error
      }

      console.log('[AttachmentService] Attachment eliminado exitosamente')
    } catch (error) {
      console.error('[AttachmentService] Error en deleteAttachment:', error)
      throw error
    }
  }

  /**
   * Convierte un archivo a base64 para almacenamiento temporal
   * En un entorno de producción, esto debería subirse a un servicio de almacenamiento como AWS S3
   */
  static async uploadFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Procesa y guarda un archivo adjunto
   */
  static async uploadAttachment(uploadData: UploadFileData): Promise<Attachment> {
    try {
      console.log('[AttachmentService] Subiendo archivo:', uploadData.file.name)
      
      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileExtension = uploadData.file.name.split('.').pop()
      const uniqueFilename = `${timestamp}_${uploadData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      // Convertir archivo a base64 (en producción usar servicio de almacenamiento)
      const fileBase64 = await this.uploadFileToBase64(uploadData.file)
      
      // Crear datos del attachment
      const attachmentData: CreateAttachmentData = {
        ticket_id: uploadData.ticket_id,
        filename: uniqueFilename,
        original_name: uploadData.file.name,
        file_size: uploadData.file.size,
        file_type: uploadData.file.type,
        file_path: fileBase64, // En producción sería la URL del archivo en el servicio de almacenamiento
        uploaded_by: uploadData.uploaded_by
      }

      // Guardar en base de datos
      const attachment = await this.createAttachment(attachmentData)
      
      console.log('[AttachmentService] Archivo subido exitosamente:', attachment)
      return attachment
    } catch (error) {
      console.error('[AttachmentService] Error en uploadAttachment:', error)
      throw error
    }
  }

  /**
   * Obtiene la URL de descarga de un archivo
   */
  static getFileDownloadUrl(attachment: Attachment): string {
    // En producción, esto sería la URL del servicio de almacenamiento
    return attachment.file_path
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obtiene el icono apropiado para el tipo de archivo
   */
  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('audio')) return '🎵'
    return '📎'
  }
}

// Funciones de conveniencia para uso directo
export const attachmentServiceClient = {
  getAttachmentsByTicketId: AttachmentService.getAttachmentsByTicketId,
  createAttachment: AttachmentService.createAttachment,
  deleteAttachment: AttachmentService.deleteAttachment,
  uploadAttachment: AttachmentService.uploadAttachment,
  getFileDownloadUrl: AttachmentService.getFileDownloadUrl,
  formatFileSize: AttachmentService.formatFileSize,
  getFileIcon: AttachmentService.getFileIcon
}
