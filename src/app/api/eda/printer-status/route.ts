
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { getDocs, query, where, collectionGroup, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para telemetría de hardware EDA.
 * Corregido: Uso de serverTimestamp para evitar errores de tipo 'mr'.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        if (!pointId) {
            return NextResponse.json({ error: 'Faltan parámetros: pointId' }, { status: 400 });
        }

        // 1. Localizar el documento mediante el Hard-ID (pointId)
        const q = query(collectionGroup(db, 'edaPrintPoints'), where('pointId', '==', pointId));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json({ 
                error: 'Not Found', 
                message: `No se encontró configuración para el Hard-ID: ${pointId}`
            }, { status: 404 });
        }

        const pointDoc = snap.docs[0];
        const pointRef = pointDoc.ref;
        const instituteId = pointRef.parent.parent?.id;

        // 2. Actualizar datos usando serverTimestamp para evitar el error 'function'
        const updatePayload = {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            lastHeartbeat: serverTimestamp()
        };

        await updateDoc(pointRef, updatePayload);

        // Respuesta detallada para el script de Python
        return NextResponse.json({ 
            success: true, 
            message: 'Telemetría actualizada correctamente',
            debug: {
                pointId: pointId,
                fullPath: pointRef.path,
                instituteId: instituteId || 'unknown'
            }
        });

    } catch (error: any) {
        console.error("[PRINTER API ERROR]", error);
        return NextResponse.json({ 
            error: 'Server Error', 
            message: error.message 
        }, { status: 500 });
    }
}
