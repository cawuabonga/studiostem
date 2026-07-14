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

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Unit : null;
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

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    const unitIds = snap.docs.map(d => d.data().unitId);
    if (unitIds.length === 0) return [];
    
    const units: EnrolledUnit[] = [];
    const unitCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas');
    const programs = await getPrograms(instituteId);
    const programMap = new Map(programs.map(p => [p.id, p.name]));

    for (const id of unitIds) {
        const uSnap = await getDoc(doc(unitCol, id));
        if (uSnap.exists()) {
            const data = uSnap.data();
            const matData = snap.docs.find(d => d.data().unitId === id)?.data() as Matriculation;
            units.push({
                ...data as Unit,
                id,
                period: matData.period, 
                year: matData.year,
                programName: programMap.get(data.programId) || 'N/A'
            } as EnrolledUnit);
        }
    }
    return units;
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

// --- EFSRT ---

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where("supervisorId", "==", supervisorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: Omit<EFSRTAssignment, 'id' | 'status' | 'createdAt' | 'visits'>): Promise<void> => {
    const col = collection(db, 'institutes', instituteId, 'efsrtAssignments');
    await addDoc(col, { ...data, status: 'Programado', createdAt: Timestamp.now(), visits: [] });
};

export const updateEFSRTAssignment = async (instituteId: string, id: string, data: Partial<EFSRTAssignment>): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', id);
    await updateDoc(docRef, data);
};

export const deleteEFSRTAssignment = async (instituteId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', id);
    await deleteDoc(docRef);
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const visitId = Math.random().toString(36).substring(7);
    await updateDoc(docRef, { visits: arrayUnion({ id: visitId, ...visit }) });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(docRef, { grade, observations, status: grade >= 13 ? 'Aprobado' : 'Desaprobado' });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File): Promise<void> => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(docRef, { [`${type}ReportUrl`]: url });
};

export const saveEFSRTReportUrl = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', url: string): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(docRef, { [`${type}ReportUrl`]: url });
};

// --- Pagos ---

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus, options?: { lastVisible?: DocumentSnapshot }): Promise<{ payments: Payment[], newLastVisible: DocumentSnapshot | null }> => {
    let q = query(collection(db, 'institutes', instituteId, 'payments'), where("status", "==", status), orderBy("createdAt", "desc"), limit(20));
    if (options?.lastVisible) q = query(q, startAfter(options.lastVisible));
    const snap = await getDocs(q);
    return {
        payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)),
        newLastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    };
};

