
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAccessPoints, getRoles, db } from '@/config/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where, doc, runTransaction } from 'firebase/firestore';
import type { AccessState } from '@/types';


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
    
    // This function now uses a transaction to ensure atomicity
    const logAccess = async (status: 'Permitido' | 'Denegado') => {
        const now = Timestamp.now();
        const currentDate = now.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
        const currentHour = now.toDate().getHours(); // 0-23
        
        if (!instituteId) {
             console.error("Cannot log access: instituteId not found for the given RFID card.");
             const unknownLogCollectionRef = collection(db, 'unknown_access_logs');
             await addDoc(unknownLogCollectionRef, {
                timestamp: now,
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
            accessPointDocId = 'unknown_access_points';
        } else {
            accessPointDocId = accessPoint.id;
        }
        
        try {
            await runTransaction(db, async (transaction) => {
                const logCollectionRef = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');
                const statsCollectionRef = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'statistics');
                
                let logType: 'Entrada' | 'Salida' = 'Entrada'; // Default to Entry

                // --- Corrected Entry/Exit Logic ---
                if (userDocumentId) {
                    const accessStatesCol = collection(db, 'institutes', instituteId, 'accessStates');
                    const stateDocRef = doc(accessStatesCol, userDocumentId);
                    
                    const stateDoc = await transaction.get(stateDocRef);
                    const stateData = stateDoc.exists() ? stateDoc.data() as AccessState : null;
                    const lastState = stateData?.lastStateByAccessPoint?.[accessPointDocId];

                    if (lastState && lastState.type === 'Entrada') {
                        const lastDate = lastState.timestamp.toDate().toISOString().split('T')[0];
                        if (lastDate === currentDate) {
                            logType = 'Salida';
                        }
                    }
                    
                    // --- Update user's access state AFTER determining logType ---
                    transaction.set(stateDocRef, {
                        lastStateByAccessPoint: {
                            [accessPointDocId]: {
                                type: logType,
                                timestamp: now
                            }
                        }
                    }, { merge: true });
                }
                
                // 1. Add the new access log entry
                const logDocRef = doc(logCollectionRef);
                transaction.set(logDocRef, {
                    timestamp: now,
                    type: logType,
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

                // 2. Update daily statistics
                const dailyStatsRef = doc(statsCollectionRef, `daily_${currentDate}`);
                const dailyStatsDoc = await transaction.get(dailyStatsRef);
                const dailyData = dailyStatsDoc.exists() ? dailyStatsDoc.data() : null;
                if (!dailyData) {
                    transaction.set(dailyStatsRef, {
                        total: 1,
                        permitted: status === 'Permitido' ? 1 : 0,
                        denied: status === 'Denegado' ? 1 : 0,
                        byHour: { [currentHour]: 1 },
                    });
                } else {
                    transaction.update(dailyStatsRef, {
                        total: (dailyData.total || 0) + 1,
                        permitted: (dailyData.permitted || 0) + (status === 'Permitido' ? 1 : 0),
                        denied: (dailyData.denied || 0) + (status === 'Denegado' ? 1 : 0),
                        [`byHour.${currentHour}`]: (dailyData.byHour?.[currentHour] || 0) + 1,
                    });
                }

                // 3. Update hourly summary statistics
                const hourlyStatsRef = doc(statsCollectionRef, 'hourly_summary');
                const hourlyStatsDoc = await transaction.get(hourlyStatsRef);
                const hourlyData = hourlyStatsDoc.exists() ? hourlyStatsDoc.data() : null;
                if (!hourlyData) {
                    transaction.set(hourlyStatsRef, { byHour: { [currentHour]: 1 } });
                } else {
                    transaction.update(hourlyStatsRef, { [`byHour.${currentHour}`]: (hourlyData.byHour?.[currentHour] || 0) + 1 });
                }

                // 4. Update overall statistics
                const overallStatsRef = doc(statsCollectionRef, 'overall');
                const overallStatsDoc = await transaction.get(overallStatsRef);
                const overallData = overallStatsDoc.exists() ? overallStatsDoc.data() : null;
                if (!overallData) {
                    transaction.set(overallStatsRef, { total: 1, permitted: status === 'Permitido' ? 1 : 0, denied: status === 'Denegado' ? 1 : 0, firstAccess: now, lastAccess: now });
                } else {
                    transaction.update(overallStatsRef, { total: (overallData.total || 0) + 1, permitted: (overallData.permitted || 0) + (status === 'Permitido' ? 1 : 0), denied: (overallData.denied || 0) + (status === 'Denegado' ? 1 : 0), lastAccess: now });
                }
            });
        } catch (e) {
            console.error("Access Log Transaction failed: ", e);
            // If the transaction fails, we might still want to log the attempt somewhere, or handle the error.
            // For now, we'll just log it to the server console.
        }
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

    

    