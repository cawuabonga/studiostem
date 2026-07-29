
import { NextResponse, type NextRequest } from 'next/server';
import { updatePrinterTelemetry } from '@/services/eda-db';

/**
 * API Endpoint para telemetría de hardware EDA.
 * Utiliza el servicio eda-db para procesar la actualización.
 */

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

        // Delegamos la lógica al servicio especializado
        const result = await updatePrinterTelemetry(pointId, {
            status,
            paper,
            toner,
            printerName
        });

        return NextResponse.json({
            success: true,
            message: 'Telemetría actualizada correctamente',
            debug: {
                pointId: result.pointId,
                fullPath: result.path
            }
        });

    } catch (error: any) {
        console.error('[PRINTER API ERROR]', error.message);
        
        const status = error.message.includes('No se encontró') ? 404 : 500;

        return NextResponse.json(
            { 
                error: status === 404 ? 'Not Found' : 'Server Error', 
                message: error.message 
            },
            { status }
        );
    }
}
