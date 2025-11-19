
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Readable } from 'stream';

// --- Secure Initialization ---
const BUCKET_NAME = 'stem-v2-4y6a0.appspot.com';
try {
    if (!admin.apps.length) {
        console.log('[API-DEBUG] Initializing Firebase Admin SDK...');
        admin.initializeApp({
            storageBucket: BUCKET_NAME,
        });
        console.log('[API-DEBUG] Firebase Admin SDK Initialized.');
    }
} catch (error: any) {
    console.error('[API-DEBUG] CRITICAL: Firebase Admin SDK initialization failed:', error);
}
// --- End of Initialization ---

export async function POST(req: Request) {
    let step = 'START';
    try {
        step = 'READ_FORM_DATA';
        console.log(`[API-DEBUG] ${step}: Reading form data from request.`);
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            step = 'VALIDATE_INPUT';
            console.error(`[API-DEBUG] ${step}: Failed. Missing file or path.`);
            return NextResponse.json({ error: 'Falta el archivo o la ruta de destino.' }, { status: 400 });
        }
        console.log(`[API-DEBUG] ${step}: Success. File: ${file.name}, Path: ${path}`);

        step = 'GET_STORAGE_BUCKET';
        console.log(`[API-DEBUG] ${step}: Getting storage bucket: ${BUCKET_NAME}`);
        const bucket = admin.storage().bucket();
        console.log(`[API-DEBUG] ${step}: Success. Bucket retrieved.`);

        step = 'CREATE_UPLOAD_STREAM';
        console.log(`[API-DEBUG] ${step}: Creating destination file in bucket at path: ${path}`);
        const bucketFile = bucket.file(path);
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);
        
        console.log(`[API-DEBUG] ${step}: Success. Stream created.`);

        step = 'PIPE_STREAM_TO_STORAGE';
        console.log(`[API-DEBUG] ${step}: Starting file upload stream to Storage.`);
        await new Promise((resolve, reject) => {
            stream.pipe(bucketFile.createWriteStream({
                metadata: {
                    contentType: file.type,
                },
            }))
            .on('error', (err) => {
                console.error(`[API-DEBUG] ${step}: Stream pipe error.`, err);
                reject(err);
            })
            .on('finish', () => {
                console.log(`[API-DEBUG] ${step}: Stream finished. File uploaded.`);
                resolve(true);
            });
        });
        console.log(`[API-DEBUG] ${step}: Success.`);

        step = 'MAKE_FILE_PUBLIC';
        console.log(`[API-DEBUG] ${step}: Making file public.`);
        await bucketFile.makePublic();
        console.log(`[API-DEBUG] ${step}: Success.`);

        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${path}`;
        
        console.log('[API-DEBUG] END: Upload process completed successfully.');
        return NextResponse.json({ downloadURL: publicUrl });

    } catch (error: any) {
        console.error(`[API-DEBUG] CRITICAL FAILURE at step: ${step}`, error);
        return NextResponse.json(
            { 
                error: 'Error interno del servidor durante la subida.',
                details: {
                    failedStep: step,
                    errorMessage: error.message,
                    errorStack: error.stack // Include stack for more details
                }
            }, 
            { status: 500 }
        );
    }
}
