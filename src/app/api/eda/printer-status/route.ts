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
 * Recibe información del agente STEM Point Print
 * instalado en la computadora donde está conectada
 * la impresora predeterminada de Windows.
 */

export async function POST(req: NextRequest) {
    try {
        // =====================================================
        // 1. RECIBIR DATOS DEL AGENTE PYTHON
        // =====================================================
        const body = await req.json();
        const {
            pointId,
            status,
            paper,
            toner,
            printerName
        } = body;

        console.log('[PRINTER API] Datos recibidos para punto:', pointId);

        // =====================================================
        // 2. VALIDAR POINT ID
        // =====================================================
        if (!pointId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: pointId' },
                { status: 400 }
            );
        }

        // =====================================================
        // 3. BUSCAR EL PUNTO EDA (Usando Collection Group)
        // =====================================================
        const q = query(
            collectionGroup(db, 'edaPrintPoints'),
            where('pointId', '==', pointId)
        );

        const snap = await getDocs(q);

        // =====================================================
        // 4. VALIDAR SI EXISTE EL PUNTO
        // =====================================================
        if (snap.empty) {
            console.error(`[PRINTER API] No se encontró el punto: ${pointId}`);
            return NextResponse.json(
                { 
                    error: 'Not Found', 
                    message: `No se encontró configuración para el Hard-ID: ${pointId}` 
                },
                { status: 404 }
            );
        }

        // =====================================================
        // 5. OBTENER REFERENCIA Y DATOS
        // =====================================================
        const pointDoc = snap.docs[0];
        const pointRef = pointDoc.ref;
        const instituteId = pointRef.parent.parent?.id;

        // =====================================================
        // 6. PREPARAR DATOS DE TELEMETRÍA
        // =====================================================
        const updatePayload = {
            printerStatus: status || 'Online',
            paperStatus: paper || 'OK',
            tonerLevel: toner !== undefined ? Number(toner) : 85,
            printerName: printerName || 'Impresora Local',
            // CRÍTICO: Debe ser la llamada a la función serverTimestamp()
            lastHeartbeat: serverTimestamp()
        };

        // =====================================================
        // 7. ACTUALIZAR FIRESTORE
        // =====================================================
        await updateDoc(pointRef, updatePayload);

        console.log(`[PRINTER API] Éxito: ${pointId} actualizado.`);

        return NextResponse.json({
            success: true,
            message: 'Telemetría actualizada correctamente',
            debug: {
                pointId,
                fullPath: pointRef.path,
                instituteId: instituteId || 'unknown'
            }
        });

    } catch (error: any) {
        console.error('[PRINTER API ERROR]', error);
        return NextResponse.json(
            { 
                error: 'Server Error', 
                message: error?.message || 'Error desconocido' 
            },
            { status: 500 }
        );
    }
}
