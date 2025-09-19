"use client"

import React, { useState } from 'react'
import { Ticket, User, Role, Status, Priority } from '@/types'
import { useMobile } from '@/hooks/useMobile'

interface MobileTicketsViewProps {
  tickets: Ticket[]
  currentUser: User | null
  onCreateTicket: () => void
  onTicketSelect: (ticket: Ticket) => void
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void
  onTicketDelete: (ticketId: string) => void
  isLoading: boolean
}

const MobileTicketsView: React.FC<MobileTicketsViewProps> = ({
  tickets,
  currentUser,
  onCreateTicket,
  onTicketSelect,
  onTicketUpdate,
  onTicketDelete,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'progress' | 'resolved'>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Filtrar tickets según la pestaña activa y el rol del usuario
  const filteredTickets = tickets.filter(ticket => {
    // Filtrar por rol del usuario
    const isUserRole = currentUser?.role === Role.USER
    if (isUserRole && ticket.requester_id !== currentUser?.id) {
      return false // Los usuarios solo ven sus propios tickets
    }
    
    // Filtrar por estado según la pestaña activa
    switch (activeTab) {
      case 'open':
        return ticket.status === Status.OPEN
      case 'progress':
        return ticket.status === Status.IN_PROGRESS
      case 'resolved':
        return ticket.status === Status.RESOLVED || ticket.status === Status.CLOSED
      default:
        return true
    }
  })

  // Calcular estadísticas (respetando el filtro de rol)
  const isUserRole = currentUser?.role === Role.USER
  const userTickets = isUserRole ? tickets.filter(t => t.requester_id === currentUser?.id) : tickets
  
  const stats = {
    total: userTickets.length,
    open: userTickets.filter(t => t.status === Status.OPEN).length,
    progress: userTickets.filter(t => t.status === Status.IN_PROGRESS).length,
    highPriority: userTickets.filter(t => t.priority === Priority.HIGH || t.priority === Priority.CRITICAL).length
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

          {/* Filtros mejorados */}
          <div className="space-y-3">
            {/* Filtros principales */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'all' ? 'bg-white' : 'bg-gray-400'}`}></div>
                Todos
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('open')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'open'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'open' ? 'bg-white' : 'bg-blue-400'}`}></div>
                Abiertos
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'open' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  {stats.open}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'progress'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'progress' ? 'bg-white' : 'bg-orange-400'}`}></div>
                En Progreso
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'progress' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {stats.progress}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'resolved'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'resolved' ? 'bg-white' : 'bg-green-400'}`}></div>
                Resueltos
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'resolved' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  {userTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED).length}
                </span>
              </button>
            </div>

            {/* Filtros adicionales por prioridad */}
            <div className="flex gap-2 overflow-x-auto">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Crítica
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                  {userTickets.filter(t => t.priority === Priority.CRITICAL).length}
                </span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Alta
                <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">
                  {userTickets.filter(t => t.priority === Priority.HIGH).length}
                </span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Media
                <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-bold">
                  {userTickets.filter(t => t.priority === Priority.MEDIUM).length}
                </span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Baja
                <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 font-bold">
                  {userTickets.filter(t => t.priority === Priority.LOW).length}
                </span>
              </button>
            </div>
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
    </div>
  )
}

export default MobileTicketsView