export const getStudentPaymentsByStatus = async (instituteId: string, studentId: string, status: PaymentStatus): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where("payerId", "==", studentId), where("status", "==", status), orderBy("paymentDate", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const registerPayment = async (instituteId: string, data: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>, voucherFile?: File, options?: { autoApprove?: boolean, receiptNumber?: string }): Promise<string> => {
    let voucherUrl = '';
    if (voucherFile) {
        voucherUrl = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/vouchers/${data.payerId}_${Date.now()}`);
    }
    const paymentData = {
        ...data,
        voucherUrl,
        status: options?.autoApprove ? 'Aprobado' : 'Pendiente',
        createdAt: Timestamp.now(),
        processedAt: options?.autoApprove ? Timestamp.now() : null,
        receiptNumber: options?.receiptNumber || null
    };
    const docRef = await addDoc(collection(db, 'institutes', instituteId, 'payments'), paymentData);
    return docRef.id;
};

export const updatePaymentStatus = async (instituteId: string, paymentId: string, status: PaymentStatus, extras?: { receiptNumber?: string, rejectionReason?: string, annulmentReason?: string }): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'payments', paymentId);
    await updateDoc(docRef, { status, ...extras, processedAt: Timestamp.now() });
};

export const getRecentApprovedPayments = async (instituteId: string, limitCount: number): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where("status", "==", "Aprobado"), orderBy("processedAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, startDate: Date, endDate: Date): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where("status", "==", "Aprobado"), where("paymentDate", ">=", Timestamp.fromDate(startDate)), where("paymentDate", "<=", Timestamp.fromDate(endDate)));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const getPaymentConcepts = async (instituteId: string, onlyActive = false): Promise<PaymentConcept[]> => {
    let q = query(collection(db, 'institutes', instituteId, 'paymentConcepts'), orderBy("name"));
    if (onlyActive) q = query(q, where("isActive", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentConcept));
};

// --- Almacén e Insumos ---

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyCatalog'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyItem));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where("status", "==", status), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const getRequestsForUser = async (instituteId: string, userId: string): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where("requesterAuthUid", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

// --- Otros ---

export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'news'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as News));
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'albums'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'buildings'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Environment));
};

export const getAssetTypes = async (instituteId: string, options?: { search?: string, limit?: number, startAfter?: DocumentSnapshot }): Promise<AssetType[]> => {
    let q = query(collection(db, 'institutes', instituteId, 'assetTypes'), orderBy("name"));
    if (options?.search) q = query(q, where("name", ">=", options.search), where("name", "<=", options.search + '\uf8ff'));
    if (options?.startAfter) q = query(q, startAfter(options.startAfter));
    if (options?.limit) q = query(q, limit(options.limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessPoint));
};

export const getAccessLogsPaginated = async (options: { instituteId: string, accessPointId?: string, userDocumentId?: string, startDate?: Date, endDate?: Date, limitCount: number, startAfterDoc?: DocumentSnapshot | null }): Promise<{ logs: AccessLog[], lastVisible: DocumentSnapshot | null }> => {
    let q = query(collectionGroup(db, 'accessLogs'), where("instituteId", "==", options.instituteId));
    if (options.accessPointId && options.accessPointId !== 'all') q = query(q, where("accessPointId", "==", options.accessPointId));
    if (options.userDocumentId) q = query(q, where("userDocumentId", "==", options.userDocumentId));
    if (options.startDate) q = query(q, where("timestamp", ">=", Timestamp.fromDate(options.startDate)));
    if (options.endDate) q = query(q, where("timestamp", "<=", Timestamp.fromDate(options.endDate)));
    q = query(q, orderBy("timestamp", "desc"), limit(options.limitCount));
    if (options.startAfterDoc) q = query(q, startAfter(options.startAfterDoc));
    const snap = await getDocs(q);
    return {
        logs: snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog)),
        lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    };
};

export const listenToAccessLogs = (options: { instituteId: string, accessPointId?: string, userDocumentId?: string, startDate?: Date, endDate?: Date, limitCount: number }, callback: (logs: AccessLog[], lastVisible: DocumentSnapshot | null) => void): Unsubscribe => {
    let q = query(collectionGroup(db, 'accessLogs'), where("instituteId", "==", options.instituteId));
    if (options.accessPointId && options.accessPointId !== 'all') q = query(q, where("accessPointId", "==", options.accessPointId));
    if (options.userDocumentId) q = query(q, where("userDocumentId", "==", options.userDocumentId));
    if (options.startDate) q = query(q, where("timestamp", ">=", Timestamp.fromDate(options.startDate)));
    if (options.endDate) q = query(q, where("timestamp", "<=", Timestamp.fromDate(options.endDate)));
    q = query(q, orderBy("timestamp", "desc"), limit(options.limitCount));
    
    return onSnapshot(q, (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog));
        const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
        callback(logs, lastVisible);
    });
};

export const listenToAccessLogsForUser = (instituteId: string, userDocumentId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where("instituteId", "==", instituteId), where("userDocumentId", "==", userDocumentId), orderBy("timestamp", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog)));
    });
};

export const getMonthlyAccessLogs = async (instituteId: string, year: number, month: number, accessPointId?: string): Promise<AccessLog[]> => {
    const start = Timestamp.fromDate(new Date(year, month, 1));
    const end = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59));
    let q = query(collectionGroup(db, 'accessLogs'), where("instituteId", "==", instituteId), where("timestamp", ">=", start), where("timestamp", "<=", end));
    if (accessPointId && accessPointId !== 'all') q = query(q, where("accessPointId", "==", accessPointId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog));
};

export const getAIConfig = async (): Promise<AIConfig | null> => {
    const snap = await getDoc(doc(db, 'config', 'ai'));
    return snap.exists() ? snap.data() as AIConfig : null;
};

export const saveAIConfig = async (data: AIConfig): Promise<void> => {
    await setDoc(doc(db, 'config', 'ai'), { ...data, lastUpdated: Timestamp.now() });
};

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File): Promise<void> => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/custom_image`);
    await updateUnitImage(instituteId, unitId, url);
};

export const bulkAddStudents = async (instituteId: string, students: Omit<StudentProfile, 'id' | 'fullName' | 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    students.forEach(s => {
        const ref = doc(collection(db, 'institutes', instituteId, 'studentProfiles'));
        batch.set(ref, { ...s, fullName: `${s.lastName}, ${s.firstName}`, createdAt: Timestamp.now() });
    });
    await batch.commit();
};

export const bulkAddStaff = async (instituteId: string, staff: Omit<AppUser, 'uid' | 'photoURL'>[]) => {
    const batch = writeBatch(db);
    staff.forEach(s => {
        const ref = doc(db, 'institutes', instituteId, 'staffProfiles', s.documentId);
        batch.set(ref, { ...s, createdAt: Timestamp.now() });
    });
    await batch.commit();
};

export const bulkAddGraduates = async (instituteId: string, graduates: Omit<StudentProfile, 'id' | 'fullName' | 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    graduates.forEach(g => {
        const ref = doc(collection(db, 'institutes', instituteId, 'studentProfiles'));
        batch.set(ref, { ...g, fullName: `${g.lastName}, ${g.firstName}`, academicStatus: 'Egresado', createdAt: Timestamp.now() });
    });
    await batch.commit();
};

export const getCompanyProfiles = async (instituteId: string): Promise<CompanyProfile[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'companyProfiles'), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ documentId: d.id, ...d.data() } as CompanyProfile));
};

