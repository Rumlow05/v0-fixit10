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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; text-align: center; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Bienvenido a FixIT!</h1>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2>Hola ${userName},</h2>
                <p>Tu cuenta ha sido creada exitosamente en el sistema FixIT.</p>
                <p>Ahora puedes crear y gestionar tickets de soporte de manera eficiente.</p>
              </div>
              
              <h3>¿Qué puedes hacer en FixIT?</h3>
              <ul>
                <li>Crear tickets de soporte</li>
                <li>Hacer seguimiento del estado de tus tickets</li>
                <li>Recibir notificaciones por email</li>
                <li>Gestionar prioridades y asignaciones</li>
              </ul>
              
              <p>¡Esperamos que tengas una excelente experiencia usando FixIT!</p>
            </div>
            <div class="footer">
              <p>Equipo FixIT - Sistema de Gestión de Tickets</p>
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
