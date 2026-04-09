
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, DocumentSnapshot, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

// --- UTILIDADES ---
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- AUTENTICACIÓN Y DISEÑO DE LOGIN ---
export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const snap = await getDoc(doc(db, 'config', 'login_design')).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'config/login_design', operation: 'get' }));
        throw err;
    });
    return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: LoginDesign) => {
    await setDoc(doc(db, 'config', 'login_design'), data, { merge: true }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'config/login_design', operation: 'write', requestResourceData: data }));
        throw err;
    });
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snap = await getDocs(query(collection(db, 'config', 'login_design', 'images'), orderBy('createdAt', 'desc')));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string) => {
    const id = Math.random().toString(36).substring(7);
    const url = await uploadFileAndGetURL(file, `config/login/images/${id}`);
    const data = { id, name, url, createdAt: Timestamp.now() };
    await setDoc(doc(db, 'config', 'login_design', 'images', id), data);
};

export const deleteLoginImage = async (image: LoginImage) => {
    await deleteDoc(doc(db, 'config', 'login_design', 'images', image.id));
    try { await deleteObject(ref(storage, image.url)); } catch (e) {}
};

export const setActiveLoginImage = async (imageUrl: string) => {
    await updateDoc(doc(db, 'config', 'login_design'), { imageUrl });
};

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const settings = await getLoginDesignSettings();
    return settings?.imageUrl || null;
};

// --- GESTIÓN DE USUARIOS ---
export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  const userDocRef = doc(db, 'users', user.uid);
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    instituteId: instituteId,
    createdAt: Timestamp.now(),
  };
  setDoc(userDocRef, data, { merge: true }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'write', requestResourceData: data }));
  });
};

export const linkUserToProfile = async (userId: string, documentId: string, email: string) => {
    const institutesSnap = await getDocs(collection(db, 'institutes'));
    for (const instDoc of institutesSnap.docs) {
        const instId = instDoc.id;
        const staffRef = doc(db, 'institutes', instId, 'staffProfiles', documentId);
        const studentRef = doc(db, 'institutes', instId, 'studentProfiles', documentId);

        const [staffSnap, studentSnap] = await Promise.all([getDoc(staffRef), getDoc(studentRef)]);

        if (staffSnap.exists() && staffSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(staffRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: staffRef.path, operation: 'update', requestResourceData: updateData }));
                throw err;
            });
            const data = staffSnap.data() as StaffProfile;
            await updateDoc(doc(db, 'users', userId), { instituteId: instId, documentId, role: data.role, roleId: data.roleId });
            return { role: data.role, instituteName: instDoc.data().name };
        }

        if (studentSnap.exists() && studentSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(studentRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: updateData }));
                throw err;
            });
            await updateDoc(doc(db, 'users', userId), { instituteId: instId, documentId, role: 'Student', roleId: 'student' });
            return { role: 'Student', instituteName: instDoc.data().name };
        }
    }
    throw new Error("No se encontró un perfil que coincida con los datos.");
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'SuperAdmin') return null;
    if (roleId === 'student') return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true } as any;
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
    return docSnap.exists() ? (docSnap.data() as Role).permissions : null;
};

// --- INSTITUTOS ---
export const getInstitutes = async (): Promise<Institute[]> => {
  const snap = await getDocs(collection(db, 'institutes'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const snap = await getDoc(doc(db, 'institutes', id));
  return snap.exists() ? snap.data() as Institute : null;
};

export const addInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
  let logoUrl = '';
  if (logoFile) logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
  await setDoc(doc(db, 'institutes', id), { ...data, id, logoUrl }, { merge: true });
};

export const updateInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
    const updateData = { ...data };
    if (logoFile) updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    await updateDoc(doc(db, 'institutes', id), updateData);
};

export const deleteInstitute = async (id: string) => {
    await deleteDoc(doc(db, 'institutes', id));
};

// --- PERFILES DE PERSONAL Y ALUMNOS ---
export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'staffProfiles'));
    return snap.docs.map(d => ({ documentId: d.id, ...d.data() } as StaffProfile));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
    return snap.exists() ? { documentId: snap.id, ...snap.data() } as StaffProfile : null;
};

export const addStaffProfile = async (instituteId: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'staffProfiles', data.documentId), data);
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId), data);
};

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
};

