"use client"

import React, { useState, useEffect } from 'react'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Mostrar notificación con animación
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-ocultar después de la duración
    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onClose(id), 300) // Esperar animación de salida
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 300)
  }


  const getNotificationStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '350px',
      minWidth: '300px',
      width: 'auto',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      border: '1px solid',
      transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isLeaving ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          color: '#166534'
        }
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#991b1b'
        }
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fffbeb',
          borderColor: '#fed7aa',
          color: '#92400e'
        }
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          color: '#1e40af'
        }
    }
  }

  const getIconStyles = () => {
    const baseStyles = {
      flexShrink: 0,
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#dcfce7',
          color: '#16a34a'
        }
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fee2e2',
          color: '#dc2626'
        }
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fef3c7',
          color: '#d97706'
        }
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#dbeafe',
          color: '#2563eb'
        }
    }
  }

  return (
    <div style={getNotificationStyles()}>
      <div style={getIconStyles()}>
        {type === 'success' && (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'error' && (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'warning' && (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'info' && (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 600, 
          lineHeight: '1.4',
          wordBreak: 'break-word' as const
        }}>
          {title}
        </h3>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '14px', 
          lineHeight: '1.5',
          opacity: 0.9,
          wordBreak: 'break-word' as const
        }}>
          {message}
        </p>
      </div>
      
      <button
        onClick={handleClose}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: '4px',
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        aria-label="Cerrar notificación"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default Notification
