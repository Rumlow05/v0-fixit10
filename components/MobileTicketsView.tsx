"use client"

import React, { useState } from 'react'
import { Ticket, User, Role, Status, Priority } from '@/types'
import { useMobile } from '@/hooks/useMobile'
import MobileBottomNavigation from './MobileBottomNavigation'

interface MobileTicketsViewProps {
  tickets: Ticket[]
  currentUser: User | null
  onCreateTicket: () => void
  onTicketSelect: (ticket: Ticket) => void
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void
  onTicketDelete: (ticketId: string) => void
  isLoading: boolean
  currentView: string
  setCurrentView: (view: string) => void
  userCount?: number
}

const MobileTicketsView: React.FC<MobileTicketsViewProps> = ({
  tickets,
  currentUser,
  onCreateTicket,
  onTicketSelect,
  onTicketUpdate,
  onTicketDelete,
  isLoading,
  currentView,
  setCurrentView,
  userCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'progress' | 'resolved'>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Filtrar tickets según la pestaña activa
  const filteredTickets = tickets.filter(ticket => {
    switch (activeTab) {
      case 'open':
        return ticket.status === Status.OPEN
      case 'progress':
        return ticket.status === Status.IN_PROGRESS
      case 'resolved':
        return ticket.status === Status.RESOLVED
      default:
        return true
    }
  })

  // Calcular estadísticas
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === Status.OPEN).length,
    progress: tickets.filter(t => t.status === Status.IN_PROGRESS).length,
    highPriority: tickets.filter(t => t.priority === Priority.HIGH || t.priority === Priority.CRITICAL).length
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    onTicketSelect(ticket)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'bg-green-100 text-green-800'
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      case Priority.HIGH:
        return 'bg-orange-100 text-orange-800'
      case Priority.CRITICAL:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN:
        return 'bg-blue-100 text-blue-800'
      case Status.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800'
      case Status.RESOLVED:
        return 'bg-green-100 text-green-800'
      case Status.CLOSED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Header con filtros */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
              <p className="text-sm text-gray-500">Gestiona todos los tickets del sistema</p>
            </div>
            <button
              onClick={onCreateTicket}
              className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Tabs de navegación */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'open'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abiertos ({stats.open})
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'progress'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Progreso ({stats.progress})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resueltos ({tickets.filter(t => t.status === Status.RESOLVED).length})
            </button>
          </div>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90">Total</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="text-2xl font-bold">{stats.open}</div>
            <div className="text-sm opacity-90">Abiertos</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="text-2xl font-bold">{stats.progress}</div>
            <div className="text-sm opacity-90">En Progreso</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <div className="text-sm opacity-90">Alta Prioridad</div>
          </div>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tickets</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'all' 
                ? 'No hay tickets en el sistema'
                : `No hay tickets ${activeTab === 'open' ? 'abiertos' : activeTab === 'progress' ? 'en progreso' : 'resueltos'}`
              }
            </p>
            <button
              onClick={onCreateTicket}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              Crear Primer Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-base">{ticket.title}</h3>
                      <span className="text-xs text-gray-500">#{ticket.id.slice(-6)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Solicitante: {ticket.requester_id}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="ml-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegación inferior */}
      <MobileBottomNavigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onCreateTicket={onCreateTicket}
        ticketCount={tickets.length}
        userCount={userCount}
      />
    </div>
  )
}

export default MobileTicketsView
