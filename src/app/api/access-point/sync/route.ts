
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';

/**
 * @fileOverview Endpoint para que el ESP32 descargue la lista de usuarios autorizados.
 * Esto permite validación local instantánea en el hardware.
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const accessPointId = searchParams.get('accessPointId');

        if (!accessPointId) {
            return NextResponse.json({ error: 'Falta accessPointId' }, { status: 400 });
        }

        // 1. Encontrar a qué instituto pertenece este punto de acceso
        const apQuery = query(collectionGroup(db, 'accessPoints'), where('accessPointId', '==', accessPointId));
        const apSnap = await getDocs(apQuery);

        if (apSnap.empty) {
            return NextResponse.json({ error: 'Punto de acceso no encontrado' }, { status: 404 });
        }

        const apDoc = apSnap.docs[0];
        const apData = apDoc.data();
        const instituteId = apDoc.ref.parent.parent?.id;
        const allowedRoleIds = apData.allowedRoleIds || [];

        if (!instituteId) {
            return NextResponse.json({ error: 'Error de jerarquía de datos' }, { status: 500 });
        }

        // 2. Obtener todos los IDs de tarjetas autorizadas (Staff y Estudiantes)
        // Filtramos por roles permitidos por el punto de acceso
        const authorizedCards: string[] = [];

        // Consultar Staff
        const staffCol = collection(db, 'institutes', instituteId, 'staffProfiles');
        const staffSnap = await getDocs(staffCol);
        staffSnap.forEach(doc => {
            const data = doc.data();
            if (data.rfidCardId && allowedRoleIds.includes(data.roleId)) {
                authorizedCards.push(data.rfidCardId);
            }
        });

        // Consultar Estudiantes
        // Nota: Los estudiantes usualmente tienen rol 'student'
        if (allowedRoleIds.includes('student')) {
            const studentCol = collection(db, 'institutes', instituteId, 'studentProfiles');
            const studentSnap = await getDocs(studentCol);
            studentSnap.forEach(doc => {
                const data = doc.data();
                if (data.rfidCardId) {
                    authorizedCards.push(data.rfidCardId);
                }
            });
        }

        // Devolvemos una lista simple y ligera para el ESP32
        return NextResponse.json({
            lastSync: new Date().toISOString(),
            count: authorizedCards.length,
            authorizedCards: authorizedCards
        });

    } catch (error: any) {
        console.error("[SYNC API ERROR]", error);
        return NextResponse.json({ error: 'Internal Error', message: error.message }, { status: 500 });
    }
}
