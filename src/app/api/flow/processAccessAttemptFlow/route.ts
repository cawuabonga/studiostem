
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/config/firebase';
import { collection, doc, runTransaction, Timestamp, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import type { AccessPoint, Role } from '@/types';

const AccessAttemptInputSchema = z.object({
  accessPointId: z.string().describe('The unique ID of the access point device making the request.'),
  rfidCardId: z.string().describe('The RFID card ID that was scanned.'),
});

const AccessAttemptOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  action: z.enum(['open', 'deny']),
});

/**
 * Procesa un intento de acceso mediante RFID.
 * Utiliza una transacción para garantizar la consistencia del estado de presencia.
 */
async function processAccessAttempt(input: z.infer<typeof AccessAttemptInputSchema>) {
    const { accessPointId, rfidCardId } = input;
    
    return await runTransaction(db, async (transaction) => {
        const now = Timestamp.now();
        
        // 1. BUSCAR AL USUARIO EN TODA LA PLATAFORMA POR SU RFID
        // Nota: En producción, lo ideal sería que el dispositivo envíe su instituteId.
        // Aquí mantenemos la búsqueda global para flexibilidad.
        let userProfile: any = null;
        let instituteId = '';
        let userDocumentId = '';
        let userName = '';
        let userRoleId = '';
        let collectionType: 'staffProfiles' | 'studentProfiles' = 'staffProfiles';

        // Buscamos en todas las colecciones de perfiles usando collectionGroup para mayor eficiencia
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
            collectionType = 'staffProfiles';
        } else if (!studentSnap.empty) {
            const d = studentSnap.docs[0];
            userProfile = d.data();
            userDocumentId = d.id;
            instituteId = userProfile.instituteId;
            userName = userProfile.fullName || userProfile.displayName;
            userRoleId = userProfile.roleId;
            collectionType = 'studentProfiles';
        }

        // Si el usuario no existe, registramos un log de error y denegamos inmediatamente
        if (!userProfile || !instituteId) {
            const unknownLogRef = doc(collection(db, 'unknown_access_logs'));
            transaction.set(unknownLogRef, {
                timestamp: now,
                status: 'Denegado',
                rfidCardId,
                accessPointId,
                reason: "Tarjeta RFID no vinculada a ningún perfil activo."
            });
            return { status: 'error', message: 'RFID card not registered.', action: 'deny' };
        }

        // 2. OBTENER DATOS DEL PUNTO DE ACCESO Y EL ROL (Dentro de la transacción)
        const apCol = collection(db, 'institutes', instituteId, 'accessPoints');
        const apQuery = query(apCol, where('accessPointId', '==', accessPointId));
        const apSnap = await getDocs(apQuery);
        
        if (apSnap.empty) {
            return { status: 'error', message: `Access point '${accessPointId}' not found in institute.`, action: 'deny' };
        }
        
        const apDoc = apSnap.docs[0];
        const targetAccessPoint = { id: apDoc.id, ...apDoc.data() } as AccessPoint;
        const accessPointDocId = apDoc.id;

        const roleDocRef = doc(db, 'institutes', instituteId, 'roles', userRoleId);
        const roleSnap = await transaction.get(roleDocRef);
        const userRoleName = roleSnap.exists() ? (roleSnap.data() as Role).name : 'Usuario';

        // 3. DETERMINAR LA DIRECCIÓN (ENTRADA/SALIDA) BASADO EN PRESENCIA REAL
        // Usamos un documento de presencia global para el usuario en el instituto
        const presenceDocRef = doc(db, 'institutes', instituteId, 'userPresence', userDocumentId);
        const presenceSnap = await transaction.get(presenceDocRef);
        
        // Lógica de "Toggle" Inteligente:
        // Si no hay registro previo o el último fue "Salida", el intento actual es "Entrada".
        // Si el último registro fue "Entrada", el intento actual es "Salida".
        const lastSuccessState = presenceSnap.exists() ? presenceSnap.data()?.lastType : 'Salida';
        const intendedLogType: 'Entrada' | 'Salida' = lastSuccessState === 'Entrada' ? 'Salida' : 'Entrada';

        // 4. VALIDAR PERMISOS DE SEGURIDAD
        const hasPermission = targetAccessPoint.allowedRoleIds?.includes(userRoleId);
        const finalStatus = hasPermission ? 'Permitido' : 'Denegado';

        // 5. ACTUALIZAR ESTADO DE PRESENCIA (SOLO SI EL ACCESO ES PERMITIDO)
        if (hasPermission) {
            transaction.set(presenceDocRef, {
                lastType: intendedLogType,
                timestamp: now,
                accessPointId: accessPointDocId,
                accessPointName: targetAccessPoint.name
            }, { merge: true });
        }

        // 6. REGISTRAR EL LOG DE ACCESO CON LA DIRECCIÓN CALCULADA
        const logCol = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');
        const logDocRef = doc(logCol);
        
        transaction.set(logDocRef, {
            timestamp: now,
            type: intendedLogType,
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
            message: hasPermission ? `Access granted: ${intendedLogType}` : `Access denied: ${intendedLogType}`,
            action: hasPermission ? 'open' : 'deny'
        };
    });
}

export async function GET() {
  return NextResponse.json({ message: "Access Control API is active." });
}

export async function POST(req: NextRequest) {
    const isFromBrowser = !req.headers.get('Authorization');

    if (!isFromBrowser) {
        const authHeader = req.headers.get('Authorization');
        const apiKey = process.env.DEVICE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'DEVICE_API_KEY not configured.' }, { status: 500 });
        }
        if (authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const body = await req.json();
        const validatedInput = AccessAttemptInputSchema.safeParse(body);

        if (!validatedInput.success) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        const result = await processAccessAttempt(validatedInput.data);
        const validatedOutput = AccessAttemptOutputSchema.parse(result);
        
        return NextResponse.json(validatedOutput);

    } catch (error: any) {
        console.error('[CRITICAL_API_ERROR] Access Attempt Processing failed:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            message: error.message 
        }, { status: 500 });
    }
}
