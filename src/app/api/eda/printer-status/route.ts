import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getFirestore, 
    collectionGroup, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    serverTimestamp 
} from 'firebase/firestore';

/**
 * CONFIGURACIÓN DE FIREBASE (Servidor)
 * Se inicializa localmente para evitar conflictos con las directivas 'use client'
 * de los archivos de configuración compartidos y asegurar la integridad de los tipos.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.firebasestorage.app",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8",
  measurementId: "G-5FP9BYXHPF"
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        if (!pointId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: pointId' },
                { status: 400 }
            );
        }

        // Inicialización segura DENTRO del handler para evitar errores de tipo en Next.js 15
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);

        console.log('[PRINTER API] Procesando actualización para:', pointId);

        // 1. Localizar el punto de impresión en todo el ecosistema (SaaS)
        const q = query(
            collectionGroup(db, 'edaPrintPoints'),
            where('pointId', '==', pointId)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json(
                { 
                    error: 'Not Found', 
                    message: `No se encontró configuración para el Hard-ID: ${pointId}` 
                },
                { status: 404 }
            );
        }

        const pointRef = snap.docs[0].ref;

        // 2. Ejecutar la actualización directamente
        await updateDoc(pointRef, {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            lastHeartbeat: serverTimestamp() 
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Telemetría actualizada correctamente',
                debug: {
                    pointId,
                    fullPath: pointRef.path
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('[PRINTER API ERROR]', error.message);
        
        return NextResponse.json(
            {
                error: 'Server Error',
                message: error?.message || 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
