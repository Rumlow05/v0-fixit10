// Servicio de sincronización para datos entre dispositivos
// Evita problemas de cache y localStorage

export interface SyncEvent {
  type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_DELETED' | 'FORCE_SYNC'
  data: any
  timestamp: string
  deviceId: string
}

export interface SyncResponse {
  success: boolean
  data?: any
  error?: string
  lastSync?: string
}

class SyncService {
  private deviceId: string
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncTime: string | null = null
  private isOnline: boolean = true

  constructor() {
    // Generar ID único para este dispositivo
    this.deviceId = this.generateDeviceId()
    this.setupOnlineStatusListener()
  }

  private generateDeviceId(): string {
    // Generar ID único basado en timestamp y random
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `device-${timestamp}-${random}`
  }

  private setupOnlineStatusListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        console.log('[SyncService] Device is online')
        this.triggerSync()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        console.log('[SyncService] Device is offline')
      })
    }
  }

  // Iniciar sincronización automática
  startAutoSync(callback: () => Promise<void>, intervalMs: number = 3000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        try {
          await callback()
          this.lastSyncTime = new Date().toISOString()
        } catch (error) {
          console.error('[SyncService] Auto sync failed:', error)
        }
      }
    }, intervalMs)

    console.log(`[SyncService] Auto sync started every ${intervalMs}ms`)
  }

  // Detener sincronización automática
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('[SyncService] Auto sync stopped')
    }
  }

  // Crear evento de sincronización
  createSyncEvent(type: SyncEvent['type'], data: any): SyncEvent {
    return {
      type,
      data,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId
    }
  }

  // Enviar evento de sincronización
  async sendSyncEvent(event: SyncEvent): Promise<SyncResponse> {
    try {
      // Guardar evento en localStorage para otros dispositivos
      if (typeof window !== 'undefined') {
        const events = this.getStoredEvents()
        events.push(event)
        
        // Mantener solo los últimos 50 eventos
        if (events.length > 50) {
          events.splice(0, events.length - 50)
        }
        
        localStorage.setItem('fixit_sync_events', JSON.stringify(events))
        
        // Disparar evento personalizado para otros tabs del mismo navegador
        window.dispatchEvent(new CustomEvent('fixit-sync-event', { detail: event }))
      }

      return {
        success: true,
        data: event,
        lastSync: new Date().toISOString()
      }
    } catch (error) {
      console.error('[SyncService] Failed to send sync event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Obtener eventos almacenados
  getStoredEvents(): SyncEvent[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('fixit_sync_events')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[SyncService] Failed to get stored events:', error)
      return []
    }
  }

  // Limpiar eventos antiguos
  cleanOldEvents(maxAgeHours: number = 24): void {
    if (typeof window === 'undefined') return

    const events = this.getStoredEvents()
    const now = new Date()
    const cutoffTime = new Date(now.getTime() - (maxAgeHours * 60 * 60 * 1000))

    const cleanedEvents = events.filter(event => {
      const eventTime = new Date(event.timestamp)
      return eventTime > cutoffTime
    })

    if (cleanedEvents.length !== events.length) {
      localStorage.setItem('fixit_sync_events', JSON.stringify(cleanedEvents))
      console.log(`[SyncService] Cleaned ${events.length - cleanedEvents.length} old events`)
    }
  }

  // Escuchar eventos de sincronización
  onSyncEvent(callback: (event: SyncEvent) => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleSyncEvent = (event: CustomEvent) => {
      callback(event.detail)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fixit_sync_events' && e.newValue) {
        try {
          const events: SyncEvent[] = JSON.parse(e.newValue)
          const latestEvent = events[events.length - 1]
          if (latestEvent && latestEvent.deviceId !== this.deviceId) {
            callback(latestEvent)
          }
        } catch (error) {
          console.error('[SyncService] Failed to parse storage event:', error)
        }
      }
    }

    window.addEventListener('fixit-sync-event', handleSyncEvent as EventListener)
    window.addEventListener('storage', handleStorageChange)

    // Retornar función de limpieza
    return () => {
      window.removeEventListener('fixit-sync-event', handleSyncEvent as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  // Forzar sincronización inmediata
  async triggerSync(): Promise<void> {
    const event = this.createSyncEvent('FORCE_SYNC', { deviceId: this.deviceId })
    await this.sendSyncEvent(event)
  }

  // Obtener información del dispositivo
  getDeviceInfo(): { deviceId: string; lastSync: string | null; isOnline: boolean } {
    return {
      deviceId: this.deviceId,
      lastSync: this.lastSyncTime,
      isOnline: this.isOnline
    }
  }

  // Verificar si hay cambios pendientes
  hasPendingChanges(): boolean {
    const events = this.getStoredEvents()
    return events.some(event => event.deviceId !== this.deviceId)
  }
}

// Instancia singleton
export const syncService = new SyncService()

// Función helper para crear eventos comunes
export const createUserEvent = (type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED', user: any) => {
  return syncService.createSyncEvent(type, user)
}

export const createTicketEvent = (type: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_DELETED', ticket: any) => {
  return syncService.createSyncEvent(type, ticket)
}
