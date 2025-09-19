"use client"

import React from 'react'
import { User, Role } from '@/types'

interface MobileBottomNavigationProps {
  currentView: string
  setCurrentView: (view: string) => void
  currentUser: User | null
  onCreateTicket: () => void
  ticketCount?: number
  userCount?: number
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  onCreateTicket,
  ticketCount = 0,
  userCount = 0
}) => {
  const navigationItems = [
    {
      id: 'tickets',
      label: 'Tickets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: ticketCount > 0 ? ticketCount : undefined
    },
    {
      id: 'resolved',
      label: 'Resueltos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  // Añadir gestión de usuarios solo para administradores
  if (currentUser?.role === Role.ADMIN) {
    navigationItems.push({
      id: 'users',
      label: 'Usuarios',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      badge: userCount > 0 ? userCount : undefined
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-40 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 relative ${
              currentView === item.id
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </button>
        ))}
        
        {/* Botón flotante para crear ticket */}
        <button
          onClick={onCreateTicket}
          className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        >
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1">Nuevo</span>
        </button>
      </div>
    </div>
  )
}

export default MobileBottomNavigation
