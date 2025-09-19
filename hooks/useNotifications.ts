"use client"

import { useState, useCallback } from 'react'

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: NotificationData = {
      id,
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Métodos de conveniencia para diferentes tipos de notificaciones
  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
