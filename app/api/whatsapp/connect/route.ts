import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    // Verificar si el servicio está disponible
    if (!whatsappService.isServiceAvailable()) {
      return NextResponse.json({ 
        status: 'unavailable',
        message: 'WhatsApp no está disponible en este entorno. Solo funciona en desarrollo local.',
        isAvailable: false
      });
    }

    const isConnected = whatsappService.isWhatsAppConnected();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'connected',
        message: 'WhatsApp ya está conectado',
        isAvailable: true
      });
    }

    const qrCode = whatsappService.getQRCode();
    
    if (qrCode) {
      return NextResponse.json({ 
        status: 'qr_ready',
        qrCode: qrCode,
        message: 'QR Code generado. Escanea con WhatsApp para conectar.',
        isAvailable: true
      });
    }

    // Intentar conectar si no hay QR
    try {
      await whatsappService.connect();
      return NextResponse.json({ 
        status: 'connecting',
        message: 'Conectando a WhatsApp...',
        isAvailable: true
      });
    } catch (error) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Error al conectar con WhatsApp',
        error: error instanceof Error ? error.message : 'Error desconocido',
        isAvailable: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[WhatsApp API] Error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido',
      isAvailable: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'connect':
        await whatsappService.connect();
        return NextResponse.json({ 
          status: 'success',
          message: 'Iniciando conexión a WhatsApp'
        });
        
      case 'disconnect':
        await whatsappService.disconnect();
        return NextResponse.json({ 
          status: 'success',
          message: 'WhatsApp desconectado'
        });
        
      default:
        return NextResponse.json({ 
          status: 'error',
          message: 'Acción no válida'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[WhatsApp API] Error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
