
'use client';

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
};

/**
 * Registra un evento de escaneo RFID en un terminal EDA.
 */
export const registerEdaScan = async (rfidCardId: string, accessPointId: string) => {
    const studentQuery = query(collectionGroup(db, 'studentProfiles'), where('rfidCardId', '==', rfidCardId));
    const studentSnap = await getDocs(studentQuery);

    if (studentSnap.empty) {
        throw new Error('Tarjeta RFID no vinculada a ningún estudiante');
    }

    const studentDoc = studentSnap.docs[0];
    const studentData = studentDoc.data();
    const instituteId = studentData.instituteId;

    const apQuery = query(
        collection(db, 'institutes', instituteId, 'edaPrintPoints'), 
        where('pointId', '==', accessPointId)
    );
    const apSnap = await getDocs(apQuery);

    if (apSnap.empty) {
        throw new Error('Terminal Point Print no encontrado en este instituto');
    }

    const pointRef = apSnap.docs[0].ref;

    await updateDoc(pointRef, {
        currentStudentId: studentDoc.id,
        lastScanAt: Timestamp.now()
    });

    return {
        studentName: studentData.fullName || studentData.displayName
    };
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
