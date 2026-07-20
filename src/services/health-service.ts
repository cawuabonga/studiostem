
'use client';

/**
 * @fileOverview Servicio especializado para la gestión del área de Tópico y Salud.
 * Permite gestionar fichas médicas y registrar consultas para toda la comunidad institucional.
 */

import { db } from '@/config/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    query, 
    where, 
    orderBy, 
    Timestamp,
    addDoc,
    updateDoc,
    limit
} from 'firebase/firestore';
import type { MedicalInfo, MedicalConsultation } from '@/types';

/**
 * Recupera la información médica base de un perfil (estudiante o personal).
 */
export const getMedicalInfo = async (
    instituteId: string, 
    patientId: string, 
    type: 'student' | 'staff'
): Promise<MedicalInfo | null> => {
    try {
        const profileCollection = type === 'student' ? 'studentProfiles' : 'staffProfiles';
        const profileRef = doc(db, 'institutes', instituteId, profileCollection, patientId);
        const docSnap = await getDoc(profileRef);
        
        if (docSnap.exists()) {
            return docSnap.data().medicalInfo as MedicalInfo || null;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener información médica:", error);
        return null;
    }
};

/**
 * Actualiza o crea la ficha médica de un usuario.
 */
export const updateMedicalInfo = async (
    instituteId: string,
    patientId: string,
    type: 'student' | 'staff',
    data: MedicalInfo
): Promise<void> => {
    try {
        const profileCollection = type === 'student' ? 'studentProfiles' : 'staffProfiles';
        const profileRef = doc(db, 'institutes', instituteId, profileCollection, patientId);
        
        await updateDoc(profileRef, {
            medicalInfo: {
                ...data,
                lastUpdate: Timestamp.now()
            }
        });
    } catch (error) {
        console.error("Error al actualizar ficha médica:", error);
        throw error;
    }
};

/**
 * Registra una nueva consulta médica en Tópico.
 */
export const registerConsultation = async (
    instituteId: string,
    data: Omit<MedicalConsultation, 'id' | 'date'>
): Promise<string> => {
    try {
        const consultationsCol = collection(db, 'institutes', instituteId, 'medicalConsultations');
        const docRef = await addDoc(consultationsCol, {
            ...data,
            date: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al registrar consulta:", error);
        throw error;
    }
};

/**
 * Obtiene el historial de consultas de un paciente.
 */
export const getPatientConsultationHistory = async (
    instituteId: string,
    patientId: string
): Promise<MedicalConsultation[]> => {
    try {
        const colRef = collection(db, 'institutes', instituteId, 'medicalConsultations');
        const q = query(
            colRef,
            where('patientId', '==', patientId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalConsultation));
    } catch (error) {
        console.error("Error al obtener historial de consultas:", error);
        return [];
    }
};

/**
 * Obtiene las consultas más recientes del instituto para el monitor global.
 */
export const getRecentConsultations = async (
    instituteId: string,
    limitCount: number = 10
): Promise<MedicalConsultation[]> => {
    try {
        const colRef = collection(db, 'institutes', instituteId, 'medicalConsultations');
        const q = query(colRef, orderBy('date', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalConsultation));
    } catch (error) {
        console.error("Error al obtener consultas recientes:", error);
        return [];
    }
};
