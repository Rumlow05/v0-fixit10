import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    const isConnected = whatsappService.isWhatsAppConnected();
    const qrCode = whatsappService.getQRCode();
    
    return NextResponse.json({ 
      status: 'success',
      data: {
        isConnected,
        qrCode: qrCode,
        needsQR: !isConnected && !qrCode
      }
    });
  } catch (error) {
    console.error('[WhatsApp Status API] Error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error al obtener estado de WhatsApp',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
