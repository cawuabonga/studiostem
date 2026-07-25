
'use client';

/**
 * @fileOverview Servicio especializado para el sistema EDA (Elaboración de Documentos Automáticos).
 * Maneja la gestión de puntos de impresión, plantillas de documentos y logs de generación.
 */

import { db } from '@/config/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    Timestamp,
    addDoc,
    limit,
    onSnapshot
} from 'firebase/firestore';
import type { PrintPoint, DocumentTemplate, DocumentGenerationLog } from '@/types';

/**
 * Recupera todos los puntos de impresión (point print) de un instituto.
 */
export const getPrintPoints = async (instituteId: string): Promise<PrintPoint[]> => {
    try {
        const pointsCol = collection(db, 'institutes', instituteId, 'edaPrintPoints');
        const q = query(pointsCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrintPoint));
    } catch (error) {
        console.error("Error al obtener puntos de impresión EDA:", error);
        return [];
    }
};

/**
 * Escucha en tiempo real un punto de impresión específico.
 * Utilizado por el Kiosko para detectar escaneos RFID.
 */
export const listenToPrintPoint = (instituteId: string, pointId: string, callback: (point: PrintPoint | null) => void) => {
    const docRef = doc(db, 'institutes', instituteId, 'edaPrintPoints', pointId);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as PrintPoint);
        } else {
            callback(null);
        }
    });
};

/**
 * Registra o actualiza un punto de impresión.
 */
export const savePrintPoint = async (instituteId: string, pointData: Omit<PrintPoint, 'id'>, id?: string): Promise<void> => {
    try {
        const pointsCol = collection(db, 'institutes', instituteId, 'edaPrintPoints');
        const pointRef = id ? doc(pointsCol, id) : doc(pointsCol);
        await setDoc(pointRef, {
            ...pointData,
            instituteId,
            lastHeartbeat: Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error al guardar punto de impresión EDA:", error);
        throw error;
    }
};

/**
 * Cierra la sesión activa en un punto de impresión.
 */
export const closeKioskSession = async (instituteId: string, pointId: string) => {
    const pointRef = doc(db, 'institutes', instituteId, 'edaPrintPoints', pointId);
    await updateDoc(pointRef, {
        currentStudentId: null,
        lastScanAt: null
    });
};

/**
 * Elimina un punto de impresión.
 */
export const deletePrintPoint = async (instituteId: string, id: string): Promise<void> => {
    try {
        const pointRef = doc(db, 'institutes', instituteId, 'edaPrintPoints', id);
        await deleteDoc(pointRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Recupera todas las plantillas de documentos activas.
 */
export const getDocumentTemplates = async (instituteId: string): Promise<DocumentTemplate[]> => {
    try {
        const templatesCol = collection(db, 'institutes', instituteId, 'edaTemplates');
        const q = query(templatesCol, where('isActive', '==', true), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentTemplate));
    } catch (error) {
        console.error("Error al obtener plantillas EDA:", error);
        return [];
    }
};

/**
 * Guarda o actualiza una plantilla de documento.
 */
export const saveDocumentTemplate = async (instituteId: string, data: Omit<DocumentTemplate, 'id' | 'createdAt'>, id?: string): Promise<void> => {
    try {
        const templatesCol = collection(db, 'institutes', instituteId, 'edaTemplates');
        const templateRef = id ? doc(templatesCol, id) : doc(templatesCol);
        
        const payload: any = {
            ...data,
            instituteId,
        };

        if (!id) {
            payload.createdAt = Timestamp.now();
        }

        await setDoc(templateRef, payload, { merge: true });
    } catch (error) {
        console.error("Error al guardar plantilla EDA:", error);
        throw error;
    }
};

/**
 * Registra un log de generación de documento desde un punto de impresión.
 */
export const registerGenerationLog = async (instituteId: string, log: Omit<DocumentGenerationLog, 'id' | 'timestamp'>): Promise<void> => {
    try {
        const logsCol = collection(db, 'institutes', instituteId, 'edaLogs');
        await addDoc(logsCol, {
            ...log,
            timestamp: Timestamp.now()
        });
    } catch (error) {
        console.error("Error al registrar log EDA:", error);
    }
};

/**
 * Obtiene los últimos logs de impresión para auditoría.
 */
export const getEDAHistory = async (instituteId: string, limitCount: number = 50): Promise<DocumentGenerationLog[]> => {
    try {
        const logsCol = collection(db, 'institutes', instituteId, 'edaLogs');
        const q = query(logsCol, orderBy('timestamp', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentGenerationLog));
    } catch (error) {
        return [];
    }
};
