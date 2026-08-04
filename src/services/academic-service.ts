
'use client';

/**
 * @fileOverview Servicio especializado para la gestión de Unidades Didácticas.
 * Maneja la lógica de instancias por año y periodo académico para garantizar
 * la integridad histórica de planificaciones, indicadores y sílabos.
 */

import { db, uploadFileAndGetURL, getAcademicRecordRef } from '@/config/firebase';
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
    writeBatch,
    arrayUnion,
    arrayRemove,
    collectionGroup
} from 'firebase/firestore';
import type { 
    Unit, 
    Syllabus, 
    AchievementIndicator, 
    WeekData, 
    Content, 
    Task, 
    UnitPeriod,
    AcademicRecord,
    TaskSubmission,
    StudentProfile
} from '@/types';

/**
 * Helper para obtener la referencia a la instancia académica de una unidad (Año_Periodo).
 */
export const getAcademicInstanceRef = (instituteId: string, unitId: string, year: string, period: string) => {
    return doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'instances', `${year}_${period}`);
};

// --- GESTIÓN DE SÍLABO ---

export const saveSyllabus = async (instituteId: string, unitId: string, year: string, period: string, data: Syllabus): Promise<void> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const syllabusRef = doc(instanceRef, 'data', 'syllabus');
    await setDoc(syllabusRef, data, { merge: true });
};

export const getSyllabus = async (instituteId: string, unitId: string, year: string, period: string): Promise<Syllabus | null> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const syllabusRef = doc(instanceRef, 'data', 'syllabus');
    const docSnap = await getDoc(syllabusRef);
    return docSnap.exists() ? docSnap.data() as Syllabus : null;
};

// --- INDICADORES DE LOGRO ---

export const getAchievementIndicators = async (instituteId: string, unitId: string, year: string, period: string): Promise<AchievementIndicator[]> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const indicatorsCol = collection(instanceRef, 'achievementIndicators');
    const snapshot = await getDocs(query(indicatorsCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, year: string, period: string, data: Omit<AchievementIndicator, 'id'>) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const indicatorsCol = collection(instanceRef, 'achievementIndicators');
    await addDoc(indicatorsCol, data);
};

export const updateAchievementIndicator = async (instituteId: string, unitId: string, year: string, period: string, indicatorId: string, data: Partial<AchievementIndicator>) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const indicatorRef = doc(instanceRef, 'achievementIndicators', indicatorId);
    await updateDoc(indicatorRef, data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, year: string, period: string, indicatorId: string) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const indicatorRef = doc(instanceRef, 'achievementIndicators', indicatorId);
    await deleteDoc(indicatorRef);
};

// --- PLANIFICACIÓN SEMANAL (CONTENIDOS Y TAREAS) ---

export const getWeekData = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number): Promise<WeekData | null> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const weekDocRef = doc(instanceRef, 'weeklyPlanner', `week_${weekNumber}`);
    const docSnap = await getDoc(weekDocRef);
    return docSnap.exists() ? docSnap.data() as WeekData : null;
};

export const getWeeksData = async (instituteId: string, unitId: string, year: string, period: string): Promise<WeekData[]> => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const plannerCol = collection(instanceRef, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    return snapshot.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData));
};

export const setWeekVisibility = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, isVisible: boolean) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const weekDocRef = doc(instanceRef, 'weeklyPlanner', `week_${weekNumber}`);
    await setDoc(weekDocRef, { isVisible, weekNumber }, { merge: true });
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, data: Partial<WeekData>) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const weekDocRef = doc(instanceRef, 'weeklyPlanner', `week_${weekNumber}`);
    await setDoc(weekDocRef, { ...data, weekNumber }, { merge: true });
};

// --- GESTIÓN DE CONTENIDOS ---

export const addContentToWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, data: Omit<Content, 'id'>, file?: File) => {
    const instanceRef = getAcademicInstanceRef(instituteId, unitId, year, period);
    const weekDocRef = doc(instanceRef, 'weeklyPlanner', `week_${weekNumber}`);
    const newContentId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    
    if (data.type === 'file' && file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/${year}_${period}/week_${weekNumber}/${newContentId}`);
    }
    
    const newContent: Content = { 
        ...data, 
        id: newContentId, 
        value: data.type === 'file' ? fileUrl : (data.value || ''), 
        createdAt: Timestamp.now() 
    };
    
    await setDoc(weekDocRef, { contents: arrayUnion(newContent) }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const weekDocRef = doc(getAcademicInstanceRef(instituteId, unitId, year, period), 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekDocRef);
    const weekData = weekSnap.data() as WeekData;
    
    if (!weekData || !weekData.contents) return;
    
    const contentIndex = weekData.contents.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");
    
    const updatedContent = { ...weekData.contents[contentIndex], ...data };
    
    if (data.type === 'file' && file) {
        updatedContent.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/${year}_${period}/week_${weekNumber}/${contentId}`);
    }
    
    weekData.contents[contentIndex] = updatedContent;
    await updateDoc(weekDocRef, { contents: weekData.contents });
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, content: Content) => {
    const weekDocRef = doc(getAcademicInstanceRef(instituteId, unitId, year, period), 'weeklyPlanner', `week_${weekNumber}`);
    await updateDoc(weekDocRef, { contents: arrayRemove(content) });
};

// --- GESTIÓN DE TAREAS ---

