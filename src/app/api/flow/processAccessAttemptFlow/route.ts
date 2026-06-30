
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/config/firebase';
import { collection, doc, runTransaction, Timestamp, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import type { AccessPoint } from '@/types';

const AccessAttemptInputSchema = z.object({
  accessPointId: z.string().describe('The unique ID of the access point device making the request.'),
  rfidCardId: z.string().describe('The RFID card ID that was scanned.'),
});

/**
 * Procesa un intento de acceso mediante RFID.
 * Se corrigió el error de transacción y se blindó la alternancia de Entrada/Salida.
 */
async function processAccessAttempt(input: z.infer<typeof AccessAttemptInputSchema>) {
    const { accessPointId, rfidCardId } = input;
    
    // 1. BUSCAR AL USUARIO (Fuera de la transacción)
    let userProfile: any = null;
    let instituteId = '';
    let userDocumentId = '';
    let userName = '';
    let userRoleId = '';

    const staffQuery = query(collectionGroup(db, 'staffProfiles'), where('rfidCardId', '==', rfidCardId));
    const studentQuery = query(collectionGroup(db, 'studentProfiles'), where('rfidCardId', '==', rfidCardId));
    
    const [staffSnap, studentSnap] = await Promise.all([getDocs(staffQuery), getDocs(studentQuery)]);

    if (!staffSnap.empty) {
        const d = staffSnap.docs[0];
        userProfile = d.data();
        userDocumentId = d.id;
        instituteId = userProfile.instituteId;
        userName = userProfile.displayName || userProfile.fullName;
        userRoleId = userProfile.roleId;
    } else if (!studentSnap.empty) {
        const d = studentSnap.docs[0];
        userProfile = d.data();
        userDocumentId = d.id;
        instituteId = userProfile.instituteId;
        userName = userProfile.fullName || userProfile.displayName;
        userRoleId = userProfile.roleId;
    }

    if (!userProfile || !instituteId) {
        return { status: 'error', message: 'RFID card not registered.', action: 'deny' };
    }

    // 2. BUSCAR EL PUNTO DE ACCESO (Fuera de la transacción porque es una query)
    const apCol = collection(db, 'institutes', instituteId, 'accessPoints');
    const apQuery = query(apCol, where('accessPointId', '==', accessPointId));
    const apSnap = await getDocs(apQuery);
    
    if (apSnap.empty) {
        return { status: 'error', message: 'Access point not found.', action: 'deny' };
    }
    
    const apDocId = apSnap.docs[0].id;
    const targetAccessPoint = { id: apDocId, ...apSnap.docs[0].data() } as AccessPoint;

    // 3. PROCESAR DENTRO DE TRANSACCIÓN (Solo con DocRefs)
    return await runTransaction(db, async (transaction) => {
        const now = Timestamp.now();
        
        // Obtener estado de presencia actual
        const presenceDocRef = doc(db, 'institutes', instituteId, 'userPresence', userDocumentId);
        const presenceSnap = await transaction.get(presenceDocRef);
        
        // DETERMINAR INTENCIÓN: Se basa en el último acceso EXITOSO
        const lastSuccessfulType = presenceSnap.exists() ? presenceSnap.data()?.lastType : 'Salida';
        const intendedLogType: 'Entrada' | 'Salida' = lastSuccessfulType === 'Entrada' ? 'Salida' : 'Entrada';

        // VALIDAR PERMISOS
        const hasPermission = targetAccessPoint.allowedRoleIds?.includes(userRoleId);
        const finalStatus = hasPermission ? 'Permitido' : 'Denegado';

        // ACTUALIZAR PRESENCIA (SOLO SI ES PERMITIDO)
        if (hasPermission) {
            transaction.set(presenceDocRef, {
                lastType: intendedLogType,
                timestamp: now,
                accessPointId: apDocId,
                accessPointName: targetAccessPoint.name
            }, { merge: true });
        }

        // REGISTRAR EL LOG
        const logDocRef = doc(collection(db, 'institutes', instituteId, 'accessPoints', apDocId, 'accessLogs'));
        transaction.set(logDocRef, {
            timestamp: now,
            type: intendedLogType,
            status: finalStatus,
            userDocumentId,
            userName,
            userRoleId,
            accessPointId: apDocId,
            accessPointName: targetAccessPoint.name,
            rfidCardId,
            instituteId
        });

        return {
            status: hasPermission ? 'success' : 'error',
            message: hasPermission ? `Acceso concedido: ${intendedLogType}` : `Acceso denegado: ${intendedLogType}`,
            action: hasPermission ? 'open' : 'deny'
        };
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await processAccessAttempt(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[API ERROR]", error);
        return NextResponse.json({ error: 'Internal Error', message: error.message }, { status: 500 });
    }
}
