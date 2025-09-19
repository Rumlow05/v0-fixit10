"use client"

import React from 'react'
import { User, Role } from '@/types'

interface MobileSidebarProps {
  currentUser: User | null
  currentView: string
  setCurrentView: (view: string) => void
  onLogout: () => void
  setCreateTicketModalOpen: (open: boolean) => void
  setIsWhatsAppAdminOpen: (open: boolean) => void
  isSyncing: boolean
  isOpen: boolean
  onClose: () => void
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  currentUser, 
  currentView, 
  setCurrentView, 
  onLogout, 
  setCreateTicketModalOpen, 
  setIsWhatsAppAdminOpen, 
  isSyncing,
  isOpen,
  onClose
}) => {
  // Iconos como componentes
  const IconTickets = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )

  const IconUsers = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )

  const IconLogout = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )

  const handleNavClick = (view: string) => {
    setCurrentView(view)
    onClose() // Cerrar sidebar en móvil después de navegar
  }

  const handleActionClick = (action: () => void) => {
    action()
    onClose() // Cerrar sidebar en móvil después de acción
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-out">
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FixIT</h1>
                <p className="text-sm text-emerald-600 font-medium">Sistema de Tickets</p>
              </div>
            </div>
            
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-white/80 hover:bg-white active:bg-gray-100 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {isSyncing && (
            <div className="flex items-center gap-3 text-sm mt-4 px-4 py-3 bg-white/80 rounded-xl border border-emerald-200/50">
              <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
              <span className="text-emerald-700 font-medium">Sincronizando datos...</span>
            </div>
          )}
        </div>

        <nav className="flex-grow p-6">
          <div className="space-y-3">
            <button
              onClick={() => handleNavClick("tickets")}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold transition-all duration-300 ${
                currentView === "tickets" 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                  : "text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80"
              }`}
            >
              <div className={`p-2 rounded-xl ${currentView === "tickets" ? "bg-white/20" : "bg-gray-100"}`}>
                <IconTickets />
              </div>
              <span className="text-base">Tickets</span>
            </button>
            
            <button
              onClick={() => handleNavClick("resolved")}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold transition-all duration-300 ${
                currentView === "resolved" 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                  : "text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80"
              }`}
            >
              <div className={`p-2 rounded-xl ${currentView === "resolved" ? "bg-white/20" : "bg-gray-100"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-base">Tickets Resueltos</span>
            </button>
            
            {currentUser?.role === Role.ADMIN && (
              <button
                onClick={() => handleNavClick("users")}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold transition-all duration-300 ${
                  currentView === "users" 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                    : "text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80"
                }`}
              >
                <div className={`p-2 rounded-xl ${currentView === "users" ? "bg-white/20" : "bg-gray-100"}`}>
                  <IconUsers />
                </div>
                <span className="text-base">Gestionar Usuarios</span>
              </button>
            )}

            {/* Botón de WhatsApp solo para tech@emprendetucarrera.com.co */}
            {currentUser?.email === "tech@emprendetucarrera.com.co" && (
              <button
                onClick={() => handleActionClick(() => setIsWhatsAppAdminOpen(true))}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80 transition-all duration-300"
              >
                <div className="p-2 rounded-xl bg-gray-100">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <span className="text-base">WhatsApp Admin</span>
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Acciones Rápidas</div>
            <button
              onClick={() => handleActionClick(() => setCreateTicketModalOpen(true))}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold text-emerald-600 hover:bg-emerald-50/80 active:bg-emerald-100/80 transition-all duration-300 border border-emerald-200/50"
            >
              <div className="p-2 rounded-xl bg-emerald-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-base">Nuevo Ticket</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{currentUser?.name}</div>
                <div className="text-xs text-gray-600">{currentUser?.role}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100/80 rounded-lg px-3 py-2">
              {currentUser?.email}
            </div>
          </div>
          <button
            onClick={() => handleActionClick(onLogout)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold text-red-600 hover:bg-red-50/80 active:bg-red-100/80 transition-all duration-300 border border-red-200/50"
          >
            <div className="p-2 rounded-xl bg-red-100">
              <IconLogout />
            </div>
            <span className="text-base">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default MobileSidebar
