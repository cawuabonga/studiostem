
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This will only run once, on the first API call.
if (!admin.apps.length) {
  try {
    // When deployed to Firebase App Hosting, it will automatically use the runtime's service account.
    // We explicitly provide the storage bucket to ensure the SDK knows where to operate.
    admin.initializeApp({
      storageBucket: 'stem-v2-4y6a0.appspot.com'
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: 'No path provided.' }, { status: 400 });
    }

    const bucket = admin.storage().bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileUpload = bucket.file(path);

    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, // Make the file publicly readable
    });
    
    // The public URL is in a predictable format
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({ downloadURL });

  } catch (error: any) {
    console.error('[API_UPLOAD_ERROR]', error);
    return NextResponse.json({ error: 'Server-side upload failed.', details: error.message }, { status: 500 });
  }
}
