
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { getDocs, query, where, collectionGroup, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para que un script externo (PC) o hardware (ESP32) 
 * reporte el estado en tiempo real de la impresora conectada al terminal EDA.
 * Mejorado para devolver errores descriptivos en caso de fallo (500).
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        console.log(`[HARDWARE LOG] Recibida telemetría para ${pointId}: Status=${status}, Paper=${paper}`);

        if (!pointId) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios: pointId' }, { status: 400 });
        }

        // 1. Localizar el documento del punto de impresión en todo el sistema
        // IMPORTANTE: Requiere el índice de Single Field Override habilitado en la consola de Firebase.
        const q = query(collectionGroup(db, 'edaPrintPoints'), where('pointId', '==', pointId));
        const snap = await getDocs(q);

        if (snap.empty) {
            const errorMsg = `No se encontró un punto de impresión con Hard-ID: ${pointId}. Verifique el registro en el panel admin.`;
            console.error(`[HARDWARE ERROR] ${errorMsg}`);
            return NextResponse.json({ error: 'Not Found', message: errorMsg }, { status: 404 });
        }

        const pointRef = snap.docs[0].ref;

        // 2. Actualizar telemetría de hardware
        // Usamos setDoc con merge: true para evitar problemas si el documento está bloqueado por otro proceso
        await updateDoc(pointRef, {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            lastHeartbeat: Timestamp.now()
        });

        console.log(`[HARDWARE SUCCESS] Sincronización exitosa para terminal ${pointId}`);

        return NextResponse.json({ 
            success: true, 
            message: 'Telemetría actualizada correctamente',
            pointId: pointId
        });

    } catch (error: any) {
        // Devolvemos el error detallado para que sea visible en el terminal de Python
        const detailedError = error.message || 'Error desconocido en el servidor';
        console.error("[PRINTER API CRITICAL ERROR]", error);
        
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            message: detailedError,
            hint: 'Asegúrese de que el índice de Collection Group esté habilitado para edaPrintPoints.pointId'
        }, { status: 500 });
    }
}
