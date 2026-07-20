'use client';

/**
 * @fileOverview Servicio para la gestión de evidencias de Carga No Lectiva.
 * Permite a los docentes reportar actividades y subir informes de cumplimiento.
 */

import { db, uploadFileAndGetURL } from '@/config/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    query, 
    where, 
    Timestamp,
    arrayUnion
} from 'firebase/firestore';
import type { NonTeachingAssignment } from '@/types';

/**
 * Recupera todas las asignaciones no lectivas de un docente para un periodo.
 */
export const getTeacherNonTeachingAssignments = async (
    instituteId: string, 
    teacherId: string, 
    year: string
): Promise<NonTeachingAssignment[]> => {
    try {
        const colRef = collection(db, 'institutes', instituteId, 'nonTeachingAssignments');
        const q = query(
            colRef, 
            where('teacherId', '==', teacherId),
            where('year', '==', year)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
    } catch (error) {
        console.error("Error al obtener carga no lectiva:", error);
        return [];
    }
};

/**
 * Sube una evidencia (informe/foto) y la vincula a la actividad.
 */
export const uploadActivityEvidence = async (
    instituteId: string,
    assignmentId: string,
    file: File,
    description: string
): Promise<void> => {
    try {
        const path = `institutes/${instituteId}/workload/${assignmentId}/${Date.now()}_${file.name}`;
        const downloadURL = await uploadFileAndGetURL(file, path);

        const docRef = doc(db, 'institutes', instituteId, 'nonTeachingAssignments', assignmentId);
        
        await updateDoc(docRef, {
            evidenceUrls: arrayUnion(downloadURL),
            evidenceDescription: description,
            lastUpdate: Timestamp.now()
        });
    } catch (error) {
        console.error("Error al subir evidencia de actividad:", error);
        throw error;
    }
};

/**
 * Obtiene el detalle de una asignación específica.
 */
export const getAssignmentDetail = async (
    instituteId: string,
    assignmentId: string
): Promise<NonTeachingAssignment | null> => {
    try {
        const docRef = doc(db, 'institutes', instituteId, 'nonTeachingAssignments', assignmentId);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } as NonTeachingAssignment : null;
    } catch (error) {
        return null;
    }
};