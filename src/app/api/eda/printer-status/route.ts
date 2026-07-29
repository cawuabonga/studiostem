import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { 
    collectionGroup, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    serverTimestamp 
} from 'firebase/firestore';

/**
 * API Endpoint para telemetría de hardware EDA.
 * 
 * Ejecuta la lógica directamente en el servidor para evitar conflictos 
 * con las directivas 'use client' de los servicios compartidos.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        console.log('[PRINTER API] Procesando telemetría para:', pointId);

        if (!pointId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: pointId' },
                { status: 400 }
            );
        }

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

        // 2. Ejecutar la actualización directamente desde el servidor
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
                message: error?.message || 'Error desconocido al actualizar telemetría'
            },
            { status: 500 }
        );
    }
}