export const bulkAddStaff = async (instituteId: string, staff: any[]) => {
    const batch = writeBatch(db);
    staff.forEach(s => batch.set(doc(db, 'institutes', instituteId, 'staffProfiles', s.documentId), s));
    await batch.commit();
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'studentProfiles'));
    return snap.docs.map(d => ({ documentId: d.id, fullName: `${d.data().lastName}, ${d.data().firstName}`, ...d.data() } as StudentProfile));
};

export const getStudentProfile = async (instituteId: string, documentId: string): Promise<StudentProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId));
    return snap.exists() ? { documentId: snap.id, fullName: `${snap.data().lastName}, ${snap.data().firstName}`, ...snap.data() } as StudentProfile : null;
};

export const addStudentProfile = async (instituteId: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'studentProfiles', data.documentId), data);
};

export const updateStudentProfile = async (instituteId: string, documentId: string, data: Partial<StudentProfile>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), data);
};

export const bulkAddStudents = async (instituteId: string, students: any[]) => {
    const batch = writeBatch(db);
    students.forEach(s => batch.set(doc(db, 'institutes', instituteId, 'studentProfiles', s.documentId), s));
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)));
    await batch.commit();
};

// --- GESTIÓN ACADÉMICA (PROGRAMAS, UNIDADES, MATRÍCULA) ---
export const addUnit = async (instituteId: string, data: Omit<Unit, 'id'>) => {
  const docRef = await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), data);
  return docRef.id;
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
};

export const bulkAddUnits = async (instituteId: string, units: any[]) => {
    const batch = writeBatch(db);
    units.forEach(u => {
        const ref = doc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'));
        batch.set(ref, { ...u, totalHours: u.theoreticalHours + u.practicalHours });
    });
    await batch.commit();
};

export const duplicateUnit = async (instituteId: string, unitId: string) => {
    const original = await getUnit(instituteId, unitId);
    if (!original) return;
    const { id, ...data } = original;
    await addUnit(instituteId, { ...data, name: `${data.name} (Copia)` });
};

export const bulkDeleteUnits = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'unidadesDidacticas', id)));
    await batch.commit();
};

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where('studentId', '==', studentId), orderBy('semester', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Matriculation));
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(u => {
        const ref = doc(collection(db, 'institutes', instituteId, 'matriculations'));
        batch.set(ref, { studentId, unitId: u.id, programId: u.programId, semester: u.semester, year, period: u.period, status: 'cursando', createdAt: Timestamp.now() });
    });
    await batch.commit();
};

export const deleteMatriculation = async (instituteId: string, studentId: string, mId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'matriculations', mId));
};

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    studentIds.forEach(sid => {
        units.forEach(u => {
            const ref = doc(collection(db, 'institutes', instituteId, 'matriculations'));
            batch.set(ref, { studentId: sid, unitId: u.id, programId: u.programId, semester: u.semester, year, period: u.period, status: 'cursando', createdAt: Timestamp.now() });
        });
        batch.update(doc(db, 'institutes', instituteId, 'studentProfiles', sid), { currentSemester: semester });
    });
    await batch.commit();
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const mats = await getMatriculationsForStudent(instituteId, studentId);
    const units: EnrolledUnit[] = [];
    const programs = await getPrograms(instituteId);
    for (const m of mats) {
        const u = await getUnit(instituteId, m.unitId);
        if (u) {
            const p = programs.find(prog => prog.id === u.programId);
            units.push({ ...u, programName: p?.name || 'N/A' });
        }
    }
    return units;
};

// --- CALIFICACIONES ---
export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicRecords', id));
    return snap.exists() ? snap.data() as AcademicRecord : null;
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as AcademicRecord);
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const batch = writeBatch(db);
    records.forEach(r => batch.set(doc(db, 'institutes', instituteId, 'academicRecords', r.id), r, { merge: true }));
    await batch.commit();
};

