/**
 * @fileOverview Servicio de Base de Datos para el ecosistema EDA.
 * Centraliza las operaciones de Firestore para Puntos de Impresión,
 * Telemetría y Documentos Automáticos.
 */

import { db } from '@/config/firebase';
import { 
    collectionGroup, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    serverTimestamp,
    Timestamp,
    doc,
    addDoc,
    collection,
    limit,
    orderBy
} from 'firebase/firestore';
import type { PrintPoint, DocumentGenerationLog } from '@/types';

/**
 * Actualiza la telemetría de hardware enviada por el agente Python.
 * @param pointId Identificador técnico del hardware (Hard-ID).
 * @param data Objeto con el estado de la impresora, papel y tóner.
 */
export const updatePrinterTelemetry = async (
    pointId: string, 
    data: { 
        status?: string, 
        paper?: string, 
        toner?: number, 
        printerName?: string 
    }
) => {
    try {
        // 1. Localizar el punto de impresión en todo el ecosistema (SaaS)
        const q = query(
            collectionGroup(db, 'edaPrintPoints'),
            where('pointId', '==', pointId)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            throw new Error(`No se encontró configuración para el Hard-ID: ${pointId}`);
        }

        // 2. Obtener referencia al documento específico
        const pointDoc = snap.docs[0];
        const pointRef = pointDoc.ref;

        // 3. Ejecutar la actualización con marcas de tiempo de servidor
        await updateDoc(pointRef, {
            printerStatus: data.status || 'Online',
            paperStatus: data.paper || 'OK',
            tonerLevel: data.toner !== undefined ? Number(data.toner) : 85,
            printerName: data.printerName || 'Impresora Local',
            lastHeartbeat: serverTimestamp() 
        });

        return {
            path: pointRef.path,
            pointId: pointId
        };
    } catch (error: any) {
        console.error("[TELEMETRY ERROR]", error.message);
        throw error;
    }
};

/**
 * Registra un evento de escaneo RFID en un terminal EDA.
 * Soporta identificación de Estudiantes y Personal.
 * Versión robusta para entornos SaaS.
 */
export const registerEdaScan = async (rfidCardId: string, terminalPointId: string) => {
    try {
        // 1. BUSCAR AL USUARIO (Estudiante o Personal) GLOBALMENTE
        const staffQuery = query(collectionGroup(db, 'staffProfiles'), where('rfidCardId', '==', rfidCardId));
        const studentQuery = query(collectionGroup(db, 'studentProfiles'), where('rfidCardId', '==', rfidCardId));
        
        const [staffSnap, studentSnap] = await Promise.all([getDocs(staffQuery), getDocs(studentQuery)]);

        let userDoc = null;
        if (!studentSnap.empty) {
            userDoc = studentSnap.docs[0];
        } else if (!staffSnap.empty) {
            userDoc = staffSnap.docs[0];
        }

        if (!userDoc) {
            throw new Error('Tarjeta RFID no vinculada a ningún usuario en el sistema.');
        }

        const userData = userDoc.data();
        const userInstituteId = userData.instituteId || userDoc.ref.parent.parent?.id;

        // 2. BUSCAR EL TERMINAL GLOBALMENTE (Detección de procedencia)
        const pointQuery = query(
            collectionGroup(db, 'edaPrintPoints'),
            where('pointId', '==', terminalPointId)
        );
        const pointSnap = await getDocs(pointQuery);

        if (pointSnap.empty) {
            throw new Error(`El terminal "${terminalPointId}" no está registrado en la red STEM.`);
        }

        const terminalDoc = pointSnap.docs[0];
        const terminalInstituteId = terminalDoc.data().instituteId || terminalDoc.ref.parent.parent?.id;

        // 3. VALIDAR QUE EL USUARIO Y EL TERMINAL PERTENECEN AL MISMO INSTITUTO
        if (userInstituteId !== terminalInstituteId) {
            console.error(`[SECURITY] Intento de acceso cruzado: Usuario(${userInstituteId}) en Terminal(${terminalInstituteId})`);
            throw new Error('El alumno no pertenece a la institución de este terminal.');
        }

        // 4. DESBLOQUEAR LA SESIÓN EN EL KIOSKO
        await updateDoc(terminalDoc.ref, {
            currentStudentId: userDoc.id,
            lastScanAt: Timestamp.now()
        });

        return {
            studentName: userData.fullName || userData.displayName || 'Usuario Identificado'
        };
    } catch (error: any) {
        console.error("[EDA DB SCAN ERROR]", error.message);
        throw error;
    }
};

/**
 * Registra un log oficial de generación de documento.
 */
export const logDocumentGeneration = async (instituteId: string, logData: Omit<DocumentGenerationLog, 'id' | 'timestamp'>) => {
    const logsCol = collection(db, 'institutes', instituteId, 'edaLogs');
    await addDoc(logsCol, {
        ...logData,
        timestamp: serverTimestamp()
    });
};
