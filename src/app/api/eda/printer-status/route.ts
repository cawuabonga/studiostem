
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { getDocs, query, where, collectionGroup, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para que un script externo (PC) o hardware (ESP32) 
 * reporte el estado en tiempo real de la impresora conectada al terminal EDA.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        console.log(`[HARDWARE LOG] Recibida telemetría para ${pointId}: Status=${status}, Paper=${paper}`);

        if (!pointId) {
            return NextResponse.json({ error: 'Falta pointId' }, { status: 400 });
        }

        // 1. Localizar el documento del punto de impresión en todo el sistema (Uso de Index Global de Campo Único)
        const q = query(collectionGroup(db, 'edaPrintPoints'), where('pointId', '==', pointId));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.error(`[HARDWARE ERROR] No se encontró un punto de impresión con Hard-ID: ${pointId}`);
            return NextResponse.json({ error: 'Punto de impresión no registrado en la base de datos' }, { status: 404 });
        }

        const pointRef = snap.docs[0].ref;

        // 2. Actualizar telemetría de hardware
        await updateDoc(pointRef, {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora del Sistema',
            lastHeartbeat: Timestamp.now()
        });

        console.log(`[HARDWARE SUCCESS] Sincronización exitosa para terminal ${pointId}`);

        return NextResponse.json({ success: true, message: 'Telemetría de hardware actualizada correctamente' });

    } catch (error: any) {
        console.error("[PRINTER API ERROR]", error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
