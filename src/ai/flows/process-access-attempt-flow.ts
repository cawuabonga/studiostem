
'use server';
/**
 * @fileOverview A Genkit flow for processing access attempts from RFID readers.
 * This function is designed to be called via an HTTP request from an ESP32 or similar device.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStaffProfileByDocumentId, getStudentProfile, getAccessPoints, getRoles } from '@/config/firebase';
import { getFirestore, collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Define the input schema for the flow
const AccessAttemptInputSchema = z.object({
  accessPointId: z.string().describe('The unique ID of the access point device making the request.'),
  rfidCardId: z.string().describe('The RFID card ID that was scanned.'),
});
export type AccessAttemptInput = z.infer<typeof AccessAttemptInputSchema>;

// Define the output schema for the flow
const AccessAttemptOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  action: z.enum(['open', 'deny']),
});
export type AccessAttemptOutput = z.infer<typeof AccessAttemptOutputSchema>;

// The main flow function
export const processAccessAttemptFlow = ai.defineFlow(
  {
    name: 'processAccessAttemptFlow',
    inputSchema: AccessAttemptInputSchema,
    outputSchema: AccessAttemptOutputSchema,
    auth: (auth, input) => {
        // IMPORTANT: This is a simple API key authentication for the device.
        // In a production environment, you should use a more secure method like OAuth or service accounts.
        const apiKey = process.env.DEVICE_API_KEY;
        if (!apiKey) {
            throw new Error('DEVICE_API_KEY is not configured on the server.');
        }
        if (auth.authHeader !== `Bearer ${apiKey}`) {
            throw new Error('Unauthorized');
        }
    }
  },
  async ({ accessPointId, rfidCardId }) => {
    let userProfile: any = null;
    let userRoleId = '';
    let userRoleName = '';
    let userName = '';
    let userDocumentId = '';
    let instituteId = '';
    let accessPointDocId = ''; // To store the Firestore document ID of the access point

    // Ugly but necessary: search across all institutes for the card ID
    // In a real-world scenario with many institutes, this would be inefficient.
    // A better approach would be a top-level collection `rfidMappings` for direct lookups.
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
    
    // Log attempt details
    const logAccess = async (status: 'Permitido' | 'Denegado') => {
        if (!instituteId) {
            console.error("Cannot log access: instituteId not found for the given RFID card.");
            // Log to a general "unknown_rfid" log if needed
            return;
        }
        
        const accessPoints = await getAccessPoints(instituteId);
        const accessPoint = accessPoints.find(p => p.accessPointId === accessPointId);
        
        if (!accessPoint) {
            console.error(`Access point with ID ${accessPointId} not found in institute ${instituteId}. Logging attempt anyway.`);
            // You might want to log this attempt in a special "unknown_points" collection
            // We will proceed to log with a generic access point name.
            accessPointDocId = 'unknown_access_points'; // Log to a generic document
        } else {
            accessPointDocId = accessPoint.id; // Store the document ID
        }

        // Ensure we have a valid accessPointDocId to proceed.
        // It will be 'unknown_access_points' if not found, or the actual ID if found.
        const logCollectionRef = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');

        await addDoc(logCollectionRef, {
            timestamp: Timestamp.now(),
            type: 'Entrada', // Assuming 'Entrada' for now
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
        // This case should theoretically not be reached if userProfile is found
        await logAccess('Denegado');
        return { status: 'error', message: 'Could not determine institute for the user.', action: 'deny' };
    }
    
    const allRoles = await getRoles(instituteId);
    const userRole = allRoles.find(r => r.id === userRoleId);
    userRoleName = userRole?.name || userProfile.role; // Fallback to legacy role

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
);