// --- PLANIFICADOR SEMANAL ---
export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`));
    return snap.exists() ? { ...snap.data(), weekNumber } as WeekData : null;
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { isVisible }, { merge: true });
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), data, { merge: true });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Omit<Content, 'id'>, file?: File) => {
    const id = Math.random().toString(36).substring(7);
    let value = content.value;
    if (file) value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/contents/${id}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), {
        contents: arrayUnion({ ...content, id, value, createdAt: Timestamp.now() })
    });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    const contents = snap.data()?.contents || [];
    const index = contents.findIndex((c: any) => c.id === contentId);
    if (index === -1) return;
    if (file) data.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/contents/${contentId}`);
    contents[index] = { ...contents[index], ...data };
    await updateDoc(ref, { contents });
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), {
        contents: arrayRemove(content)
    });
    if (content.type === 'file') { try { await deleteObject(ref(storage, content.value)); } catch(e) {} }
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, task: Omit<Task, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), {
        tasks: arrayUnion({ ...task, id, createdAt: Timestamp.now() })
    });
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    const tasks = snap.data()?.tasks || [];
    const filtered = tasks.filter((t: any) => t.id !== taskId);
    await updateDoc(ref, { tasks: filtered });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, week: number, taskId: string): Promise<TaskSubmission[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${week}`, 'tasks', taskId, 'submissions'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
};

export const submitTask = async (instituteId: string, unitId: string, week: number, taskId: string, student: StudentProfile, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/tasks/${taskId}/${student.documentId}`);
    const data = { studentName: student.fullName, fileUrl: url, submittedAt: Timestamp.now() };
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${week}`, 'tasks', taskId, 'submissions', student.documentId), data);
};

export const gradeTaskSubmission = async (instituteId: string, unitId: string, week: number, taskId: string, taskTitle: string, studentId: string, grade: number, feedback: string) => {
    const subRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${week}`, 'tasks', taskId, 'submissions', studentId);
    await updateDoc(subRef, { grade, feedback });
    
    const year = new Date().getFullYear().toString();
    const period = week <= 8 ? 'MAR-JUL' : 'AGO-DIC'; // Simple logic for period
    const recordId = `${unitId}_${studentId}_${year}_${period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    
    const indicators = await getAchievementIndicators(instituteId, unitId);
    const targetIndicator = indicators.find(ind => week >= ind.startWeek && week <= ind.endWeek);
    if (!targetIndicator) return;

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(recordRef);
        const currentData = snap.exists() ? snap.data() as AcademicRecord : { grades: {} };
        const indicatorGrades = currentData.grades[targetIndicator.id] || [];
        const index = indicatorGrades.findIndex(g => g.refId === taskId);
        if (index !== -1) indicatorGrades[index].grade = grade;
        else indicatorGrades.push({ type: 'task', refId: taskId, label: taskTitle, grade, weekNumber: week });
        tx.set(recordRef, { ...currentData, grades: { ...currentData.grades, [targetIndicator.id]: indicatorGrades } }, { merge: true });
    });
};

// --- PAGOS Y TASAS ---
export const getPaymentConcepts = async (instituteId: string, onlyActive = false): Promise<PaymentConcept[]> => {
    let q = query(collection(db, 'institutes', instituteId, 'paymentConcepts'), orderBy('name'));
    if (onlyActive) q = query(q, where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentConcept));
};

export const registerPayment = async (instituteId: string, data: any, voucherFile?: File, options?: { autoApprove?: boolean, receiptNumber?: string }) => {
    let voucherUrl = '';
    if (voucherFile) voucherUrl = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/vouchers/${data.payerId}_${Date.now()}`);
    const status: PaymentStatus = options?.autoApprove ? 'Aprobado' : 'Pendiente';
    const paymentData = { ...data, voucherUrl, status, createdAt: Timestamp.now(), receiptNumber: options?.receiptNumber || '' };
    if (options?.autoApprove) paymentData.processedAt = Timestamp.now();
    await addDoc(collection(db, 'institutes', instituteId, 'payments'), paymentData);
};

export const getStudentPaymentsByStatus = async (instituteId: string, studentId: string, status: PaymentStatus): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where('payerId', '==', studentId), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const updatePaymentStatus = async (instituteId: string, paymentId: string, status: PaymentStatus, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'payments', paymentId), { ...data, status, processedAt: Timestamp.now() });
};

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus, options?: { lastVisible?: DocumentSnapshot }) => {
    let q = query(collection(db, 'institutes', instituteId, 'payments'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(20));
    if (options?.lastVisible) q = query(q, startAfter(options.lastVisible));
    const snap = await getDocs(q);
    return { payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)), newLastVisible: snap.docs[snap.docs.length - 1] || null };
};

// --- GESTIÓN DE NOTICIAS ---
export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'news'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as News));
};

