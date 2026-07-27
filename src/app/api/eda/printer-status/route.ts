import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import {
    getDocs,
    query,
    where,
    collectionGroup,
    updateDoc,
    Timestamp
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

        console.log('[PRINTER API] Datos recibidos:', body);


        // =====================================================
        // 2. VALIDAR POINT ID
        // =====================================================

        if (!pointId) {

            return NextResponse.json(
                {
                    error: 'Faltan parámetros: pointId'
                },
                {
                    status: 400
                }
            );

        }


        // =====================================================
        // 3. BUSCAR EL PUNTO EDA
        // =====================================================

        const q = query(
            collectionGroup(
                db,
                'edaPrintPoints'
            ),
            where(
                'pointId',
                '==',
                pointId
            )
        );

        console.log(
            `[PRINTER API] Buscando punto EDA: ${pointId}`
        );

        const snap = await getDocs(q);


        // =====================================================
        // 4. VALIDAR SI EXISTE EL PUNTO
        // =====================================================

        if (snap.empty) {

            console.error(
                `[PRINTER API] No se encontró el punto: ${pointId}`
            );

            return NextResponse.json(
                {
                    error: 'Not Found',
                    message:
                        `No se encontró configuración para el Hard-ID: ${pointId}`
                },
                {
                    status: 404
                }
            );

        }


        // =====================================================
        // 5. OBTENER REFERENCIA DEL DOCUMENTO
        // =====================================================

        const pointDoc = snap.docs[0];

        const pointRef = pointDoc.ref;

        const instituteId =
            pointRef.parent.parent?.id;


        // =====================================================
        // 6. PREPARAR DATOS DE TELEMETRÍA
        // =====================================================

        const updatePayload = {

            printerStatus:
                status || 'Online',

            paperStatus:
                paper || 'OK',

            tonerLevel:
                toner !== undefined
                    ? Number(toner)
                    : 85,

            printerName:
                printerName ||
                'Impresora Local',

            // IMPORTANTE:
            // Usamos Timestamp.now()
            // igual que la API del ESP32.
            lastHeartbeat:
                Timestamp.now()
        };


        console.log(
            '[PRINTER API] Actualizando punto:',
            updatePayload
        );


        // =====================================================
        // 7. ACTUALIZAR FIRESTORE
        // =====================================================

        await updateDoc(
            pointRef,
            updatePayload
        );


        // =====================================================
        // 8. RESPONDER AL AGENTE PYTHON
        // =====================================================

        console.log(
            `[PRINTER API] Telemetría actualizada correctamente: ${pointId}`
        );


        return NextResponse.json(
            {
                success: true,

                message:
                    'Telemetría actualizada correctamente',

                debug: {

                    pointId,

                    fullPath:
                        pointRef.path,

                    instituteId:
                        instituteId ||
                        'unknown',

                    printerName:
                        printerName ||
                        'Impresora Local',

                    status:
                        status ||
                        'Online',

                    paper:
                        paper ||
                        'OK'
                }
            },
            {
                status: 200
            }
        );


    } catch (error: any) {

        // =====================================================
        // ERROR
        // =====================================================

        console.error(
            '[PRINTER API ERROR]',
            error
        );

        console.error(
            '[PRINTER API ERROR STACK]',
            error?.stack
        );


        return NextResponse.json(
            {
                error: 'Server Error',

                message:
                    error?.message ||
                    'Error desconocido',

                stack:
                    error?.stack ||
                    null
            },
            {
                status: 500
            }
        );

    }

}