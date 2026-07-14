'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot, increment, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, UnitTurno, TaskSubmission, AIConfig, SocialLinks, CompanyProfile, JobOffer, JobApplication, Plan, InstituteMetrics, DailyActivity, Project, ProjectTeam } from '@/types';

const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.firebasestorage.app",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8",
  measurementId: "G-5FP9BYXHPF"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

if (typeof window !== 'undefined') {
    getAnalytics(app);
}

const auth = getAuth(app);
const db = getFirestore(app);
const firebaseStorage = getStorage(app);

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

// --- Utilidades Generales ---

export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// --- Gestión de Perfiles y Usuarios ---

export const getStudentProfile = async (instituteId: string, studentId: string): Promise<StudentProfile | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { documentId: docSnap.id, ...docSnap.data() } as StudentProfile : null;
};

export const getStaffProfileByDocumentId = async (instituteId: string, staffId: string): Promise<StaffProfile | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'staffProfiles', staffId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { documentId: docSnap.id, ...docSnap.data() } as StaffProfile : null;
};

export const linkUserToProfile = async (uid: string, documentId: string, email: string): Promise<{ role: string, instituteName: string }> => {
    const institutes = await getInstitutes();
    let foundProfile: any = null;
    let targetInstId = '';
    let targetInstName = '';

    for (const inst of institutes) {
        const student = await getStudentProfile(inst.id, documentId);
        if (student && student.email.toLowerCase() === email.toLowerCase()) {
            foundProfile = student;
            targetInstId = inst.id;
            targetInstName = inst.name;
            break;
        }
        const staff = await getStaffProfileByDocumentId(inst.id, documentId);
        if (staff && staff.email.toLowerCase() === email.toLowerCase()) {
            foundProfile = staff;
            targetInstId = inst.id;
            targetInstName = inst.name;
            break;
        }
    }

    if (!foundProfile) throw new Error("No se encontró un perfil que coincida con los datos proporcionados.");

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        documentId,
        instituteId: targetInstId,
        roleId: foundProfile.roleId,
        role: foundProfile.role
    }, { merge: true });

    const profileRef = doc(db, 'institutes', targetInstId, foundProfile.roleId === 'student' ? 'studentProfiles' : 'staffProfiles', documentId);
    await updateDoc(profileRef, { linkedUserUid: uid });

    return { role: foundProfile.role, instituteName: targetInstName };
};

export const updateUserProfile = async (data: Partial<AppUser>): Promise<void> => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, data);
};

// --- PBL / ABP (Aprendizaje Basado en Proyectos) ---

export const getUnitProject = async (instituteId: string, unitId: string): Promise<Project | null> => {
    const q = query(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Project;
};

export const saveUnitProject = async (instituteId: string, unitId: string, data: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
    const col = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects');
    const existing = await getUnitProject(instituteId, unitId);
    
    if (existing) {
        await updateDoc(doc(col, existing.id), data);
        return existing.id;
    } else {
        const docRef = await addDoc(col, { ...data, createdAt: Timestamp.now() });
        return docRef.id;
    }
};

export const getProjectTeams = async (instituteId: string, unitId: string, projectId: string): Promise<ProjectTeam[]> => {
    const col = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects', projectId, 'teams');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectTeam));
};

export const saveProjectTeam = async (instituteId: string, unitId: string, projectId: string, team: Omit<ProjectTeam, 'id'>): Promise<void> => {
    const col = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'projects', projectId, 'teams');
    await addDoc(col, team);
};

// --- Observabilidad y Métricas ---

export const trackDailyActivity = async (instituteId: string, roleId: string, userId: string): Promise<void> => {
    if (!instituteId || !roleId) return;
    const today = new Date().toISOString().split('T')[0];
    const activityRef = doc(db, 'institutes', instituteId, 'analytics', `activity_${today}`);
    const trackingKey = `track_${userId}_${today}`;
    
    if (typeof window !== 'undefined') {
        if (localStorage.getItem(trackingKey)) return;
        localStorage.setItem(trackingKey, 'true');
    }

    const fieldMap: Record<string, string> = {
        'student': 'student', 'teacher': 'teacher', 'admin': 'admin', 'coordinator': 'coordinator', 'graduate': 'graduate', 'company': 'company'
    };
    const roleField = fieldMap[roleId.toLowerCase()] || 'other';

    await setDoc(activityRef, {
        total: increment(1),
        [roleField]: increment(1),
        lastUpdate: Timestamp.now()
    }, { merge: true });
};

