import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    console.log("[v0] Sending registration email to:", email)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.HOSTINGER_EMAIL_USER,
        pass: process.env.HOSTINGER_EMAIL_PASS,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.HOSTINGER_EMAIL_USER,
      to: email,
      subject: "Bienvenido al Sistema FixIT - Acceso Concedido",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">FixIT</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión de Tickets</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">¡Bienvenido al sistema!</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hola <strong>${name}</strong>,
            </p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Te damos la bienvenida al sistema FixIT. Tu cuenta ha sido creada exitosamente y ya tienes acceso completo a la plataforma.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Detalles de tu cuenta:</h3>
              <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Nombre:</strong> ${name}</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Ahora puedes acceder al sistema utilizando tu dirección de correo electrónico. El sistema te permitirá:
            </p>
            
            <ul style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              <li>Crear y gestionar tickets de soporte</li>
              <li>Seguir el estado de tus solicitudes</li>
              <li>Comunicarte con el equipo técnico</li>
              <li>Acceder al historial completo de tickets</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Acceder al Sistema
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
            </p>
            
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
              Este es un mensaje automático, por favor no respondas a este correo.
            </p>
          </div>
        </div>
      `,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    console.log("[v0] Registration email sent successfully:", info.messageId)

    return NextResponse.json({
      success: true,
      message: "Email de registro enviado exitosamente",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("[v0] Error sending registration email:", error)

    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"

    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar email de registro",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
