import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para subir archivos a Vercel Blob
 * POST /api/upload?filename=archivo.pdf&ticketId=123
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const ticketId = searchParams.get('ticketId');

    if (!filename || !ticketId) {
      return NextResponse.json({ 
        error: 'Filename and ticketId are required' 
      }, { status: 400 });
    }

    console.log(`[Upload API] Subiendo archivo: ${filename} para ticket: ${ticketId}`);

    // Subir archivo a Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: true, // Evita conflictos de nombres
    });

    console.log(`[Upload API] Archivo subido exitosamente:`, {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt
    });
  } catch (error) {
    console.error('[Upload API] Error subiendo archivo:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
