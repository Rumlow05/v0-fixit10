import { useState, useEffect, useContext, createContext, ReactNode } from 'react'

// Tipos para el contexto
interface DarkModeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
}

// Crear contexto
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

// Provider del contexto
export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Cargar preferencia del usuario al inicializar
  useEffect(() => {
    const savedTheme = localStorage.getItem('fixit-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      setIsDarkMode(prefersDark)
    }
  }, [])

  // Aplicar tema al DOM
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Guardar preferencia
    localStorage.setItem('fixit-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode debe ser usado dentro de un DarkModeProvider')
  }
  return context
}
