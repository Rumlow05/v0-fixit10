import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

class WhatsAppService {
  private client: Client | null = null;
  private isConnected = false;
  private qrCode: string | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: "fixit-whatsapp-client"
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('[WhatsApp] Error inicializando cliente:', error);
    }
  }

  private setupEventListeners() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      console.log('[WhatsApp] QR Code generado');
      try {
        this.qrCode = await qrcode.toDataURL(qr);
        console.log('[WhatsApp] QR Code convertido a base64');
      } catch (error) {
        console.error('[WhatsApp] Error generando QR Code:', error);
      }
    });

    this.client.on('ready', () => {
      console.log('[WhatsApp] Cliente conectado y listo');
      this.isConnected = true;
      this.qrCode = null;
    });

    this.client.on('authenticated', () => {
      console.log('[WhatsApp] Cliente autenticado');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('[WhatsApp] Error de autenticación:', msg);
      this.isConnected = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('[WhatsApp] Cliente desconectado:', reason);
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('Cliente de WhatsApp no inicializado'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout al conectar WhatsApp'));
      }, 60000); // 60 segundos timeout

      this.client.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('auth_failure', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.client.initialize().catch(reject);
    });

    return this.connectionPromise;
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  isWhatsAppConnected(): boolean {
    return this.isConnected;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.error('[WhatsApp] Cliente no conectado');
      return false;
    }

    try {
      // Formatear número de teléfono (agregar código de país si no lo tiene)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedNumber) {
        console.error('[WhatsApp] Número de teléfono inválido:', phoneNumber);
        return false;
      }

      const chatId = `${formattedNumber}@c.us`;
      
      await this.client.sendMessage(chatId, message);
      console.log('[WhatsApp] Mensaje enviado exitosamente a:', formattedNumber);
      return true;
    } catch (error) {
      console.error('[WhatsApp] Error enviando mensaje:', error);
      return false;
    }
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
    if (!phoneNumber) {
      console.log('[WhatsApp] No hay número de teléfono para enviar notificación');
      return false;
    }

    let message = '';
    
    switch (ticketData.type) {
      case 'created':
        message = `🎫 *Nuevo Ticket Creado*\n\n` +
                 `*ID:* ${ticketData.ticketId}\n` +
                 `*Título:* ${ticketData.title}\n` +
                 `*Prioridad:* ${ticketData.priority}\n` +
                 `*Estado:* ${ticketData.status}\n\n` +
                 `Tu ticket ha sido creado exitosamente. Te mantendremos informado sobre su progreso.`;
        break;
        
      case 'updated':
        message = `🔄 *Ticket Actualizado*\n\n` +
                 `*ID:* ${ticketData.ticketId}\n` +
                 `*Título:* ${ticketData.title}\n` +
                 `*Estado:* ${ticketData.status}\n` +
                 `*Prioridad:* ${ticketData.priority}\n\n` +
                 `Tu ticket ha sido actualizado. Revisa los detalles en el sistema.`;
        break;
        
      case 'resolved':
        message = `✅ *Ticket Resuelto*\n\n` +
                 `*ID:* ${ticketData.ticketId}\n` +
                 `*Título:* ${ticketData.title}\n` +
                 `*Estado:* ${ticketData.status}\n\n` +
                 `*Mensaje de resolución:*\n${ticketData.message || 'Problema resuelto exitosamente'}\n\n` +
                 `¡Gracias por usar nuestro servicio de soporte!`;
        break;
        
      case 'deleted':
        message = `🗑️ *Ticket Eliminado*\n\n` +
                 `*ID:* ${ticketData.ticketId}\n` +
                 `*Título:* ${ticketData.title}\n\n` +
                 `*Motivo de eliminación:*\n${ticketData.message || 'Ticket eliminado por políticas del sistema'}\n\n` +
                 `Si tienes dudas, contacta al administrador.`;
        break;
    }

    return await this.sendMessage(phoneNumber, message);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      this.qrCode = null;
    }
  }
}

// Instancia singleton
export const whatsappService = new WhatsAppService();
