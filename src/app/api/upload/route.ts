
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Diagnostic version of the upload API route

// Function to safely initialize Firebase Admin
const initializeAdmin = () => {
    // Check if the app is already initialized to prevent errors
    if (admin.apps.length === 0) {
        console.log('[API_UPLOAD_DEBUG] Step 2: No existing Firebase Admin app found. Initializing...');
        admin.initializeApp({
            storageBucket: 'stem-v2-4y6a0.appspot.com'
        });
        console.log('[API_UPLOAD_DEBUG] Step 3: Firebase Admin initialized successfully.');
    } else {
        console.log(`[API_UPLOAD_DEBUG] Step 2 & 3: Firebase Admin app already initialized. Total apps: ${admin.apps.length}`);
    }
    return admin.app();
};


export async function POST(req: Request) {
  console.log('[API_UPLOAD_DEBUG] Step 1: POST request received at /api/upload.');

  try {
    // Initialize Firebase Admin
    initializeAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.', details: 'The form data did not contain a file.' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: 'No path provided.', details: 'The form data did not contain a path.' }, { status: 400 });
    }

    console.log(`[API_UPLOAD_DEBUG] Step 4: File and path received. Path: ${path}`);
    
    console.log('[API_UPLOAD_DEBUG] Step 5: Attempting to get storage bucket...');
    const bucket = admin.storage().bucket();
    console.log('[API_UPLOAD_DEBUG] Step 6: Successfully got storage bucket.');

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileUpload = bucket.file(path);

    console.log('[API_UPLOAD_DEBUG] Step 7: Attempting to save file to bucket...');
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
      public: true,
    });
    console.log('[API_UPLOAD_DEBUG] Step 8: File saved successfully.');
    
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({ downloadURL });

  } catch (error: any) {
    console.error('[API_UPLOAD_ERROR] A critical error occurred:', error);
    // Return a detailed error message in JSON format
    return NextResponse.json(
        { 
            error: 'Server-side upload failed.', 
            details: error.message,
            stack: error.stack // Include stack trace for more details
        }, 
        { status: 500 }
    );
  }
}
