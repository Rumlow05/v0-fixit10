import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Función para enviar notificación por WhatsApp
const sendWhatsAppNotification = async (phoneNumber: string, ticketData: any, type: string) => {
  try {
    const response = await fetch('/api/whatsapp/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        ticketData: {
          ticketId: ticketData.ticketId,
          title: ticketData.title,
          status: ticketData.status,
          priority: ticketData.priority,
          message: ticketData.resolutionMessage || ticketData.deleteMessage,
          type: type
        }
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      console.log('[EmailService] Notificación WhatsApp enviada exitosamente');
    } else {
      console.error('[EmailService] Error enviando WhatsApp:', result.message);
    }
  } catch (error) {
    console.error('[EmailService] Error enviando notificación WhatsApp:', error);
  }
}

interface TicketNotificationData {
  ticketId: string
  title: string
  description: string
  priority: string
  status: string
  assignedTo?: string
  createdBy: string
  createdAt: string
  resolutionMessage?: string
  wasResolved?: boolean
  deleteMessage?: string
  deletedBy?: string
  phoneNumber?: string // Número de teléfono para WhatsApp
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Solo crear el transporter si las credenciales están disponibles
    if (process.env.HOSTINGER_EMAIL_USER && process.env.HOSTINGER_EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.HOSTINGER_EMAIL_USER,
        pass: process.env.HOSTINGER_EMAIL_PASS,
      },
    })
    } else {
      // Crear un transporter mock para evitar errores durante el build
      this.transporter = null as any
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter || !process.env.HOSTINGER_EMAIL_USER || !process.env.HOSTINGER_EMAIL_PASS) {
        console.warn("[EmailService] Email credentials not configured or transporter not available")
        return false
      }

      const mailOptions = {
        from: `"FixIT System" <${process.env.HOSTINGER_EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("[EmailService] Email sent successfully:", result.messageId)
      return true
    } catch (error) {
      console.error("[EmailService] Error sending email:", error)
      return false
    }
  }

  async sendTicketCreatedNotification(data: TicketNotificationData, recipientEmail: string): Promise<boolean> {
    const priorityColor =
      {
        Baja: "#10b981",
        Media: "#f59e0b",
        Alta: "#ef4444",
        Crítica: "#dc2626",
      }[data.priority] || "#6b7280"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Nuevo Ticket Creado</h1>
            </div>
            <div class="content">
              <p>Se ha creado un nuevo ticket en el sistema FixIT:</p>
              
              <div class="ticket-info">
                <h3>${data.title}</h3>
                <p><strong>ID:</strong> ${data.ticketId}</p>
                <p><strong>Descripción:</strong> ${data.description}</p>
                <p><strong>Prioridad:</strong> <span class="priority" style="background-color: ${priorityColor}">${data.priority}</span></p>
                <p><strong>Estado:</strong> ${data.status}</p>
                <p><strong>Creado por:</strong> ${data.createdBy}</p>
                <p><strong>Fecha:</strong> ${new Date(data.createdAt).toLocaleString("es-ES")}</p>
                ${data.assignedTo ? `<p><strong>Asignado a:</strong> ${data.assignedTo}</p>` : ""}
              </div>
              
              <p>Puedes revisar y gestionar este ticket accediendo al sistema FixIT.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema FixIT</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await this.sendEmail({
      to: recipientEmail,
      subject: `[FixIT] Nuevo Ticket: ${data.title}`,
      html,
      text: `Nuevo ticket creado: ${data.title}\nID: ${data.ticketId}\nPrioridad: ${data.priority}\nDescripción: ${data.description}`,
    })

    // Enviar notificación por WhatsApp si hay número de teléfono
    if (data.phoneNumber) {
      await sendWhatsAppNotification(data.phoneNumber, data, 'created')
    }

    return emailResult
  }

  async sendTicketUpdatedNotification(
    data: TicketNotificationData,
    recipientEmail: string,
    updateType: string,
  ): Promise<boolean> {
    const priorityColor =
      {
        Baja: "#10b981",
        Media: "#f59e0b",
        Alta: "#ef4444",
        Crítica: "#dc2626",
      }[data.priority] || "#6b7280"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Ticket Actualizado</h1>
            </div>
            <div class="content">
              <p>El ticket <strong>${data.ticketId}</strong> ha sido actualizado:</p>
              
              <div class="ticket-info">
                <h3>${data.title}</h3>
                <p><strong>Tipo de actualización:</strong> ${updateType}</p>
                <p><strong>Estado actual:</strong> ${data.status}</p>
                <p><strong>Prioridad:</strong> <span class="priority" style="background-color: ${priorityColor}">${data.priority}</span></p>
                ${data.assignedTo ? `<p><strong>Asignado a:</strong> ${data.assignedTo}</p>` : ""}
                ${data.resolutionMessage ? `
                  <div style="margin-top: 15px; padding: 10px; background-color: ${data.wasResolved ? '#d1fae5' : '#fee2e2'}; border-radius: 6px; border-left: 4px solid ${data.wasResolved ? '#10b981' : '#ef4444'};">
                    <p><strong>${data.wasResolved ? '✅ Problema Resuelto' : '❌ Problema No Resuelto'}</strong></p>
                    <p><strong>Mensaje de resolución:</strong></p>
                    <p style="margin-top: 5px; font-style: italic;">${data.resolutionMessage}</p>
                  </div>
                ` : ""}
                ${data.deleteMessage ? `
                  <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <p><strong>🗑️ Ticket Eliminado</strong></p>
                    <p><strong>Eliminado por:</strong> ${data.deletedBy || 'Administrador'}</p>
                    <p><strong>Motivo de eliminación:</strong></p>
                    <p style="margin-top: 5px; font-style: italic;">${data.deleteMessage}</p>
                  </div>
                ` : ""}
              </div>
              
              <p>Puedes revisar los detalles completos accediendo al sistema FixIT.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema FixIT</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await this.sendEmail({
      to: recipientEmail,
      subject: `[FixIT] Actualización de Ticket: ${data.title}`,
      html,
      text: `Ticket actualizado: ${data.title}\nID: ${data.ticketId}\nTipo: ${updateType}\nEstado: ${data.status}`,
    })

    // Enviar notificación por WhatsApp si hay número de teléfono
    if (data.phoneNumber) {
      let whatsappType = 'updated'
      if (data.resolutionMessage) {
        whatsappType = 'resolved'
      } else if (data.deleteMessage) {
        whatsappType = 'deleted'
      }
      await sendWhatsAppNotification(data.phoneNumber, data, whatsappType)
    }

    return emailResult
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .access-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #10b981, #059669); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold; 
              font-size: 16px; 
              margin: 20px 0;
              box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
              transition: all 0.3s ease;
            }
            .access-button:hover { 
              background: linear-gradient(135deg, #059669, #047857); 
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
            }
            .instructions { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .instructions h3 { color: #10b981; margin-top: 0; }
            .instructions ol { padding-left: 20px; }
            .instructions li { margin-bottom: 8px; }
            .credentials { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #bbf7d0; }
            .credentials strong { color: #166534; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .feature-icon { font-size: 24px; margin-bottom: 10px; }
            @media (max-width: 600px) {
              .features { grid-template-columns: 1fr; }
              .container { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Bienvenido a FixIT!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Sistema de Gestión de Tickets</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2 style="color: #10b981; margin-top: 0;">Hola ${userName},</h2>
                <p style="font-size: 16px; margin-bottom: 20px;">Tu cuenta ha sido creada exitosamente en el sistema FixIT.</p>
                <p style="font-size: 16px; margin-bottom: 25px;">Ahora puedes acceder a la plataforma y comenzar a gestionar tickets de soporte de manera eficiente.</p>
                
                <a href="https://dashboard.emprendetucarrera.com.co/" class="access-button">
                  🚀 Acceder a FixIT
                </a>
              </div>
              
              <div class="credentials">
                <h3 style="color: #166534; margin-top: 0;">📧 Tus Credenciales de Acceso:</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Contraseña:</strong> La misma que usaste para registrarte</p>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;"><em>Si no recuerdas tu contraseña, contacta al administrador del sistema.</em></p>
              </div>
              
              <div class="instructions">
                <h3>📋 Cómo Acceder a la Plataforma:</h3>
                <ol>
                  <li><strong>Haz clic en el botón "Acceder a FixIT"</strong> de arriba, o visita: <a href="https://dashboard.emprendetucarrera.com.co/" style="color: #10b981;">https://dashboard.emprendetucarrera.com.co/</a></li>
                  <li><strong>Ingresa tu email:</strong> ${userEmail}</li>
                  <li><strong>Ingresa tu contraseña</strong> (la misma que usaste para registrarte)</li>
                  <li><strong>Haz clic en "Iniciar Sesión"</strong></li>
                  <li><strong>¡Listo!</strong> Ya puedes comenzar a usar FixIT</li>
                </ol>
              </div>
              
              <h3 style="color: #10b981; text-align: center;">✨ ¿Qué puedes hacer en FixIT?</h3>
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🎫</div>
                  <h4>Crear Tickets</h4>
                  <p>Reporta problemas y solicita soporte técnico</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h4>Seguimiento</h4>
                  <p>Monitorea el estado de tus tickets en tiempo real</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📧</div>
                  <h4>Notificaciones</h4>
                  <p>Recibe actualizaciones por email automáticamente</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">⚡</div>
                  <h4>Gestión</h4>
                  <p>Asigna prioridades y gestiona múltiples tickets</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #10b981; font-weight: bold;">¡Esperamos que tengas una excelente experiencia usando FixIT!</p>
                <p style="font-size: 14px; color: #6b7280;">Si tienes alguna pregunta, no dudes en contactar al equipo de soporte.</p>
              </div>
            </div>
            <div class="footer">
              <p><strong>Equipo FixIT</strong> - Sistema de Gestión de Tickets</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Este es un email automático, por favor no responder directamente.<br>
                Para soporte técnico, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: userEmail,
      subject: "¡Bienvenido a FixIT!",
      html,
      text: `¡Bienvenido a FixIT, ${userName}! Tu cuenta ha sido creada exitosamente.`,
    })
  }
}

export const emailService = new EmailService()
