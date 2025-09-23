import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para eliminar archivos de Vercel Blob
 * DELETE /api/delete-blob
 * Body: { url: "https://..." }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        error: 'URL is required' 
      }, { status: 400 });
    }

    console.log(`[Delete Blob API] Eliminando archivo: ${url}`);

    // Eliminar archivo de Vercel Blob
    await del(url);
    
    console.log(`[Delete Blob API] Archivo eliminado exitosamente: ${url}`);

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Blob API] Error eliminando archivo:', error);
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