export const addTaskToWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, data: Omit<Task, 'id' | 'createdAt' | 'fileUrl'>, file?: File) => {
    const weekDocRef = doc(getAcademicInstanceRef(instituteId, unitId, year, period), 'weeklyPlanner', `week_${weekNumber}`);
    const taskId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    
    if (file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/${year}_${period}/week_${weekNumber}/tasks/${taskId}/reference`);
    }
    
    const newTaskObj: any = {
        id: taskId,
        title: data.title || '',
        description: data.description || '',
        dueDate: data.dueDate,
        createdAt: Timestamp.now()
    };
    
    if (fileUrl) newTaskObj.fileUrl = fileUrl;
    if (data.indicatorId) newTaskObj.indicatorId = data.indicatorId;
    if (data.referenceLink) newTaskObj.referenceLink = data.referenceLink;

    await setDoc(weekDocRef, { tasks: arrayUnion(newTaskObj) }, { merge: true });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, taskId: string, data: Partial<Task>, file?: File) => {
    const weekDocRef = doc(getAcademicInstanceRef(instituteId, unitId, year, period), 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekDocRef);
    const weekData = weekSnap.data() as WeekData;
    
    if (!weekData || !weekData.tasks) return;
    
    const index = weekData.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        let fileUrl = data.fileUrl || weekData.tasks[index].fileUrl;
        if (file) {
            fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/${year}_${period}/week_${weekNumber}/tasks/${taskId}/reference`);
        }
        
        weekData.tasks[index] = { ...weekData.tasks[index], ...data, fileUrl } as Task;
        await updateDoc(weekDocRef, { tasks: weekData.tasks });
    }
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, year: string, period: string, weekNumber: number, taskId: string) => {
    const weekDocRef = doc(getAcademicInstanceRef(instituteId, unitId, year, period), 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekDocRef);
    const weekData = weekSnap.data() as WeekData;
    
    if (!weekData || !weekData.tasks) return;
    
    const item = weekData.tasks.find(t => t.id === taskId);
    if (item) await updateDoc(weekDocRef, { tasks: arrayRemove(item) });
};

export const addManualEvaluationToRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, ids: string[], data: any) => {
    const batch = writeBatch(db);
    const evalId = doc(collection(db, 'idGenerator')).id;
    for (const sId of ids) {
        const recordRef = getAcademicRecordRef(instituteId, sId, year, unitId);
        batch.set(recordRef, { id: recordRef.id, studentId: sId, unitId, year, period, instituteId, evaluations: { [data.indicatorId]: arrayUnion({ ...data, id: evalId, createdAt: Timestamp.now() }) } }, { merge: true });
    }
    await batch.commit();
}

export const deleteManualEvaluationFromRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, indicatorId: string, evalId: string) => {
    const batch = writeBatch(db);
    // Buscamos todas las unidades que coincidan en el grupo de colecciones
    const recordsColGroup = query(
        collectionGroup(db, 'units'), 
        where("instituteId", "==", instituteId), 
        where("unitId", "==", unitId), 
        where("year", "==", year),
        where("period", "==", period)
    );
    const snapshot = await getDocs(recordsColGroup);
    
    snapshot.forEach(d => {
        const data = d.data() as AcademicRecord;
        if (data.evaluations && data.evaluations[indicatorId]) {
            const updated = data.evaluations[indicatorId].filter(e => e.id !== evalId);
            const updatedGrades = (data.grades?.[indicatorId] || []).filter(g => g.refId !== evalId);
            batch.update(d.ref, { 
                [`evaluations.${indicatorId}`]: updated, 
                [`grades.${indicatorId}`]: updatedGrades 
            });
        }
    });
    await batch.commit();
}

/**
 * Registra o actualiza la calificación de un estudiante en una tarea específica.
 * Robusto: Crea el registro de entrega (setDoc con merge) si no existe.
 */
export const gradeTaskSubmission = async (
    instituteId: string, 
    unit: Unit, 
    year: string, 
    period: UnitPeriod, 
    weekNumber: number, 
    taskId: string, 
    taskTitle: string, 
    studentId: string, 
    studentName: string, 
    grade: number, 
    feedback: string
) => {
    const unitId = unit.id;
    const recordRef = getAcademicRecordRef(instituteId, studentId, year, unitId);
    const snap = await getDoc(recordRef);
    const indicators = await getAchievementIndicators(instituteId, unitId, year, period);
    const indicator = indicators.find(ind => weekNumber >= ind.startWeek && weekNumber <= ind.endWeek);

    // 1. Actualizar el registro de entrega individual
    // Usamos setDoc con merge: true para permitir calificar aunque el alumno no haya subido archivo (documento no exista)
    const subRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'taskSubmissions', `${taskId}_${studentId}`);
    await setDoc(subRef, { 
        id: studentId,
        studentName,
        taskId,
        grade, 
        feedback,
        lastGradedAt: Timestamp.now()
    }, { merge: true });

    // 2. Sincronizar con el registro consolidado del estudiante
    if (indicator) {
        const gradeEntry = { type: 'task' as const, refId: taskId, label: taskTitle, grade, weekNumber };
        let grades = snap.exists() ? (snap.data() as AcademicRecord).grades || {} : {};
        let indGrades = grades[indicator.id] || [];
        
        const idx = indGrades.findIndex(g => g.refId === taskId);
        if (idx !== -1) {
            indGrades[idx] = gradeEntry;
        } else {
            indGrades.push(gradeEntry);
        }
        
        grades[indicator.id] = indGrades;

        await setDoc(recordRef, { 
            id: recordRef.id, 
            studentId, 
            unitId, 
            programId: unit.programId, 
            year, 
            period, 
            grades, 
            instituteId 
        }, { merge: true });
    }
};
