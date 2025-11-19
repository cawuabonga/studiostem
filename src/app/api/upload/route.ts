
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { NextRequest } from 'next/server';
import { getApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Ensure Firebase is initialized
const app = getApps().length ? getApp() : undefined; 

export async function POST(req: NextRequest) {
  if (!app) {
     return NextResponse.json({ error: 'Firebase app not initialized.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    // Explicitly get storage instance with the correct bucket URL for server-side operations
    const serverStorage = getStorage(app, 'gs://stem-v2-4y6a0.appspot.com');
    const storageRef = ref(serverStorage, path);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);

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
