'use client';

/**
 * @fileOverview Servicio especializado para la Metodología ABP (Aprendizaje Basado en Proyectos).
 * Maneja el diseño de retos, rúbricas y conformación de equipos de innovación.
 */

import { db } from '@/config/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    query, 
    orderBy, 
    Timestamp,
    addDoc
} from 'firebase/firestore';
import type { Project, ProjectTeam } from '@/types';

/**
 * Recupera el proyecto de innovación asociado a una unidad didáctica.
 */
export const getUnitProject = async (instituteId: string, unitId: string): Promise<Project | null> => {
    try {
        const projectRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'project');
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Project;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener el proyecto ABP:", error);
        throw error;
    }
};

/**
 * Guarda o actualiza el diseño del proyecto y sus rúbricas.
 */
export const saveUnitProject = async (instituteId: string, unitId: string, data: Partial<Project>): Promise<string> => {
    try {
        const projectRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'project');
        const payload = {
            ...data,
            lastUpdate: Timestamp.now()
        };
        await setDoc(projectRef, payload, { merge: true });
        return projectRef.id;
    } catch (error) {
        console.error("Error al guardar el proyecto ABP:", error);
        throw error;
    }
};

/**
 * Obtiene los equipos de trabajo conformados para un proyecto específico.
 */
export const getProjectTeams = async (instituteId: string, unitId: string, projectId: string): Promise<ProjectTeam[]> => {
    try {
        const teamsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'teams');
        const q = query(teamsCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectTeam));
    } catch (error) {
        console.error("Error al obtener los equipos ABP:", error);
        return [];
    }
};

/**
 * Registra un nuevo equipo de proyecto o actualiza uno existente.
 */
export const saveProjectTeam = async (instituteId: string, unitId: string, projectId: string, teamData: Omit<ProjectTeam, 'id'>): Promise<void> => {
    try {
        const teamsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'teams');
        await addDoc(teamsCol, {
            ...teamData,
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error al guardar el equipo ABP:", error);
        throw error;
    }
};
