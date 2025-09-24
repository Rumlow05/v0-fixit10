import React from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

interface DarkModeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        ${sizeClasses[size]}
        relative rounded-xl
        bg-gray-100 dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        group
        ${className}
      `}
      title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {/* Icono de sol (modo claro) */}
      <svg
        className={`
          ${iconSizes[size]}
          absolute transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'opacity-0 rotate-90 scale-0' 
            : 'opacity-100 rotate-0 scale-100'
          }
          text-yellow-500
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Icono de luna (modo oscuro) */}
      <svg
        className={`
          ${iconSizes[size]}
          absolute transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }
          text-blue-400
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Efecto de hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
}

export default DarkModeToggle
