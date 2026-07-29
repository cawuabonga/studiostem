import { NextResponse, type NextRequest } from 'next/server';
import { updatePrinterTelemetry } from '@/services/eda-db';

/**
 * API Endpoint para telemetría de hardware EDA.
 * Utiliza el servicio centralizado eda-db para interactuar con Firestore
 * de manera estable y segura en el entorno de servidor de Next.js.
 */

export async function POST(req: NextRequest) {
    try {
        // 1. Obtener datos del agente Python
        const body = await req.json();
        const { pointId, status, paper, toner, printerName } = body;

        console.log('[PRINTER API] Procesando telemetría para:', pointId);

        // 2. Validar parámetros mínimos
        if (!pointId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: pointId' },
                { status: 400 }
            );
        }

        // 3. Ejecutar la lógica de negocio a través del servicio eda-db
        // Este servicio maneja la búsqueda por collectionGroup y la actualización con serverTimestamp
        const result = await updatePrinterTelemetry(pointId, {
            status,
            paper,
            toner,
            printerName
        });

        // 4. Responder con éxito
        return NextResponse.json(
            {
                success: true,
                message: 'Telemetría actualizada correctamente',
                debug: {
                    pointId,
                    fullPath: result.path
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
