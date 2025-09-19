"use client"

import React from 'react'
import Notification, { NotificationProps } from './Notification'

interface NotificationContainerProps {
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }>
  onRemoveNotification: (id: string) => void
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemoveNotification
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <Notification
            {...notification}
            onClose={onRemoveNotification}
          />
        </div>
      ))}
    </div>
  )
}

export default NotificationContainer
