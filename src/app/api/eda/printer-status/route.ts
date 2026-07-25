
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { getDocs, query, where, collectionGroup, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para que un script externo (PC) o hardware (ESP32) 
 * reporte el estado en tiempo real de la impresora conectada al terminal EDA.
 * Mejorado para devolver la ruta del documento y facilitar la auditoría.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        if (!pointId) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios: pointId' }, { status: 400 });
        }

        // 1. Localizar el documento del punto de impresión en todo el sistema
        // Buscamos por el Hard-ID técnico
        const q = query(collectionGroup(db, 'edaPrintPoints'), where('pointId', '==', pointId));
        const snap = await getDocs(q);

        if (snap.empty) {
            const errorMsg = `No se encontró un terminal con Hard-ID: ${pointId}.`;
            console.error(`[HARDWARE ERROR] ${errorMsg}`);
            return NextResponse.json({ 
                error: 'Not Found', 
                message: errorMsg,
                hint: 'Asegúrese de que el Hard-ID en el panel administrativo coincida exactamente con el del script.'
            }, { status: 404 });
        }

        const pointDoc = snap.docs[0];
        const pointRef = pointDoc.ref;
        const instituteId = pointRef.parent.parent?.id;

        // 2. Actualizar telemetría de hardware
        const updatePayload = {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            lastHeartbeat: Timestamp.now()
        };

        await updateDoc(pointRef, updatePayload);

        console.log(`[HARDWARE SUCCESS] Telemetría actualizada para ${pointId} en instituto ${instituteId}`);

        // Devolvemos la ruta del documento para que el usuario pueda verificarlo en la consola de Firebase
        return NextResponse.json({ 
            success: true, 
            message: 'Telemetría sincronizada correctamente',
            debug: {
                pointId: pointId,
                documentId: pointDoc.id,
                fullPath: pointRef.path,
                instituteId: instituteId
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("[PRINTER API CRITICAL ERROR]", error);
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            message: error.message 
        }, { status: 500 });
    }
}
