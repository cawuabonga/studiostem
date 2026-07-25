
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { getDocs, query, where, collectionGroup, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para telemetría de hardware EDA.
 * Corregido: Respuesta JSON forzada y logs detallados.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        console.log(`[HARDWARE] Recibida señal de terminal: ${pointId}`);

        if (!pointId) {
            return NextResponse.json({ error: 'Faltan parámetros: pointId' }, { status: 400 });
        }

        // 1. Localizar el documento
        const q = query(collectionGroup(db, 'edaPrintPoints'), where('pointId', '==', pointId));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.error(`[HARDWARE ERROR] No existe terminal con pointId: ${pointId}`);
            return NextResponse.json({ 
                error: 'Not Found', 
                message: `No se encontró configuración para el Hard-ID: ${pointId}`
            }, { status: 404 });
        }

        const pointDoc = snap.docs[0];
        const pointRef = pointDoc.ref;
        const instituteId = pointRef.parent.parent?.id;

        // 2. Actualizar datos
        const updatePayload = {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            lastHeartbeat: Timestamp.now()
        };

        await updateDoc(pointRef, updatePayload);

        console.log(`[HARDWARE SUCCESS] ${pointId} actualizado en ${pointRef.path}`);

        // Devolvemos un objeto plano y simple para evitar errores de serialización
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'OK',
            debug: {
                pointId: pointId,
                fullPath: pointRef.path,
                instituteId: instituteId || 'unknown'
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[PRINTER API ERROR]", error);
        return new Response(JSON.stringify({ 
            error: 'Server Error', 
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
