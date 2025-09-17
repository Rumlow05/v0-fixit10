// Servicio de WhatsApp compatible con Vercel
// En producción, este servicio no está disponible

class WhatsAppService {
  private client: any = null;
  private isConnected = false;
  private qrCode: string | null = null;
  private connectionPromise: Promise<void> | null = null;
  private isAvailable = false;

  constructor() {
    // En Vercel/producción, WhatsApp no está disponible
    this.isAvailable = false;
    console.log('[WhatsApp] Servicio no disponible en este entorno (Vercel/Producción)');
  }

  private initializeClient() {
    // No hacer nada en producción
    console.log('[WhatsApp] Inicialización no disponible en este entorno');
  }

  private setupEventListeners() {
    // No hacer nada en producción
    console.log('[WhatsApp] Event listeners no disponibles en este entorno');
  }

  async connect(): Promise<void> {
    // En producción, no hacer nada
    console.log('[WhatsApp] Conexión no disponible en este entorno');
    return Promise.resolve();
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  isWhatsAppConnected(): boolean {
    return this.isAvailable && this.isConnected;
  }

  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    // En producción, no enviar mensajes
    console.log('[WhatsApp] Envío de mensajes no disponible en este entorno');
    return false;
  }

  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remover espacios, guiones y paréntesis
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Si no tiene código de país, agregar +57 (Colombia) por defecto
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('57')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+57' + cleaned;
      }
    }
    
    // Validar que sea un número válido
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleaned)) {
      return null;
    }
    
    return cleaned;
  }

  async sendTicketNotification(
    phoneNumber: string,
    ticketData: {
      ticketId: string;
      title: string;
      status: string;
      priority: string;
      message?: string;
      type: 'created' | 'updated' | 'resolved' | 'deleted';
    }
  ): Promise<boolean> {
    // En producción, no enviar notificaciones
    console.log('[WhatsApp] Notificaciones no disponibles en este entorno');
    return false;
  }

  async disconnect(): Promise<void> {
    // En producción, no hacer nada
    console.log('[WhatsApp] Desconexión no disponible en este entorno');
    return Promise.resolve();
  }
}

// Instancia singleton
export const whatsappService = new WhatsAppService();
