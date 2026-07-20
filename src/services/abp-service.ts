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
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import type { Project, ProjectTeam } from '@/types';

/**
 * Recupera todos los proyectos de innovación asociados a una unidad didáctica.
 */
export const getUnitProjects = async (instituteId: string, unitId: string): Promise<Project[]> => {
    try {
        const projectsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects');
        const q = query(projectsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    } catch (error) {
        console.error("Error al obtener los proyectos ABP:", error);
        return [];
    }
};

/**
 * Obtiene un proyecto específico por su ID.
 */
export const getProjectById = async (instituteId: string, unitId: string, projectId: string): Promise<Project | null> => {
    try {
        const projectRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects', projectId);
        const docSnap = await getDoc(projectRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Project : null;
    } catch (error) {
        return null;
    }
};

/**
 * Guarda un nuevo proyecto de innovación.
 */
export const createUnitProject = async (instituteId: string, unitId: string, data: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const projectsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects');
        const docRef = await addDoc(projectsCol, {
            ...data,
            createdAt: Timestamp.now(),
            lastUpdate: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al crear el proyecto ABP:", error);
        throw error;
    }
};

/**
 * Actualiza un proyecto existente.
 */
export const updateUnitProject = async (instituteId: string, unitId: string, projectId: string, data: Partial<Project>): Promise<void> => {
    try {
        const projectRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects', projectId);
        await updateDoc(projectRef, {
            ...data,
            lastUpdate: Timestamp.now()
        });
    } catch (error) {
        console.error("Error al actualizar el proyecto ABP:", error);
        throw error;
    }
};

/**
 * Elimina un proyecto de la unidad.
 */
export const deleteUnitProject = async (instituteId: string, unitId: string, projectId: string): Promise<void> => {
    try {
        const projectRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects', projectId);
        await deleteDoc(projectRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Obtiene los equipos de trabajo conformados para una unidad específica.
 */
export const getProjectTeams = async (instituteId: string, unitId: string): Promise<ProjectTeam[]> => {
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
 * Registra un nuevo equipo de proyecto.
 */
export const saveProjectTeam = async (instituteId: string, unitId: string, teamData: Omit<ProjectTeam, 'id'>): Promise<void> => {
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
