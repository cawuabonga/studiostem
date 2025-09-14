
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getStaffProfileByDocumentId, getStudentProfile, getAccessPoints, getRoles, db } from '@/config/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';


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
    let userProfile: any = null;
    let userRoleId = '';
    let userRoleName = '';
    let userName = '';
    let userDocumentId = '';
    let instituteId = '';
    let accessPointDocId = ''; // To store the Firestore document ID of the access point

    const institutesSnap = await getDocs(collection(db, 'institutes'));
    for (const instituteDoc of institutesSnap.docs) {
        const id = instituteDoc.id;
        const staffCol = collection(db, 'institutes', id, 'staffProfiles');
        const staffQuery = await getDocs(query(staffCol, where('rfidCardId', '==', rfidCardId)));
        if (!staffQuery.empty) {
            const doc = staffQuery.docs[0];
            userProfile = { ...doc.data(), type: 'staff', documentId: doc.id };
            instituteId = id;
            break;
        }

        const studentCol = collection(db, 'institutes', id, 'studentProfiles');
        const studentQuery = await getDocs(query(studentCol, where('rfidCardId', '==', rfidCardId)));
        if (!studentQuery.empty) {
            const doc = studentQuery.docs[0];
            userProfile = { ...doc.data(), type: 'student', documentId: doc.id };
            instituteId = id;
            break;
        }
    }
    
    const logAccess = async (status: 'Permitido' | 'Denegado') => {
        if (!instituteId) {
            console.error("Cannot log access: instituteId not found for the given RFID card.");
            const unknownLogCollectionRef = collection(db, 'unknown_access_logs');
             await addDoc(unknownLogCollectionRef, {
                timestamp: Timestamp.now(),
                status,
                rfidCardId,
                accessPointId,
                reason: "Institute not found for this RFID card."
            });
            return;
        }
        
        const accessPoints = await getAccessPoints(instituteId);
        const accessPoint = accessPoints.find(p => p.accessPointId === accessPointId);
        
        if (!accessPoint) {
            console.error(`Access point with ID ${accessPointId} not found in institute ${instituteId}. Logging attempt anyway.`);
            accessPointDocId = 'unknown_access_points'; // Log to a generic document
        } else {
            accessPointDocId = accessPoint.id; // Store the document ID
        }

        const logCollectionRef = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');

        await addDoc(logCollectionRef, {
            timestamp: Timestamp.now(),
            type: 'Entrada',
            status,
            userDocumentId: userDocumentId || 'Desconocido',
            userName: userName || 'Tarjeta no registrada',
            userRole: userRoleName || 'Desconocido',
            userRoleId: userRoleId || 'Desconocido',
            accessPointId,
            accessPointName: accessPoint?.name || 'Punto de Acceso Desconocido',
            rfidCardId,
            instituteId: instituteId,
        });
    };

    if (!userProfile) {
        await logAccess('Denegado');
        return { status: 'error', message: 'RFID card not registered.', action: 'deny' };
    }
    
    userDocumentId = userProfile.documentId;
    userName = userProfile.displayName || userProfile.fullName;
    userRoleId = userProfile.roleId;

    if (!instituteId) {
        await logAccess('Denegado');
        return { status: 'error', message: 'Could not determine institute for the user.', action: 'deny' };
    }
    
    const allRoles = await getRoles(instituteId);
    const userRole = allRoles.find(r => r.id === userRoleId);
    userRoleName = userRole?.name || userProfile.role;

    const allAccessPoints = await getAccessPoints(instituteId);
    const targetAccessPoint = allAccessPoints.find(p => p.accessPointId === accessPointId);
    
    if (!targetAccessPoint) {
        await logAccess('Denegado');
        return { status: 'error', message: `Access point '${accessPointId}' not found.`, action: 'deny' };
    }

    const hasPermission = targetAccessPoint.allowedRoleIds?.includes(userRoleId);

    if (hasPermission) {
        await logAccess('Permitido');
        return { status: 'success', message: 'Access granted.', action: 'open' };
    } else {
        await logAccess('Denegado');
        return { status: 'error', message: 'Access denied for this role.', action: 'deny' };
    }
}

export async function GET() {
  return NextResponse.json({ message: "Endpoint is active. Use POST for access attempts." });
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const apiKey = process.env.DEVICE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'DEVICE_API_KEY is not configured on the server.' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${apiKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
