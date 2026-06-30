
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/config/firebase';
import { collection, doc, runTransaction, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { AccessState, AccessPoint, Role } from '@/types';

const AccessAttemptInputSchema = z.object({
  accessPointId: z.string().describe('The unique ID of the access point device making the request.'),
  rfidCardId: z.string().describe('The RFID card ID that was scanned.'),
});

const AccessAttemptOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  action: z.enum(['open', 'deny']),
});

async function processAccessAttempt(input: z.infer<typeof AccessAttemptInputSchema>) {
    const { accessPointId, rfidCardId } = input;
    
    // Todo el proceso se ejecuta en una sola transacción atómica
    return await runTransaction(db, async (transaction) => {
        const now = Timestamp.now();
        const currentDate = now.toDate().toISOString().split('T')[0];

        let userProfile: any = null;
        let instituteId = '';
        let userDocumentId = '';
        let userName = '';
        let userRoleId = '';
        let userRoleName = '';
        let targetAccessPoint: AccessPoint | null = null;
        let accessPointDocId = '';

        // 1. Buscar al usuario y su instituto por el ID de tarjeta RFID
        const institutesSnap = await getDocs(collection(db, 'institutes'));
        for (const instituteDoc of institutesSnap.docs) {
            const instId = instituteDoc.id;
            
            // Buscar en Staff
            const staffCol = collection(db, 'institutes', instId, 'staffProfiles');
            const staffQuery = await getDocs(query(staffCol, where('rfidCardId', '==', rfidCardId)));
            if (!staffQuery.empty) {
                const d = staffQuery.docs[0];
                userProfile = d.data();
                userDocumentId = d.id;
                instituteId = instId;
                userName = userProfile.displayName || userProfile.fullName;
                userRoleId = userProfile.roleId;
                break;
            }

            // Buscar en Estudiantes
            const studentCol = collection(db, 'institutes', instId, 'studentProfiles');
            const studentQuery = await getDocs(query(studentCol, where('rfidCardId', '==', rfidCardId)));
            if (!studentQuery.empty) {
                const d = studentQuery.docs[0];
                userProfile = d.data();
                userDocumentId = d.id;
                instituteId = instId;
                userName = userProfile.displayName || userProfile.fullName;
                userRoleId = userProfile.roleId;
                break;
            }
        }

        // Si no se encuentra al usuario, registramos un intento desconocido y denegamos
        if (!userProfile || !instituteId) {
            const unknownLogRef = doc(collection(db, 'unknown_access_logs'));
            transaction.set(unknownLogRef, {
                timestamp: now,
                status: 'Denegado',
                rfidCardId,
                accessPointId,
                reason: "Tarjeta no registrada o instituto no identificado."
            });
            return { status: 'error', message: 'RFID card not registered.', action: 'deny' };
        }

        // 2. Obtener datos del Punto de Acceso y el Rol
        const apCol = collection(db, 'institutes', instituteId, 'accessPoints');
        const apQuery = await getDocs(query(apCol, where('accessPointId', '==', accessPointId)));
        if (!apQuery.empty) {
            const apDoc = apQuery.docs[0];
            targetAccessPoint = { id: apDoc.id, ...apDoc.data() } as AccessPoint;
            accessPointDocId = apDoc.id;
        }

        const rolesCol = collection(db, 'institutes', instituteId, 'roles');
        const roleDocRef = doc(rolesCol, userRoleId);
        const roleSnap = await transaction.get(roleDocRef);
        userRoleName = roleSnap.exists() ? (roleSnap.data() as Role).name : (userProfile.role || 'Desconocido');

        if (!targetAccessPoint) {
            return { status: 'error', message: `Access point '${accessPointId}' not found.`, action: 'deny' };
        }

        // 3. DETERMINAR LA DIRECCIÓN (Entrada/Salida) BASADO EN EL ÚLTIMO ÉXITO
        const statesCol = collection(db, 'institutes', instituteId, 'accessStates');
        const stateDocRef = doc(statesCol, userDocumentId);
        const stateSnap = await transaction.get(stateDocRef);
        const stateData = stateSnap.exists() ? stateSnap.data() as AccessState : { lastStateByAccessPoint: {} };
        const lastSuccess = stateData.lastStateByAccessPoint[accessPointDocId];

        let logType: 'Entrada' | 'Salida' = 'Entrada'; // Por defecto
        if (lastSuccess) {
            const lastDate = lastSuccess.timestamp.toDate().toISOString().split('T')[0];
            // Solo alternamos si el último éxito fue hoy y fue una Entrada
            if (lastSuccess.type === 'Entrada' && lastDate === currentDate) {
                logType = 'Salida';
            }
        }

        // 4. VALIDAR PERMISOS
        const hasPermission = targetAccessPoint.allowedRoleIds?.includes(userRoleId);
        const finalStatus = hasPermission ? 'Permitido' : 'Denegado';

        // 5. ACTUALIZAR ESTADO DE UBICACIÓN (SOLO SI ES PERMITIDO)
        if (hasPermission) {
            transaction.set(stateDocRef, {
                lastStateByAccessPoint: {
                    ...stateData.lastStateByAccessPoint,
                    [accessPointDocId]: { type: logType, timestamp: now }
                }
            }, { merge: true });
        }

        // 6. REGISTRAR LOG DE ACCESO
        const logCol = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');
        const logDocRef = doc(logCol);
        transaction.set(logDocRef, {
            timestamp: now,
            type: logType,
            status: finalStatus,
            userDocumentId,
            userName,
            userRole: userRoleName,
            userRoleId,
            accessPointId,
            accessPointName: targetAccessPoint.name,
            rfidCardId,
            instituteId
        });

        return {
            status: hasPermission ? 'success' : 'error',
            message: hasPermission ? 'Access granted.' : 'Access denied for this role.',
            action: hasPermission ? 'open' : 'deny'
        };
    });
}

export async function GET() {
  return NextResponse.json({ message: "Endpoint is active. Use POST for access attempts." });
}

export async function POST(req: NextRequest) {
    const isFromBrowser = !req.headers.get('Authorization');

    if (!isFromBrowser) {
        const authHeader = req.headers.get('Authorization');
        const apiKey = process.env.DEVICE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'DEVICE_API_KEY is not configured on the server.' }, { status: 500 });
        }
        if (authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const body = await req.json();
        const validatedInput = AccessAttemptInputSchema.safeParse(body);

        if (!validatedInput.success) {
            return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.format() }, { status: 400 });
        }

        const result = await processAccessAttempt(validatedInput.data);
        const validatedOutput = AccessAttemptOutputSchema.parse(result);
        
        return NextResponse.json(validatedOutput);

    } catch (error: any) {
        console.error('[API_ERROR] processAccessAttemptFlow:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
