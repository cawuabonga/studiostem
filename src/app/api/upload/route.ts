import { NextResponse, type NextRequest } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { serviceAccount } from '@/config/firebase-admin';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'stem-v2-4y6a0.appspot.com',
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    const bucket = getStorage().bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const fileUpload = bucket.file(path);

    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public and get its URL
    await fileUpload.makePublic();
    const downloadURL = fileUpload.publicUrl();

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('[API_ERROR] Error in file upload endpoint:', e);
    const errorMessage = e.message || 'Error al subir el archivo.';
    const errorDetails = e.code ? `Code: ${e.code}` : e.toString();
    
    return NextResponse.json({ 
        error: errorMessage, 
        details: errorDetails, 
        stack: e.stack 
    }, { status: 500 });
  }
}