export const getInstituteMetrics = async (instituteId: string): Promise<InstituteMetrics> => {
    const today = new Date().toISOString().split('T')[0];
    const activityDocRef = doc(db, 'institutes', instituteId, 'analytics', `activity_${today}`);
    const [studentsSnap, staffSnap, unitsSnap, activitySnap] = await Promise.all([
        getCountFromServer(collection(db, 'institutes', instituteId, 'studentProfiles')),
        getCountFromServer(collection(db, 'institutes', instituteId, 'staffProfiles')),
        getCountFromServer(collection(db, 'institutes', instituteId, 'unidadesDidacticas')),
        getDoc(activityDocRef)
    ]);

    return {
        totalStudents: studentsSnap.data().count,
        totalStaff: staffSnap.data().count,
        totalUnits: unitsSnap.data().count,
        activeToday: activitySnap.exists() ? activitySnap.data() as DailyActivity : { total: 0, student: 0, teacher: 0, admin: 0, coordinator: 0, graduate: 0, company: 0, lastUpdate: Timestamp.now() },
        totalPayments: 0,
        totalRevenue: 0
    };
};

// --- Gestión de Sílabos y Planificación Semanal ---

export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'syllabus', 'main');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as Syllabus : null;
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'syllabus', 'main');
    await setDoc(docRef, data, { merge: true });
};

export const getWeeksData = async (instituteId: string, unitId: string): Promise<WeekData[]> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    return snapshot.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData))
        .sort((a, b) => a.weekNumber - b.weekNumber);
};

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { weekNumber, ...docSnap.data() } as WeekData : null;
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: Partial<WeekData>): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    await setDoc(docRef, data, { merge: true });
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    await setDoc(docRef, { isVisible }, { merge: true });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Omit<Content, 'id'>, file?: File): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const contentId = Math.random().toString(36).substring(7);
    let value = content.value;
    if (content.type === 'file' && file) {
        value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/content/${contentId}`);
    }
    await setDoc(weekRef, { contents: arrayUnion({ id: contentId, ...content, value }) }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, content: Partial<Content>, file?: File): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekRef);
    const data = weekSnap.data() as WeekData;
    const contents = data.contents || [];
    const index = contents.findIndex(c => c.id === contentId);
    if (index !== -1) {
        let value = content.value || contents[index].value;
        if (content.type === 'file' && file) {
            value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/content/${contentId}`);
        }
        contents[index] = { ...contents[index], ...content, value };
        await updateDoc(weekRef, { contents });
    }
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    await updateDoc(weekRef, { contents: arrayRemove(content) });
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, task: Omit<Task, 'id'>, file?: File): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const taskId = Math.random().toString(36).substring(7);
    let fileUrl = '';
    if (file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/tasks/${taskId}`);
    }
    await setDoc(weekRef, { tasks: arrayUnion({ id: taskId, ...task, fileUrl }) }, { merge: true });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, task: Partial<Task>, file?: File): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekRef);
    const data = weekSnap.data() as WeekData;
    const tasks = data.tasks || [];
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        let fileUrl = task.fileUrl || tasks[index].fileUrl || '';
        if (file) {
            fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/tasks/${taskId}`);
        }
        tasks[index] = { ...tasks[index], ...task, fileUrl };
        await updateDoc(weekRef, { tasks });
    }
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<void> => {
    const weekRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const weekSnap = await getDoc(weekRef);
    const tasks = (weekSnap.data()?.tasks || []) as Task[];
    await updateDoc(weekRef, { tasks: tasks.filter(t => t.id !== taskId) });
};

// --- Entregas y Calificación de Tareas ---

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const snap = await getDocs(submissionsCol);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
};

