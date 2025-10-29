
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { NextRequest } from 'next/server';

// Helper function to parse multipart/form-data
async function parseForm(req: NextRequest): Promise<{ fields: Record<string, string>, files: Record<string, File> }> {
    const formData = await req.formData();
    const fields: Record<string, string> = {};
    const files: Record<string, File> = {};

    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            files[key] = value;
        } else {
            fields[key] = value;
        }
    }
    return { fields, files };
}


export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseForm(req);
    const file = files['file'];
    const path = fields['path'];

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();

    const storageRef = ref(storage, `${path}/${file.name}`);

    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type,
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('Error en la subida de archivo:', e);
    return NextResponse.json({ error: 'Error al subir el archivo.', details: e.message, stack: e.stack }, { status: 500 });
  }
}