export const addCompanyProfile = async (instituteId: string, data: Omit<CompanyProfile, 'id' | 'logoUrl'>, logoFile?: File): Promise<void> => {
    let logoUrl = '';
    if (logoFile) logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/companies/${data.documentId}/logo`);
    await setDoc(doc(db, 'institutes', instituteId, 'companyProfiles', data.documentId), { ...data, logoUrl, createdAt: Timestamp.now() });
};

export const updateCompanyProfile = async (instituteId: string, ruc: string, data: Partial<CompanyProfile>, logoFile?: File): Promise<void> => {
    const updateData: any = { ...data };
    if (logoFile) updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/companies/${ruc}/logo`);
    await updateDoc(doc(db, 'institutes', instituteId, 'companyProfiles', ruc), updateData);
};

export const deleteCompanyProfile = async (instituteId: string, ruc: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'companyProfiles', ruc));
};

export const getPlans = async (): Promise<Plan[]> => {
    const q = query(collection(db, 'plans'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
};

export const addPlan = async (data: Omit<Plan, 'id' | 'createdAt'>): Promise<void> => {
    await addDoc(collection(db, 'plans'), { ...data, createdAt: Timestamp.now() });
};

export const updatePlan = async (id: string, data: Partial<Plan>): Promise<void> => {
    await updateDoc(doc(db, 'plans', id), data);
};

export const deletePlan = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'plans', id));
};

export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData> => {
    const programs = await getPrograms(instituteId);
    const prog = programs.find(p => p.id === programId)!;
    const allUnits = await getUnits(instituteId);
    const semUnits = allUnits.filter(u => u.programId === programId && u.semester === semester);
    
    const unitsWithStudents = await Promise.all(semUnits.map(async (unit) => {
        const students = await getEnrolledStudentProfiles(instituteId, unit.id, year, unit.period);
        return { unit, students };
    }));
    
    return { program: prog, units: unitsWithStudents };
};