export const submitTask = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, student: StudentProfile, file?: File, link?: string): Promise<void> => {
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', student.documentId);
    let fileUrl = '';
    if (file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/submissions/${taskId}/${student.documentId}`);
    }
    await setDoc(submissionRef, {
        studentId: student.documentId,
        studentName: student.fullName,
        submittedAt: Timestamp.now(),
        fileUrl,
        link: link || null
    }, { merge: true });
};

export const gradeTaskSubmission = async (
    instituteId: string, unitId: string, year: string, period: UnitPeriod,
    weekNumber: number, taskId: string, taskTitle: string, studentId: string, studentName: string,
    grade: number, feedback: string
): Promise<void> => {
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentId);
    await updateDoc(submissionRef, { grade, feedback });

    const recordId = `${unitId}_${studentId}_${year}_${period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    const task = weekData?.tasks?.find(t => t.id === taskId);
    const indicatorId = task?.indicatorId || 'general';

    const recordSnap = await getDoc(recordRef);
    if (recordSnap.exists()) {
        const record = recordSnap.data() as AcademicRecord;
        const grades = record.grades || {};
        if (!grades[indicatorId]) grades[indicatorId] = [];
        const existingIndex = grades[indicatorId].findIndex(g => g.refId === taskId);
        const gradeEntry = { type: 'task' as const, refId: taskId, label: taskTitle, grade, weekNumber };
        if (existingIndex !== -1) grades[indicatorId][existingIndex] = gradeEntry;
        else grades[indicatorId].push(gradeEntry);
        await updateDoc(recordRef, { grades });
    }
};

// --- Asistencia ---

export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const docId = `${unitId}_${year}_${period}`;
    const docRef = doc(db, 'institutes', instituteId, 'attendance', docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, record: AttendanceRecord): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'attendance', record.id);
    await setDoc(docRef, record, { merge: true });
};

export const saveAttendanceLimitWeek = async (instituteId: string, unitId: string, week: number): Promise<void> => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, { attendanceLimitWeek: week });
};

// --- Registros Académicos y Evaluación ---

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
  const recordsCol = collection(db, 'institutes', instituteId, 'academicRecords');
  const q = query(recordsCol, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const recordId = `${unitId}_${studentId}_${year}_${period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    const docSnap = await getDoc(recordRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AcademicRecord : null;
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]): Promise<void> => {
    const batch = writeBatch(db);
    records.forEach(record => {
        const docRef = doc(db, 'institutes', instituteId, 'academicRecords', record.id);
        batch.set(docRef, record, { merge: true });
    });
    await batch.commit();
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]): Promise<void> => {
    const batch = writeBatch(db);
    results.forEach(res => {
        const recordId = `${unitId}_${res.studentId}_${year}_${period}`;
        const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
        batch.update(recordRef, { finalGrade: res.finalGrade, status: res.status });
    });
    await batch.commit();
};

export const addManualEvaluationToRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, studentIds: string[], evalData: { indicatorId: string, label: string, weekNumber: number }): Promise<void> => {
    const evalId = Math.random().toString(36).substring(7);
    const batch = writeBatch(db);
    studentIds.forEach(studentId => {
        const recordId = `${unitId}_${studentId}_${year}_${period}`;
        const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
        batch.set(recordRef, { 
            evaluations: { [evalData.indicatorId]: arrayUnion({ id: evalId, ...evalData }) } 
        }, { merge: true });
    });
    await batch.commit();
};

export const deleteManualEvaluationFromRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, indicatorId: string, evaluationId: string): Promise<void> => {
    const batch = writeBatch(db);
    const recordsCol = collection(db, 'institutes', instituteId, 'academicRecords');
    const q = query(recordsCol, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
        const data = d.data() as AcademicRecord;
        const evals = data.evaluations?.[indicatorId] || [];
        const grades = data.grades?.[indicatorId] || [];
        batch.update(d.ref, {
            [`evaluations.${indicatorId}`]: evals.filter(e => e.id !== evaluationId),
            [`grades.${indicatorId}`]: grades.filter(g => g.refId !== evaluationId)
        });
    });
    await batch.commit();
};

// --- Configuración e Institutos ---

export const getInstitutes = async (): Promise<Institute[]> => {
    const institutesCol = collection(db, 'institutes');
    const q = query(institutesCol, orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Institute));
};

export const getInstitute = async (instituteId: string): Promise<Institute | null> => {
    const docRef = doc(db, 'institutes', instituteId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Institute : null;
};

export const addInstitute = async (id: string, data: Partial<Institute>, logoFile?: File): Promise<void> => {
    const updateData: any = { ...data };
    if (logoFile) updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    await setDoc(doc(db, 'institutes', id), updateData);
};

export const updateInstitute = async (instituteId: string, data: Partial<Omit<Institute, 'id' | 'logoUrl'>>, logoFile?: File): Promise<void> => {
    const updateData: any = { ...data };
    if (logoFile) updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/logo`);
    await updateDoc(doc(db, 'institutes', instituteId), updateData);
};

export const deleteInstitute = async (instituteId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId));
};

// --- Programas y Unidades ---

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'programs'), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'programs'), data);
};

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Omit<Program, 'id'>>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), data);
};

export const deleteProgram = async (instituteId: string, programId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), orderBy("code"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'imageUrl'>) => {
    const unitData = { ...data, totalHours: (data.theoreticalHours || 0) + (data.practicalHours || 0) };
    const newDocRef = await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), unitData);
    return newDocRef.id;
};

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
};

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    const batch = writeBatch(db);
    units.forEach(unitData => {
        const docRef = doc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'));
        batch.set(docRef, { ...unitData, totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0) });
    });
    await batch.commit();
};

export const bulkDeleteUnits = async (instituteId: string, unitIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    unitIds.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'unidadesDidacticas', id)));
    await batch.commit();
};

export const duplicateUnit = async (instituteId: string, unitId: string): Promise<void> => {
    const sourceRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    const snap = await getDoc(sourceRef);
    if (snap.exists()) {
        const data = snap.data();
        await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), { ...data, name: `${data.name} (Copia)`, code: `${data.code}-COPY` });
    }
};

// --- Usuarios y Roles ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'roles'), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, role: Omit<Role, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'institutes', instituteId, 'roles'), role);
    return docRef.id;
};

export const updateRole = async (instituteId: string, roleId: string, role: Partial<Role>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', roleId), role);
};

export const deleteRole = async (instituteId: string, roleId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
    await setDoc(doc(db, 'users', user.uid), { uid: user.uid, role, email: user.email, displayName: user.displayName, photoURL: user.photoURL, instituteId, documentId: '' }, { merge: true });
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().instituteId === instituteId) {
        await updateDoc(userRef, data);
    }
};

// --- Perfiles de Personal y Estudiantes ---

export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'staffProfiles'));
    return snap.docs.map(doc => ({ documentId: doc.id, ...doc.data() } as StaffProfile));
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'studentProfiles'));
    return snap.docs.map(doc => ({ documentId: doc.id, ...doc.data() } as StudentProfile));
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: string): Promise<StudentProfile[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where("unitId", "==", unitId), where("year", "==", year));
    const matSnap = await getDocs(q);
    const studentIds = matSnap.docs.map(d => d.data().studentId);
    if (studentIds.length === 0) return [];
    const students: StudentProfile[] = [];
    for (const id of studentIds) {
        const s = await getStudentProfile(instituteId, id);
        if (s) students.push(s);
    }
    return students;
};

// --- Horarios y Plantillas ---

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const q = query(collection(db, 'institutes', instituteId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'scheduleTemplates'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
};

export const addScheduleTemplate = async (instituteId: string, data: Omit<ScheduleTemplate, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'institutes', instituteId, 'scheduleTemplates'), data);
    return docRef.id;
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: Partial<ScheduleTemplate>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string): Promise<void> => {
    const col = collection(db, 'institutes', instituteId, 'scheduleTemplates');
    const snap = await getDocs(col);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { isDefault: d.id === id }));
    await batch.commit();
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, blocks: Record<string, ScheduleBlock>): Promise<void> => {
    const docId = `${year}_${programId}_S${semester}_${turno}`;
    const docRef = doc(db, 'institutes', instituteId, 'schedules', docId);
    await setDoc(docRef, { blocks, programId, year, semester, turno, lastUpdate: Timestamp.now() });
};

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const q = query(collection(db, 'institutes', instituteId, 'schedules'), where("year", "==", year), where("semester", "==", semester));
    const snap = await getDocs(q);
    const all: Record<string, ScheduleBlock> = {};
    snap.docs.forEach(d => {
        const blocks = d.data().blocks as Record<string, ScheduleBlock>;
        Object.assign(all, blocks);
    });
    return all;
};

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'schedules'), where("year", "==", year));
    const snap = await getDocs(q);
    return snap.docs.flatMap(d => Object.values(d.data().blocks as Record<string, ScheduleBlock>));
};

// --- Infraestructura y Activos ---

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const snap = await getDocs(collectionGroup(db, 'environments'));
    return snap.docs.filter(d => d.ref.path.includes(instituteId)).map(d => ({ id: d.id, ...d.data() } as Environment));
};

export const getAssetTypeById = async (instituteId: string, id: string): Promise<AssetType | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AssetType : null;
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const snap = await getDocs(collectionGroup(db, 'assets'));
    return snap.docs.filter(d => d.ref.path.includes(instituteId)).map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string): Promise<void> => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const ref = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        batch.update(ref, { status });
    });
    await batch.commit();
};

export const moveAssets = async (instituteId: string, assets: Asset[], target: Environment): Promise<void> => {
    const batch = writeBatch(db);
    for (const a of assets) {
        const oldRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        const newRef = doc(db, 'institutes', instituteId, 'buildings', target.buildingId, 'environments', target.id, 'assets', a.id);
        batch.delete(oldRef);
        batch.set(newRef, { ...a, buildingId: target.buildingId, buildingName: '', environmentId: target.id, environmentName: target.name });
    }
    await batch.commit();
};

// --- Insumos y Almacén ---

export const updateStock = async (instituteId: string, itemId: string, change: number, notes: string): Promise<void> => {
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    const historyCol = collection(itemRef, 'history');
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(itemRef);
        const currentStock = snap.data()?.stock || 0;
        const newStock = currentStock + change;
        tx.update(itemRef, { stock: newStock });
        tx.add(historyCol, { timestamp: Timestamp.now(), change, newStock, notes, userName: auth.currentUser?.displayName || 'Admin' });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'history'), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

// --- Periodos Lectivos ---

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'academicPeriods', year));
    return docSnap.exists() ? docSnap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'academicPeriods', year), data);
};

// --- Otras Funciones de Apoyo ---

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const col = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators'), data);
};

export const updateAchievementIndicator = async (instituteId: string, unitId: string, id: string, data: Partial<AchievementIndicator>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', id), data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', id));
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'schedules'), where("year", "==", year), where("semester", "==", semester));
    const snap = await getDocs(q);
    const days = new Set<string>();
    snap.docs.forEach(d => {
        const blocks = Object.values(d.data().blocks as Record<string, ScheduleBlock>);
        blocks.filter(b => b.unitId === unitId).forEach(b => days.add(b.dayOfWeek));
    });
    return Array.from(days);
};

export const getScheduledTimesForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<Record<string, string[]>> => {
    const q = query(collection(db, 'institutes', instituteId, 'schedules'), where("year", "==", year), where("semester", "==", semester));
    const snap = await getDocs(q);
    const times: Record<string, string[]> = {};
    snap.docs.forEach(d => {
        const blocks = Object.values(d.data().blocks as Record<string, ScheduleBlock>);
        blocks.filter(b => b.unitId === unitId).forEach(b => {
            if (!times[b.dayOfWeek]) times[b.dayOfWeek] = [];
            times[b.dayOfWeek].push(b.startTime);
        });
    });
    return times;
};

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: UnitPeriod, unitId: string, teacherId: string | null): Promise<void> => {
    const docId = `${year}_${programId}`;
    const docRef = doc(db, 'institutes', instituteId, 'assignments', docId);
    await setDoc(docRef, { [period]: { [unitId]: teacherId || deleteField() } }, { merge: true });
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
    const q = query(collection(db, 'institutes', instituteId, 'assignments'));
    const snap = await getDocs(q);
    const results = { 'MAR-JUL': {}, 'AGO-DIC': {} } as any;
    snap.docs.filter(d => d.id.startsWith(year)).forEach(d => {
        const data = d.data();
        if (data['MAR-JUL']) Object.assign(results['MAR-JUL'], data['MAR-JUL']);
        if (data['AGO-DIC']) Object.assign(results['AGO-DIC'], data['AGO-DIC']);
    });
    return results;
};

export const getAssignments = async (instituteId: string, year: string, programId: string): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
    const docId = `${year}_${programId}`;
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'assignments', docId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { 'MAR-JUL': data['MAR-JUL'] || {}, 'AGO-DIC': data['AGO-DIC'] || {} };
    }
    return { 'MAR-JUL': {}, 'AGO-DIC': {} };
};