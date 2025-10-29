
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    // Convert the file to a buffer in memory
    const fileBuffer = await file.arrayBuffer();

    // Create a reference in Firebase Storage
    const storageRef = ref(storage, `${path}/${file.name}`);

    // Upload the file buffer from memory
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type || undefined,
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('Error en la subida de archivo:', e);
    return NextResponse.json({ error: 'Error al subir el archivo.', details: e.message }, { status: 500 });
  }
}