export const addNews = async (instituteId: string, data: any, imageFile?: File) => {
    let imageUrl = '';
    if (imageFile) imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${Date.now()}`);
    await addDoc(collection(db, 'institutes', instituteId, 'news'), { ...data, imageUrl, createdAt: Timestamp.now() });
};

export const updateNews = async (instituteId: string, id: string, data: any, imageFile?: File) => {
    if (imageFile) data.imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${id}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'news', id), data);
};

export const deleteNews = async (instituteId: string, item: News) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', item.id));
    if (item.imageUrl) { try { await deleteObject(ref(storage, item.imageUrl)); } catch(e) {} }
};

// --- CONTROL DE ACCESO ---
export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'accessPoints'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessPoint));
};

export const getAccessPoint = async (instituteId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
};

export const addAccessPoint = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'accessPoints'), data);
};

export const updateAccessPoint = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'accessPoints', id), data);
};

export const deleteAccessPoint = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
};

export const listenToAccessLogsForUser = (instituteId: string, documentId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), where('userDocumentId', '==', documentId), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAllAccessLogs = (instituteId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForPoint = (instituteId: string, pointDocId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints', pointDocId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

// --- OTROS ACADÉMICOS ---
export const getAchievementIndicatorsByWeek = async (instituteId: string, unitId: string, week: number): Promise<AchievementIndicator[]> => {
    const all = await getAchievementIndicators(instituteId, unitId);
    return all.filter(i => week >= i.startWeek && week <= i.endWeek);
};

export const getAssignmentsForYear = async (instituteId: string, year: string) => {
    const q = query(collection(db, 'institutes', instituteId, 'assignments'), where('__name__', '>=', `${year}_`), where('__name__', '<=', `${year}_\uf8ff`));
    const snap = await getDocs(q);
    const all: { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } = { 'MAR-JUL': {}, 'AGO-DIC': {} };
    snap.docs.forEach(doc => {
        const data = doc.data();
        Object.assign(all['MAR-JUL'], data['MAR-JUL'] || {});
        Object.assign(all['AGO-DIC'], data['AGO-DIC'] || {});
    });
    return all;
};

export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const staff = await getStaffProfiles(instituteId);
    const roles = await getRoles(instituteId);
    const targetRoleIds = roles.filter(r => ['docente', 'coordinador'].includes(r.name.toLowerCase())).map(r => r.id);
    return staff.filter(s => targetRoleIds.includes(s.roleId) || ['Teacher', 'Coordinator'].includes(s.role)).map(s => ({
        id: s.documentId, documentId: s.documentId, fullName: s.displayName, email: s.email, phone: s.phone || '', active: true, specialty: '', condition: s.condition, programId: s.programId
    }));
};

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: UnitPeriod, unitId: string, teacherId: string | null) => {
    const ref = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    const updateData = { [`${period}.${unitId}`]: teacherId || deleteField() };
    await setDoc(ref, updateData, { merge: true }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'update', requestResourceData: updateData }));
        throw err;
    });
};

export const saveNonTeachingActivity = async (instituteId: string, data: any) => {
    if (data.id) await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', data.id), data);
    else await addDoc(collection(db, 'institutes', instituteId, 'nonTeachingActivities'), { ...data, isActive: true });
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const promoteToEgresado = async (instituteId: string, documentId: string, year: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), { academicStatus: 'Egresado', graduationYear: year });
};

export const checkEgresoEligibility = async (instituteId: string, documentId: string) => {
    const student = await getStudentProfile(instituteId, documentId);
    if (!student) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };
    const [allUnits, allMats, allEFSRT] = await Promise.all([getUnits(instituteId), getMatriculationsForStudent(instituteId, documentId), getEFSRTAssignmentsForStudent(instituteId, documentId)]);
    const programUnits = allUnits.filter(u => u.programId === student.programId);
    const pendingUnits = programUnits.filter(u => !allMats.some(m => m.unitId === u.id && m.status === 'aprobado')).map(u => u.name);
    const prog = (await getPrograms(instituteId)).find(p => p.id === student.programId);
    const pendingEFSRT = (prog?.modules || []).filter(m => !allEFSRT.some(a => a.moduleId === m.code && a.status === 'Aprobado')).map(m => m.name);
    return { eligible: pendingUnits.length === 0 && pendingEFSRT.length === 0, pendingUnits, pendingEFSRT };
};