export const checkEgresoEligibility = async (instituteId: string, studentId: string): Promise<StudentEgresoAudit> => {
    const [student, allUnits, history, efsrt] = await Promise.all([
        getStudentProfile(instituteId, studentId),
        getUnits(instituteId),
        getMatriculationsForStudent(instituteId, studentId),
        getEFSRTAssignmentsForStudent(instituteId, studentId)
    ]);

    const progUnits = allUnits.filter(u => u.programId === student?.programId);
    const approvedIds = new Set(history.filter(m => m.status === 'aprobado').map(m => m.unitId));
    const pendingUnits = progUnits.filter(u => !approvedIds.has(u.id)).map(u => u.name);
    
    // Simplificación: necesita aprobar todos los módulos en EFSRT
    const programs = await getPrograms(instituteId);
    const prog = programs.find(p => p.id === student?.programId);
    const approvedModules = new Set(efsrt.filter(e => e.status === 'Aprobado').map(e => e.moduleId));
    const pendingEFSRT = (prog?.modules || []).filter(m => !approvedModules.has(m.code)).map(m => m.name);

    return {
        eligible: pendingUnits.length === 0 && pendingEFSRT.length === 0,
        pendingUnits,
        pendingEFSRT
    };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, gradYear: string): Promise<void> => {
    const profileRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    await updateDoc(profileRef, { academicStatus: 'Egresado', graduationYear: gradYear, role: 'Graduate', roleId: 'graduate' });
    
    const snap = await getDoc(profileRef);
    const uid = snap.data()?.linkedUserUid;
    if (uid) {
        await updateDoc(doc(db, 'users', uid), { role: 'Graduate', roleId: 'graduate' });
    }
};

export const getGraduates = async (instituteId: string, filters: { year: string, programId: string }): Promise<StudentProfile[]> => {
    let q = query(collection(db, 'institutes', instituteId, 'studentProfiles'), where("academicStatus", "==", "Egresado"));
    if (filters.year !== 'all') q = query(q, where("graduationYear", "==", filters.year));
    if (filters.programId && filters.programId !== 'none') q = query(q, where("programId", "==", filters.programId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ documentId: d.id, ...d.data() } as StudentProfile));
};

export const getStudentsPaginated = async (options: { instituteId: string, programId: string, admissionYear?: string, turno?: UnitTurno, semester?: number, limitCount: number, startAfterDoc?: DocumentSnapshot | null, excludeEgresados?: boolean }): Promise<{ students: StudentProfile[], lastVisible: DocumentSnapshot | null }> => {
    let q = query(collection(db, 'institutes', options.instituteId, 'studentProfiles'), where("programId", "==", options.programId));
    if (options.admissionYear) q = query(q, where("admissionYear", "==", options.admissionYear));
    if (options.turno) q = query(q, where("turno", "==", options.turno));
    if (options.excludeEgresados) q = query(q, where("academicStatus", "!=", "Egresado"));
    q = query(q, orderBy("lastName"), limit(options.limitCount));
    if (options.startAfterDoc) q = query(q, startAfter(options.startAfterDoc));
    
    const snap = await getDocs(q);
    return {
        students: snap.docs.map(d => ({ documentId: d.id, ...d.data() } as StudentProfile)),
        lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    };
};

export const registerHistoricalMatriculation = async (instituteId: string, studentId: string, unit: Unit, data: { grade: number, year: string, period: UnitPeriod }): Promise<void> => {
    const id = `${unit.id}_${studentId}_${data.year}_${data.period}`;
    await setDoc(doc(db, 'institutes', instituteId, 'academicRecords', id), {
        studentId, unitId: unit.id, year: data.year, period: data.period, finalGrade: data.grade, status: data.grade >= 13 ? 'aprobado' : 'desaprobado'
    });
    await setDoc(doc(db, 'institutes', instituteId, 'matriculations', id), {
        studentId, unitId: unit.id, year: data.year, period: data.period, semester: unit.semester, status: data.grade >= 13 ? 'aprobado' : 'desaprobado'
    });
};

export const registerHistoricalEFSRT = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), {
        ...data, status: 'Aprobado', createdAt: Timestamp.now(), visits: []
    });
};

export const setVirtualClassroomStatus = async (instituteId: string, unitId: string, isActive: boolean): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { isVirtualClassroomActive: isActive });
};

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Matriculation));
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string): Promise<void> => {
    const batch = writeBatch(db);
    units.forEach(unit => {
        const id = `${unit.id}_${studentId}_${year}_${unit.period}`;
        const matRef = doc(db, 'institutes', instituteId, 'matriculations', id);
        batch.set(matRef, { studentId, unitId: unit.id, year, period: unit.period, semester: unit.semester, status: 'cursando' });
        const recRef = doc(db, 'institutes', instituteId, 'academicRecords', id);
        batch.set(recRef, { studentId, unitId: unit.id, year, period: unit.period, status: 'cursando', grades: {}, evaluations: {} });
    });
    const profileRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    batch.update(profileRef, { currentSemester: units[0].semester });
    await batch.commit();
};

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number): Promise<void> => {
    const batch = writeBatch(db);
    studentIds.forEach(sId => {
        units.forEach(unit => {
            const id = `${unit.id}_${sId}_${year}_${unit.period}`;
            batch.set(doc(db, 'institutes', instituteId, 'matriculations', id), { studentId: sId, unitId: unit.id, year, period: unit.period, semester, status: 'cursando' });
            batch.set(doc(db, 'institutes', instituteId, 'academicRecords', id), { studentId: sId, unitId: unit.id, year, period: unit.period, status: 'cursando', grades: {}, evaluations: {} });
        });
        batch.update(doc(db, 'institutes', instituteId, 'studentProfiles', sId), { currentSemester: semester });
    });
    await batch.commit();
};

