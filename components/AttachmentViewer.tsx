import React, { useState, useEffect } from 'react'
import { Attachment } from '../types'
import { attachmentServiceClient } from '../services/attachmentService'

interface AttachmentViewerProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  currentUser: any
}

/**
 * Modal para visualizar y gestionar archivos adjuntos de un ticket
 */
const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  isOpen,
  onClose,
  ticketId,
  currentUser
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar attachments cuando se abre el modal
  useEffect(() => {
    if (isOpen && ticketId) {
      loadAttachments()
    }
  }, [isOpen, ticketId])

  const loadAttachments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`[AttachmentViewer] Cargando attachments para ticket: ${ticketId}`)
      
      const data = await attachmentServiceClient.getAttachmentsByTicketId(ticketId)
      setAttachments(data)
      console.log(`[AttachmentViewer] Attachments cargados:`, data)
    } catch (err) {
      console.error('[AttachmentViewer] Error cargando attachments:', err)
      setError('Error al cargar los archivos adjuntos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (attachment: Attachment) => {
    try {
      console.log(`[AttachmentViewer] Descargando archivo: ${attachment.original_name}`)
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = attachmentServiceClient.getFileDownloadUrl(attachment)
      link.download = attachment.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('[AttachmentViewer] Error descargando archivo:', err)
      setError('Error al descargar el archivo')
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${attachment.original_name}"?`)) {
      return
    }

    try {
      console.log(`[AttachmentViewer] Eliminando attachment: ${attachment.id}`)
      await attachmentServiceClient.deleteAttachment(attachment.id)
      
      // Recargar la lista de attachments
      await loadAttachments()
    } catch (err) {
      console.error('[AttachmentViewer] Error eliminando attachment:', err)
      setError('Error al eliminar el archivo')
    }
  }

  const handlePreview = (attachment: Attachment) => {
    setSelectedAttachment(attachment)
  }

  const canDelete = (attachment: Attachment) => {
    // Solo el usuario que subió el archivo o un administrador puede eliminarlo
    return currentUser?.id === attachment.uploaded_by || currentUser?.role === 'Administrador'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📎 Archivos Adjuntos</h2>
            <p className="text-sm text-gray-600 mt-1">Ticket ID: {ticketId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando archivos...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && attachments.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay archivos adjuntos</h3>
              <p className="text-gray-600">Este ticket no tiene archivos adjuntos.</p>
            </div>
          )}

          {!loading && !error && attachments.length > 0 && (
            <div className="space-y-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {attachmentServiceClient.getFileIcon(attachment.file_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{attachment.original_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{attachmentServiceClient.formatFileSize(attachment.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(attachment.created_at).toLocaleDateString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Botón de vista previa para imágenes */}
                      {attachment.file_type.startsWith('image/') && (
                        <button
                          onClick={() => handlePreview(attachment)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Vista previa"
                        >
                          👁️ Ver
                        </button>
                      )}
                      
                      {/* Botón de descarga */}
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Descargar"
                      >
                        ⬇️ Descargar
                      </button>
                      
                      {/* Botón de eliminar */}
                      {canDelete(attachment) && (
                        <button
                          onClick={() => handleDelete(attachment)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de vista previa de imagen */}
      {selectedAttachment && selectedAttachment.file_type.startsWith('image/') && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{selectedAttachment.original_name}</h3>
              <button
                onClick={() => setSelectedAttachment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={attachmentServiceClient.getFileDownloadUrl(selectedAttachment)}
                alt={selectedAttachment.original_name}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttachmentViewer
