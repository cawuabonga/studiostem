
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where, collectionGroup, doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview API Endpoint para que el hardware (ESP32) notifique un escaneo RFID en un terminal EDA.
 * Actualiza el estado del punto de impresión para que el Kiosko web reaccione.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rfidCardId, accessPointId } = body;

        if (!rfidCardId || !accessPointId) {
            return NextResponse.json({ error: 'Faltan parámetros: rfidCardId o accessPointId' }, { status: 400 });
        }

        // 1. Identificar al estudiante por su tarjeta RFID en todo el ecosistema
        const studentQuery = query(collectionGroup(db, 'studentProfiles'), where('rfidCardId', '==', rfidCardId));
        const studentSnap = await getDocs(studentQuery);

        if (studentSnap.empty) {
            return NextResponse.json({ error: 'Tarjeta RFID no vinculada a ningún estudiante' }, { status: 404 });
        }

        const studentDoc = studentSnap.docs[0];
        const studentData = studentDoc.data();
        const instituteId = studentData.instituteId;

        // 2. Encontrar el punto de impresión EDA correspondiente
        const apCol = collection(db, 'institutes', instituteId, 'edaPrintPoints');
        const apQuery = query(apCol, where('pointId', '==', accessPointId));
        const apSnap = await getDocs(apQuery);

        if (apSnap.empty) {
            return NextResponse.json({ error: 'Terminal Point Print no encontrado en este instituto' }, { status: 404 });
        }

        const pointDocId = apSnap.docs[0].id;
        const pointRef = doc(db, 'institutes', instituteId, 'edaPrintPoints', pointDocId);

        // 3. Actualizar la sesión del terminal
        await updateDoc(pointRef, {
            currentStudentId: studentDoc.id,
            lastScanAt: Timestamp.now()
        });

        return NextResponse.json({ 
            success: true, 
            studentName: studentData.fullName || studentData.displayName,
            action: 'session_started'
        });

    } catch (error: any) {
        console.error("[EDA SCAN API ERROR]", error);
        return NextResponse.json({ error: 'Internal Error', message: error.message }, { status: 500 });
    }
}