export const deleteMatriculation = async (instituteId: string, studentId: string, matriculationId: string): Promise<void> => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'institutes', instituteId, 'matriculations', matriculationId));
    batch.delete(doc(db, 'institutes', instituteId, 'academicRecords', matriculationId));
    await batch.commit();
};

export const bulkDeleteStudents = async (instituteId: string, studentIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    studentIds.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'studentProfiles', id)));
    await batch.commit();
};

export const deleteStudentProfile = async (instituteId: string, documentId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId));
};

export const addStaffProfile = async (instituteId: string, data: any): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'staffProfiles', data.documentId), data);
};

export const updateStaffProfile = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'staffProfiles', id), data);
};

export const deleteStaffProfile = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'staffProfiles', id));
};

export const bulkDeleteStaff = async (instituteId: string, ids: string[]): Promise<void> => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)));
    await batch.commit();
};

export const addAssetType = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'assetTypes'), { ...data, lastAssignedNumber: 0 });
};

export const updateAssetType = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
};

export const bulkAddAssetTypes = async (instituteId: string, types: any[]): Promise<void> => {
    const batch = writeBatch(db);
    types.forEach(t => batch.set(doc(collection(db, 'institutes', instituteId, 'assetTypes')), { ...t, lastAssignedNumber: 0 }));
    await batch.commit();
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, typeId: string, data: any): Promise<string> => {
    const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', typeId);
    return await runTransaction(db, async (tx) => {
        const typeSnap = await tx.get(typeRef);
        const nextNum = (typeSnap.data()?.lastAssignedNumber || 0) + 1;
        const code = `${typeSnap.data()?.patrimonialCode}-${String(nextNum).padStart(4, '0')}`;
        const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
        tx.set(assetRef, { ...data, id: assetRef.id, codeOrSerial: code, assetTypeId: typeId, name: typeSnap.data()?.name, type: typeSnap.data()?.class, buildingId, environmentId });
        tx.update(typeRef, { lastAssignedNumber: nextNum });
        return code;
    });
};

export const updateAsset = async (instituteId: string, bId: string, eId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', id), data);
};

export const deleteAsset = async (instituteId: string, bId: string, eId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', id));
};

export const getAssetHistory = async (instituteId: string, bId: string, eId: string, id: string): Promise<AssetHistoryLog[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', id, 'history'), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
};

export const addBuilding = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings'), data);
};

export const updateBuilding = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', id), data);
};

export const deleteBuilding = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', id));
};

export const addEnvironment = async (instituteId: string, bId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments'), { ...data, buildingId: bId });
};

export const updateEnvironment = async (instituteId: string, bId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', id), data);
};

export const deleteEnvironment = async (instituteId: string, bId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', id));
};

export const addAlbum = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const updateAlbum = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]): Promise<void> => {
    for (const file of files) {
        const id = Math.random().toString(36).substring(7);
        const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/albums/${albumId}/${id}`);
        await addDoc(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), { url, createdAt: Timestamp.now() });
    }
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
};

export const addNews = async (instituteId: string, data: any, file?: File): Promise<void> => {
    let imageUrl = '';
    if (file) imageUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/news/${Date.now()}`);
    await addDoc(collection(db, 'institutes', instituteId, 'news'), { ...data, imageUrl, createdAt: Timestamp.now() });
};

export const updateNews = async (instituteId: string, id: string, data: any, file?: File): Promise<void> => {
    const updateData: any = { ...data };
    if (file) updateData.imageUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/news/${id}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'news', id), updateData);
};

