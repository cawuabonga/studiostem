
'use client';

/**
 * @fileOverview Servicio especializado para el sistema EDA (Elaboración de Documentos Automáticos).
 * Maneja la gestión de kioscos de impresión, plantillas de documentos y logs de generación.
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
    limit
} from 'firebase/firestore';
import type { Kiosk, DocumentTemplate, DocumentGenerationLog } from '@/types';

/**
 * Recupera todos los kioscos (puntos de impresión) de un instituto.
 */
export const getKiosks = async (instituteId: string): Promise<Kiosk[]> => {
    try {
        const kiosksCol = collection(db, 'institutes', instituteId, 'edaKiosks');
        const q = query(kiosksCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kiosk));
    } catch (error) {
        console.error("Error al obtener kioscos EDA:", error);
        return [];
    }
};

/**
 * Registra o actualiza un kiosco.
 */
export const saveKiosk = async (instituteId: string, kioskData: Omit<Kiosk, 'id'>, id?: string): Promise<void> => {
    try {
        const kiosksCol = collection(db, 'institutes', instituteId, 'edaKiosks');
        const kioskRef = id ? doc(kiosksCol, id) : doc(kiosksCol);
        await setDoc(kioskRef, {
            ...kioskData,
            instituteId,
            lastHeartbeat: Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error al guardar kiosco EDA:", error);
        throw error;
    }
};

/**
 * Elimina un kiosco.
 */
export const deleteKiosk = async (instituteId: string, id: string): Promise<void> => {
    try {
        const kioskRef = doc(db, 'institutes', instituteId, 'edaKiosks', id);
        await deleteDoc(kioskRef);
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
        const q = query(templatesCol, orderBy('createdAt', 'desc'));
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
        await setDoc(templateRef, {
            ...data,
            instituteId,
            createdAt: id ? undefined : Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error al guardar plantilla EDA:", error);
        throw error;
    }
};

/**
 * Registra un log de generación de documento desde un kiosco.
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
