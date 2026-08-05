
import { NextResponse, type NextRequest } from 'next/server';
import { registerEdaScan } from '@/services/eda-db';

/**
 * @fileOverview API Endpoint para que el hardware (ESP32) notifique un escaneo RFID en un terminal EDA.
 * Esta versión utiliza el servicio centralizado para garantizar la integridad de la sesión.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rfidCardId, accessPointId } = body;

        // Validación de parámetros básicos
        if (!rfidCardId || !accessPointId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: rfidCardId o accessPointId' }, 
                { status: 400 }
            );
        }

        console.log(`[EDA SCAN] Intento de login en ${accessPointId} con tarjeta ${rfidCardId}`);

        // Ejecutamos la lógica de negocio a través del servicio de DB
        const result = await registerEdaScan(rfidCardId, accessPointId);

        return NextResponse.json({ 
            success: true, 
            studentName: result.studentName,
            action: 'session_started',
            message: `Bienvenido, ${result.studentName}`
        });

    } catch (error: any) {
        console.error("[EDA SCAN API ERROR]", error.message);
        
        // Manejo de errores específicos para que el hardware sepa qué LED encender
        const status = error.message.includes('no vinculada') ? 404 : 500;
        
        return NextResponse.json({ 
            success: false, 
            error: 'Scan Failed', 
            message: error.message 
        }, { status });
    }
}
