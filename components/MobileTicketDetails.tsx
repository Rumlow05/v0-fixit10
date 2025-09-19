"use client"

import React, { useState } from 'react'
import { Ticket, User, Role, Status, Priority } from '@/types'

interface MobileTicketDetailsProps {
  ticket: Ticket | null
  currentUser: User | null
  onClose: () => void
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void
  onTicketDelete: (ticketId: string) => void
  onAddComment: (comment: string) => void
  users: User[]
}

const MobileTicketDetails: React.FC<MobileTicketDetailsProps> = ({
  ticket,
  currentUser,
  onClose,
  onTicketUpdate,
  onTicketDelete,
  onAddComment,
  users,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [editData, setEditData] = useState<Partial<Ticket>>({})

  // Función para manejar el envío de comentarios
  const handleSubmitComment = async () => {
    if (newComment.trim() && ticket) {
      try {
        await onAddComment(newComment.trim())
        setNewComment("")
        setShowCommentModal(false)
      } catch (error) {
        console.error("Error al agregar comentario:", error)
      }
    }
  }

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string | undefined) => {
    if (!userId) return "Sistema"
    const user = users.find(u => u.id === userId)
    return user?.name || "Usuario desconocido"
  }

  if (!ticket) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona un ticket</h3>
          <p className="text-gray-500">Elige un ticket de la lista para ver todos sus detalles</p>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'bg-green-100 text-green-800 border-green-200'
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case Priority.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case Priority.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case Status.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case Status.RESOLVED:
        return 'bg-green-100 text-green-800 border-green-200'
      case Status.CLOSED:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleStatusChange = (newStatus: Status) => {
    onTicketUpdate(ticket.id, { status: newStatus })
  }

  const handlePriorityChange = (newPriority: Priority) => {
    onTicketUpdate(ticket.id, { priority: newPriority })
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar este ticket?')) {
      onTicketDelete(ticket.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Detalles del Ticket</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {currentUser?.role === Role.ADMIN && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Información básica */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
            <span className="text-sm text-gray-500">#{ticket.id.slice(-8)}</span>
          </div>
          
          <p className="text-gray-600 mb-4">{ticket.description}</p>
          
          <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Creado:</span>
              <p className="font-medium">{new Date(ticket.created_at).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <span className="text-gray-500">Actualizado:</span>
              <p className="font-medium">{new Date(ticket.updated_at).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        {isEditing && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Estado</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(Status).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        ticket.status === status
                          ? getStatusColor(status)
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Prioridad</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(Priority).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        ticket.priority === priority
                          ? getPriorityColor(priority)
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Actividad y Comentarios */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Historial de Actividad</h3>
            <button
              onClick={() => setShowCommentModal(true)}
              className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              + Comentario
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {(() => {
              // Crear historial combinado de comentarios y eventos del ticket
              const activities: any[] = []
              
              // Agregar evento de creación del ticket
              if (ticket.created_at) {
                const creator = users.find(u => u.id === ticket.requester_id)
                activities.push({
                  id: `creation-${ticket.id}`,
                  type: 'creation',
                  description: `Creó el ticket: "${ticket.title}"`,
                  author: creator?.name || 'Usuario',
                  date: ticket.created_at,
                  icon: '📝'
                })
              }
              
              // Agregar evento de asignación si existe
              if (ticket.assigned_to) {
                const assignee = users.find(u => u.id === ticket.assigned_to)
                const assigner = users.find(u => u.id === ticket.transferred_by) || users.find(u => u.id === ticket.requester_id)
                activities.push({
                  id: `assignment-${ticket.id}`,
                  type: 'assignment',
                  description: `Asignado a ${assignee?.name || 'Usuario'}`,
                  author: assigner?.name || 'Sistema',
                  date: ticket.updated_at || ticket.created_at,
                  icon: '👤'
                })
              }
              
              // Agregar evento de cambio de estado si no es el estado inicial
              if (ticket.status && ticket.status !== 'Abierto') {
                const statusChanger = users.find(u => u.id === ticket.assigned_to) || users.find(u => u.id === ticket.requester_id)
                activities.push({
                  id: `status-${ticket.id}`,
                  type: 'status_change',
                  description: `Estado cambiado a "${ticket.status}"`,
                  author: statusChanger?.name || 'Sistema',
                  date: ticket.updated_at || ticket.created_at,
                  icon: '🔄'
                })
              }
              
              // Agregar comentarios
              if (ticket.comments && ticket.comments.length > 0) {
                ticket.comments.forEach((comment, index) => {
                  activities.push({
                    id: `comment-${index}`,
                    type: 'comment',
                    description: comment.text,
                    author: comment.author,
                    date: comment.timestamp,
                    icon: '💬'
                  })
                })
              }
              
              // Ordenar por fecha (más recientes primero)
              activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              
              return activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.author} - {new Date(activity.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No hay actividad registrada para este ticket.</p>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal para agregar comentario */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Comentario</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowCommentModal(false)
                    setNewComment("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileTicketDetails
