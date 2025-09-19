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
    <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">FixIT</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isSyncing && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
            <span className="hidden sm:inline">Sincronizando...</span>
          </div>
        )}
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
          <div className="text-xs text-gray-500">{currentUser?.role}</div>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader
