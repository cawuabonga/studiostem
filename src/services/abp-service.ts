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
    query, 
    orderBy, 
    Timestamp,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import type { Project, ProjectTeam } from '@/types';
import { getAcademicInstanceRef } from './academic-service';

/**
 * Recupera todos los proyectos de innovación asociados a una instancia académica.
 */
export const getUnitProjects = async (instituteId: string, unitId: string, year: string, period: string): Promise<Project[]> => {
    try {
        const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
        const projectsCol = collection(instanceRef, 'projects');
        const q = query(projectsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    } catch (error) {
        console.error("Error al obtener los proyectos ABP:", error);
        return [];
    }
};

/**
 * Guarda un nuevo proyecto de innovación.
 */
export const createUnitProject = async (instituteId: string, unitId: string, year: string, period: string, data: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const projectsCol = collection(instanceRef, 'projects');
    const docRef = await addDoc(projectsCol, {
        ...data,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

/**
 * Actualiza un proyecto existente.
 */
export const updateUnitProject = async (instituteId: string, unitId: string, year: string, period: string, projectId: string, data: Partial<Project>): Promise<void> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const projectRef = doc(instanceRef, 'projects', projectId);
    await updateDoc(projectRef, data);
};

/**
 * Elimina un proyecto de la unidad.
 */
export const deleteUnitProject = async (instituteId: string, unitId: string, year: string, period: string, projectId: string): Promise<void> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const projectRef = doc(instanceRef, 'projects', projectId);
    await deleteDoc(projectRef);
};

/**
 * Obtiene los equipos de trabajo conformados para una unidad específica.
 */
export const getProjectTeams = async (instituteId: string, unitId: string, year: string, period: string): Promise<ProjectTeam[]> => {
    try {
        const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
        const teamsCol = collection(instanceRef, 'teams');
        const q = query(teamsCol, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectTeam));
    } catch (error) {
        console.error("Error al obtener los equipos ABP:", error);
        return [];
    }
};

/**
 * Registra un nuevo equipo de proyecto.
 */
export const saveProjectTeam = async (instituteId: string, unitId: string, year: string, period: string, teamData: Omit<ProjectTeam, 'id'>): Promise<void> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const teamsCol = collection(instanceRef, 'teams');
    await addDoc(teamsCol, {
        ...teamData,
        createdAt: Timestamp.now()
    });
};
