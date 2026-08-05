/**
 * @fileOverview Servicio modular para la gestión de Horas No Lectivas de los docentes.
 * Permite listar actividades asignadas y subir evidencias (informes/fotos).
 */

import { db, storage, uploadFileAndGetURL } from '@/config/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    query, 
    where, 
    Timestamp,
    arrayUnion,
    orderBy
} from 'firebase/firestore';
import type { NonTeachingAssignment } from '@/types';

/**
 * Obtiene todas las asignaciones no lectivas de un docente para un año específico.
 * Se eliminó el orderBy del servidor para evitar el error de índices faltantes.
 */
export const getTeacherWorkload = async (
    instituteId: string, 
    teacherId: string, 
    year: string
): Promise<NonTeachingAssignment[]> => {
    try {
        const colRef = collection(db, 'institutes', instituteId, 'nonTeachingAssignments');
        
        // Consulta simplificada para evitar requerir índices compuestos manuales
        const q = query(
            colRef, 
            where('teacherId', '==', teacherId),
            where('year', '==', year)
        );

        const snapshot = await getDocs(q);
        const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
        
        // Ordenamiento en el cliente (JavaScript) para mayor estabilidad
        return assignments.sort((a, b) => a.period.localeCompare(b.period));
        
    } catch (error) {
        console.error("Error al obtener carga no lectiva:", error);
        return [];
    }
};

/**
 * Sube un archivo de evidencia y actualiza el registro de la actividad.
 */
export const submitActivityReport = async (
    instituteId: string,
    assignmentId: string,
    file: File,
    description: string
): Promise<void> => {
    try {
        // 1. Subir el archivo al Storage
        const path = `institutes/${instituteId}/workload/${assignmentId}/${Date.now()}_${file.name}`;
        const downloadURL = await uploadFileAndGetURL(file, path);

        // 2. Actualizar el documento en Firestore
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
