
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import type { NextRequest } from 'next/server';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Robust Firebase initialization for server-side environments
const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.appspot.com",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const serverStorage = getStorage(app, 'gs://stem-v2-4y6a0.appspot.com');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
    }

    const storageRef = ref(serverStorage, path);
    
    // Convert file to ArrayBuffer before uploading
    const fileBuffer = await file.arrayBuffer();
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
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
