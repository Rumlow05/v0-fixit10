"use client"

import React from 'react'
import { User } from '@/types'

interface MobileHeaderProps {
  currentUser: User | null
  onMenuClick: () => void
  isSyncing: boolean
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ currentUser, onMenuClick, isSyncing }) => {
  return (
    <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-3 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 active:bg-gray-300/80 transition-all duration-200 active:scale-95"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h1 className="text-lg font-bold text-gray-900">FixIT</h1>
            <p className="text-xs text-gray-500">Sistema de Tickets</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isSyncing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
            <span className="text-xs font-medium text-emerald-700">Sincronizando</span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {currentUser?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{currentUser?.name}</div>
            <div className="text-xs text-gray-500">{currentUser?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader
