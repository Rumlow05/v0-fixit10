import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, ticketData } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Número de teléfono requerido'
      }, { status: 400 });
    }

    if (!ticketData) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Datos del ticket requeridos'
      }, { status: 400 });
    }

    const isConnected = whatsappService.isWhatsAppConnected();
    
    if (!isConnected) {
      return NextResponse.json({ 
        status: 'error',
        message: 'WhatsApp no está conectado. Conecta primero WhatsApp.'
      }, { status: 400 });
    }

    const success = await whatsappService.sendTicketNotification(phoneNumber, ticketData);
    
    if (success) {
      return NextResponse.json({ 
        status: 'success',
        message: 'Notificación enviada por WhatsApp exitosamente'
      });
    } else {
      return NextResponse.json({ 
        status: 'error',
        message: 'Error al enviar notificación por WhatsApp'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[WhatsApp Send API] Error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
