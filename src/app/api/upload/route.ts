
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    const storageRef = ref(storage, path);
    
    // Directly upload the file Blob, which is more efficient
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('Error en la subida de archivo:', e);
    return NextResponse.json({ error: 'Error al subir el archivo.', details: e.message, stack: e.stack }, { status: 500 });
  }
}

    