
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[API_DEBUG] /api/upload endpoint hit.');
  try {
    const formData = await req.formData();
    console.log('[API_DEBUG] FormData received.');

    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    console.log('[API_DEBUG] Extracted file:', file ? `${file.name} (${file.size} bytes)` : 'null');
    console.log('[API_DEBUG] Extracted path:', path);

    if (!file || !path) {
      console.error('[API_ERROR] Missing file or path.');
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    const storageRef = ref(storage, path);
    console.log('[API_DEBUG] Created storage reference for path:', path);
    
    console.log('[API_DEBUG] Starting uploadBytes...');
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    console.log('[API_DEBUG] uploadBytes completed.');

    console.log('[API_DEBUG] Starting getDownloadURL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[API_DEBUG] getDownloadURL completed. URL:', downloadURL);

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('[API_ERROR] Error in file upload endpoint:', e);
    console.error('[API_ERROR] Error stack:', e.stack);
    return NextResponse.json({ error: 'Error al subir el archivo.', details: e.message, stack: e.stack }, { status: 500 });
  }
}