export const deleteNews = async (instituteId: string, news: News): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', news.id));
};

export const addPaymentConcept = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'paymentConcepts'), { ...data, createdAt: Timestamp.now() });
};

export const updatePaymentConcept = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id), data);
};

export const deletePaymentConcept = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id));
};

export const addSupplyItem = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'supplyCatalog'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id));
};

export const createSupplyRequest = async (instituteId: string, data: any): Promise<void> => {
    const code = `REQ-${Date.now().toString().slice(-6)}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
};

export const createDirectApprovedRequest = async (instituteId: string, data: any): Promise<void> => {
    const code = `DIR-${Date.now().toString().slice(-6)}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { ...data, code, status: 'Aprobado', createdAt: Timestamp.now() });
};

export const updateSupplyRequest = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), data);
};

export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: SupplyRequestStatus, extras?: any): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'supplyRequests', id);
    if (status === 'Entregado') {
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(docRef);
            const items = snap.data()?.items as SupplyRequestItem[];
            for (const item of items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemSnap = await tx.get(itemRef);
                const currentStock = itemSnap.data()?.stock || 0;
                tx.update(itemRef, { stock: currentStock - (item.approvedQuantity || item.requestedQuantity) });
            }
            tx.update(docRef, { status, ...extras, processedAt: Timestamp.now() });
        });
    } else {
        await updateDoc(docRef, { status, ...extras, processedAt: Timestamp.now() });
    }
};

export const addAccessPoint = async (instituteId: string, data: any): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'accessPoints'), data);
};

export const updateAccessPoint = async (instituteId: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'accessPoints', id), data);
};

export const deleteAccessPoint = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
};

export const getAccessPoint = async (instituteId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
};

export const listenToAccessLogsForPoint = (instituteId: string, accessPointId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where("instituteId", "==", instituteId), where("accessPointId", "==", accessPointId), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where("activityId", "==", activityId), where("year", "==", year));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'nonTeachingActivities'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingActivity));
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'nonTeachingActivities'), data);
};

export const updateNonTeachingActivity = async (instituteId: string, id: string, data: Partial<NonTeachingActivity>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, assignments: Omit<NonTeachingAssignment, 'id'>[]): Promise<void> => {
    const batch = writeBatch(db);
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period));
    const snap = await getDocs(q);
    snap.docs.forEach(d => batch.delete(d.ref));
    assignments.forEach(a => batch.set(doc(collection(db, 'institutes', instituteId, 'nonTeachingAssignments')), a));
    await batch.commit();
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where("year", "==", year));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const snap = await getDoc(doc(db, 'config', 'loginDesign'));
    return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: LoginDesign): Promise<void> => {
    await setDoc(doc(db, 'config', 'loginDesign'), data, { merge: true });
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const q = query(collection(db, 'config', 'loginDesign', 'images'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string): Promise<void> => {
    const url = await uploadFileAndGetURL(file, `config/login/images/${Date.now()}`);
    await addDoc(collection(db, 'config', 'loginDesign', 'images'), { name, url, createdAt: Timestamp.now() });
};

export const deleteLoginImage = async (image: LoginImage): Promise<void> => {
    await deleteDoc(doc(db, 'config', 'loginDesign', 'images', image.id));
    try { await deleteObject(ref(firebaseStorage, image.url)); } catch (e) {}
};

export const setActiveLoginImage = async (url: string): Promise<void> => {
    await updateDoc(doc(db, 'config', 'loginDesign'), { imageUrl: url });
};

export const getTotalUsersCount = async (instituteId?: string): Promise<number> => {
    let q = query(collection(db, 'users'));
    if (instituteId) q = query(q, where("instituteId", "==", instituteId));
    const snap = await getCountFromServer(q);
    return snap.data().count;
};

export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: DocumentSnapshot }): Promise<{ users: AppUser[], lastVisible: DocumentSnapshot | null }> => {
    let q = query(collection(db, 'users'), orderBy("displayName"), limit(options.limit));
    if (options.instituteId) q = query(q, where("instituteId", "==", options.instituteId));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    const snap = await getDocs(q);
    return {
        users: snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)),
        lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    };
};
