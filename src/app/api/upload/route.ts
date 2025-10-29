
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import formidable from 'formidable';
import type { File } from 'formidable';
import fs from 'fs/promises';

// We need to disable the default body parser to allow formidable to stream the request.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse the form
const parseForm = async (req: Request): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export async function POST(req: Request) {
  try {
    const { files, fields } = await parseForm(req);
    
    const file = (files.file as File[])?.[0];
    const path = (fields.path as string[])?.[0];

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    // Read the file from the temporary path where formidable stores it
    const fileBuffer = await fs.readFile(file.filepath);

    // Create a reference in Firebase Storage
    const storageRef = ref(storage, `${path}/${file.originalFilename}`);

    // Upload the file buffer
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.mimetype || undefined,
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ downloadURL });

  } catch (e: any) {
    console.error('Error en la subida de archivo:', e);
    return NextResponse.json({ error: 'Error al subir el archivo.', details: e.message }, { status: 500 });
  }
}
