
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
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

// Initialize Analytics if running in the browser
if (typeof window !== 'undefined') {
    getAnalytics(app);
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

// --- AUTENTICACIÓN Y PERFIL ---
export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    instituteId: instituteId,
    documentId: '',
    createdAt: Timestamp.now(),
  }, { merge: true });
};

export const updateUserProfile = async (data: { displayName?: string | null; photoURL?: string | null, documentId?: string | null }) => {
    const user = auth.currentUser;
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data);
};

// --- INSTITUTOS ---
export const getInstitutes = async (): Promise<Institute[]> => {
  const snap = await getDocs(query(collection(db, 'institutes'), orderBy("name")));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const snap = await getDoc(doc(db, 'institutes', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Institute : null;
};

export const addInstitute = async (id: string, data: Omit<Institute, 'id' | 'logoUrl'>, logoFile?: File) => {
    let logoUrl = '';
    if (logoFile) {
        logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    await setDoc(doc(db, 'institutes', id), { ...data, logoUrl });
};

export const updateInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
    let logoUrl = (await getInstitute(id))?.logoUrl;
    if (logoFile) {
        logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    await updateDoc(doc(db, 'institutes', id), { ...data, logoUrl });
};

export const deleteInstitute = async (id: string) => {
    await deleteDoc(doc(db, 'institutes', id));
};

// --- DISEÑO DE LOGIN ---
export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const snap = await getDoc(doc(db, 'config', 'loginDesign')).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'config/loginDesign', operation: 'get' }));
        throw err;
    });
    return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: Partial<LoginDesign>) => {
    await setDoc(doc(db, 'config', 'loginDesign'), data, { merge: true });
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snap = await getDocs(query(collection(db, 'config', 'loginDesign', 'images'), orderBy('createdAt', 'desc')));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string) => {
    const id = doc(collection(db, 'idGenerator')).id;
    const url = await uploadFileAndGetURL(file, `loginImages/${id}`);
    await setDoc(doc(db, 'config', 'loginDesign', 'images', id), {
        name,
        url,
        createdAt: Timestamp.now()
    });
};

export const deleteLoginImage = async (image: LoginImage) => {
    await deleteDoc(doc(db, 'config', 'loginDesign', 'images', image.id));
    try { await deleteObject(ref(storage, `loginImages/${image.id}`)); } catch (e) {}
};

export const setActiveLoginImage = async (imageUrl: string) => {
    await saveLoginDesignSettings({ imageUrl });
};

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const settings = await getLoginDesignSettings();
    return settings?.imageUrl || null;
};

// --- GESTIÓN DE USUARIOS ---
export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: DocumentSnapshot | null }) => {
    let constraints: any[] = [];
    if (options.instituteId && options.instituteId !== 'all') {
        constraints.push(where("instituteId", "==", options.instituteId));
    }
    constraints.push(orderBy("displayName"));
    if (options.startAfter) constraints.push(startAfter(options.startAfter));
    constraints.push(limit(options.limit));
    
    const snap = await getDocs(query(collection(db, 'users'), ...constraints));
    return {
        users: snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)),
        lastVisible: snap.docs[snap.docs.length - 1] || null
    };
};

export const getTotalUsersCount = async (instituteId?: string) => {
    let q = query(collection(db, 'users'));
    if (instituteId && instituteId !== 'all') q = query(q, where('instituteId', '==', instituteId));
    const snap = await getCountFromServer(q);
    return snap.data().count;
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

// --- VINCULACIÓN DE PERFIL ---
export const linkUserToProfile = async (uid: string, documentId: string, email: string) => {
    const institutes = await getInstitutes();
    let foundProfile: (StaffProfile | StudentProfile) & { type: 'staff' | 'student' } | null = null;
    let foundInstituteId: string | null = null;

    for (const institute of institutes) {
        const staffRef = doc(db, 'institutes', institute.id, 'staffProfiles', documentId);
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists() && staffSnap.data().email === email) {
            foundProfile = { ...staffSnap.data() as StaffProfile, type: 'staff' };
            foundInstituteId = institute.id;
            break;
        }

        const studentRef = doc(db, 'institutes', institute.id, 'studentProfiles', documentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists() && studentSnap.data().email === email) {
            foundProfile = { ...studentSnap.data() as StudentProfile, type: 'student' };
            foundInstituteId = institute.id;
            break;
        }
    }

    if (!foundProfile || !foundInstituteId) throw new Error("No se encontró un perfil que coincida con el DNI y correo.");
    if (foundProfile.linkedUserUid) throw new Error("Este perfil ya ha sido vinculado a otra cuenta.");

    const name = foundProfile.type === 'staff' ? (foundProfile as StaffProfile).displayName : (foundProfile as StudentProfile).fullName;
    
    await updateDoc(doc(db, 'users', uid), {
        documentId: foundProfile.documentId,
        instituteId: foundInstituteId,
        displayName: name,
        role: foundProfile.role || 'Student',
        roleId: foundProfile.roleId || 'student',
        programId: (foundProfile as any).programId || null,
        photoURL: foundProfile.photoURL || null
    });

    const col = foundProfile.type === 'staff' ? 'staffProfiles' : 'studentProfiles';
    await updateDoc(doc(db, 'institutes', foundInstituteId, col, documentId), { linkedUserUid: uid });

    return { role: foundProfile.role || 'Student', instituteName: institutes.find(i => i.id === foundInstituteId)?.name };
};

// --- PROGRAMAS Y UNIDADES ---
const getSubCollectionRef = (instituteId: string, collectionName: string) => collection(db, 'institutes', instituteId, collectionName);

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'programs'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'programs'), { ...data, modules: data.modules.map(m => ({ ...m })) });
};

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Program>) => {
    const updateData = { ...data, ...(data.modules && { modules: data.modules.map(m => ({ ...m })) }) };
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), updateData);
};

export const deleteProgram = async (instituteId: string, programId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'unidadesDidacticas'), orderBy("code")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'imageUrl'>) => {
    const totalHours = (data.theoreticalHours || 0) + (data.practicalHours || 0);
    const ref = await addDoc(getSubCollectionRef(instituteId, 'unidadesDidacticas'), { ...data, totalHours });
    return ref.id;
};

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
};

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/cover`);
    await updateUnitImage(instituteId, unitId, url);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
};

export const bulkAddUnits = async (instituteId: string, units: any[]) => {
    for (const unit of units) {
        await addUnit(instituteId, unit);
    }
};

export const duplicateUnit = async (instituteId: string, unitId: string) => {
    const original = await getUnit(instituteId, unitId);
    if (!original) throw new Error("Original not found");
    const { id, name, code, ...rest } = original;
    await addUnit(instituteId, { ...rest, name: `${name} (Copia)`, code: `${code}-COPY` } as any);
};

export const bulkDeleteUnits = async (instituteId: string, unitIds: string[]) => {
    const batch = writeBatch(db);
    unitIds.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'unidadesDidacticas', id)));
    await batch.commit();
};

// --- ASIGNACIONES ---
export const getAssignments = async (instituteId: string, year: string, programId: string) => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`));
    return snap.exists() ? snap.data() as { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string) => {
    const q = query(getSubCollectionRef(instituteId, 'assignments'), where('__name__', '>=', `${year}_`), where('__name__', '<=', `${year}_\uf8ff`));
    const snap = await getDocs(q);
    const all: { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } = { 'MAR-JUL': {}, 'AGO-DIC': {} };
    snap.docs.forEach(d => {
        const data = d.data();
        if (data['MAR-JUL']) Object.assign(all['MAR-JUL'], data['MAR-JUL']);
        if (data['AGO-DIC']) Object.assign(all['AGO-DIC'], data['AGO-DIC']);
    });
    return all;
};

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: UnitPeriod, unitId: string, teacherId: string | null) => {
    const ref = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    await setDoc(ref, { [period]: { [unitId]: teacherId || deleteField() } }, { merge: true });
};

// --- STAFF Y ESTUDIANTES ---
export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'staffProfiles'), orderBy("displayName")));
    return snap.docs.map(d => ({ documentId: d.id, ...d.data() } as StaffProfile));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
    return snap.exists() ? { documentId: snap.id, ...snap.data() } as StaffProfile : null;
};

export const addStaffProfile = async (instituteId: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'staffProfiles', data.documentId), { ...data, linkedUserUid: null });
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

export const bulkDeleteStaff = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)));
    await batch.commit();
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), orderBy("lastName")));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), fullName: `${d.data().firstName} ${d.data().lastName}` } as StudentProfile));
};

export const getStudentProfile = async (instituteId: string, id: string): Promise<StudentProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'studentProfiles', id));
    return snap.exists() ? { id: snap.id, ...snap.data(), fullName: `${snap.data().firstName} ${snap.data().lastName}` } as StudentProfile : null;
};

export const addStudentProfile = async (instituteId: string, data: any) => {
    const profile = { ...data, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null };
    await setDoc(doc(db, 'institutes', instituteId, 'studentProfiles', data.documentId), profile);
};

export const updateStudentProfile = async (instituteId: string, id: string, data: any) => {
    const nameUpdate = (data.firstName && data.lastName) ? { fullName: `${data.firstName} ${data.lastName}` } : {};
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', id), { ...data, ...nameUpdate });
};

export const bulkAddStudents = async (instituteId: string, students: any[]) => {
    const batch = writeBatch(db);
    students.forEach(s => {
        const profile = { ...s, fullName: `${s.firstName} ${s.lastName}`, linkedUserUid: null };
        batch.set(doc(db, 'institutes', instituteId, 'studentProfiles', s.documentId), profile);
    });
    await batch.commit();
};

// --- MATRÍCULAS ---
export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Matriculation)).sort((a,b) => b.year.localeCompare(a.year));
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(u => {
        batch.set(doc(getSubCollectionRef(instituteId, 'matriculations')), {
            studentId, unitId: u.id, programId: u.programId, year, period: u.period, semester: u.semester, moduleId: u.moduleId, status: 'cursando', createdAt: Timestamp.now()
        });
    });
    await batch.commit();
};

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    studentIds.forEach(sId => {
        units.forEach(u => {
            batch.set(doc(getSubCollectionRef(instituteId, 'matriculations')), {
                studentId: sId, unitId: u.id, programId: u.programId, year, period: u.period, semester, moduleId: u.moduleId, status: 'cursando', createdAt: Timestamp.now()
            });
        });
        batch.update(doc(db, 'institutes', instituteId, 'studentProfiles', sId), { currentSemester: semester });
    });
    await batch.commit();
};

export const deleteMatriculation = async (instituteId: string, studentId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'matriculations', id));
};

// --- NON-TEACHING ---
export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'nonTeachingActivities'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingActivity));
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'nonTeachingActivities'), data);
};

export const updateNonTeachingActivity = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("year", "==", year)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("activityId", "==", activityId), where("year", "==", year)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, assignments: any[]) => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    assignments.forEach(a => { if (a.assignedHours > 0) batch.set(doc(getSubCollectionRef(instituteId, 'nonTeachingAssignments')), a); });
    await batch.commit();
};

// --- PAYMENTS ---
export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    let q = query(getSubCollectionRef(instituteId, 'paymentConcepts'), orderBy("name"));
    if (activeOnly) q = query(q, where("isActive", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentConcept));
};

export const addPaymentConcept = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'paymentConcepts'), { ...data, createdAt: Timestamp.now() });
};

export const updatePaymentConcept = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id), data);
};

export const deletePaymentConcept = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id));
};

export const registerPayment = async (instituteId: string, data: any, voucherFile?: File, options: any = {}) => {
    const ref = doc(getSubCollectionRef(instituteId, 'payments'));
    let voucherUrl = '';
    if (voucherFile) voucherUrl = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/vouchers/${ref.id}`);
    await setDoc(ref, {
        ...data, voucherUrl, status: options.autoApprove ? 'Aprobado' : 'Pendiente',
        receiptNumber: options.receiptNumber || null, processedAt: options.autoApprove ? Timestamp.now() : null, createdAt: Timestamp.now()
    });
};

export const getStudentPaymentsByStatus = async (instituteId: string, payerId: string, status: PaymentStatus): Promise<Payment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), where("payerId", "==", payerId), where("status", "==", status)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus, options: any = {}) => {
    let q = query(getSubCollectionRef(instituteId, 'payments'), where("status", "==", status), orderBy("createdAt", "desc"), limit(20));
    if (options.lastVisible) q = query(q, startAfter(options.lastVisible));
    const snap = await getDocs(q);
    return { payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)), newLastVisible: snap.docs[snap.docs.length-1] || null };
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, from: Date, to: Date): Promise<Payment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), where("status", "==", "Aprobado"), where("processedAt", ">=", from), where("processedAt", "<=", to), orderBy("processedAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const updatePaymentStatus = async (instituteId: string, id: string, status: PaymentStatus, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'payments', id), { ...data, status, processedAt: Timestamp.now() });
};

// --- ABASTECIMIENTO ---
export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'supplyCatalog'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyItem));
};

export const addSupplyItem = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'supplyCatalog'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id));
};

export const updateStock = async (instituteId: string, itemId: string, change: number, notes?: string) => {
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const ref = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Item not found");
        const newStock = (snap.data().stock || 0) + change;
        if (newStock < 0) throw new Error("Insufficient stock");
        tx.update(ref, { stock: newStock });
        tx.set(doc(collection(ref, 'stockHistory')), { timestamp: Timestamp.now(), userId: user?.uid || 'sys', userName: user?.displayName || 'Sistema', change, newStock, notes: notes || '' });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'stockHistory'), orderBy("timestamp", "desc"), limit(50)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const getNextRequestCode = async (instituteId: string): Promise<string> => {
    const ref = doc(db, 'institutes', instituteId, 'counters', 'supplyRequests');
    let count = 1;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        count = (snap.data()?.count || 0) + 1;
        tx.set(ref, { count }, { merge: true });
    });
    return `PED-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
};

export const createSupplyRequest = async (instituteId: string, data: any) => {
    const code = await getNextRequestCode(instituteId);
    await addDoc(getSubCollectionRef(instituteId, 'supplyRequests'), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
};

export const createDirectApprovedRequest = async (instituteId: string, data: any) => {
    const user = auth.currentUser;
    const code = await getNextRequestCode(instituteId);
    await addDoc(getSubCollectionRef(instituteId, 'supplyRequests'), { ...data, items: data.items.map((i:any) => ({...i, approvedQuantity: i.requestedQuantity})), code, status: 'Aprobado', createdAt: Timestamp.now(), approvedById: user?.uid, approvedByName: user?.displayName, processedAt: Timestamp.now() });
};

export const getRequestsForUser = async (instituteId: string, uid: string): Promise<SupplyRequest[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'supplyRequests'), where("requesterAuthUid", "==", uid), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'supplyRequests'), where("status", "==", status), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: SupplyRequestStatus, extra: any) => {
    const user = auth.currentUser;
    const ref = doc(db, 'institutes', instituteId, 'supplyRequests', id);
    if (status === 'Entregado') {
        await runTransaction(db, async (tx) => {
            const rSnap = await tx.get(ref);
            const rData = rSnap.data() as SupplyRequest;
            for (const item of rData.items) {
                const iRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const iSnap = await tx.get(iRef);
                const newStock = (iSnap.data()?.stock || 0) - (item.approvedQuantity ?? item.requestedQuantity);
                if (newStock < 0) throw new Error(`Stock insuficiente para ${item.name}`);
                tx.update(iRef, { stock: newStock });
                tx.set(doc(collection(iRef, 'stockHistory')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change: -(item.approvedQuantity ?? item.requestedQuantity), newStock, notes: `Pedido ${rData.code}` });
            }
            tx.update(ref, { ...extra, status, processedAt: Timestamp.now(), deliveredById: user?.uid, deliveredByName: user?.displayName });
        });
    } else {
        await updateDoc(ref, { ...extra, status, processedAt: Timestamp.now() });
    }
};

// --- ACADÉMICO ---
export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', year));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'academicYears', year), data, { merge: true });
};

export const getEnrolledUnitsForStudent = async (instituteId: string, studentId: string) => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    const unitIds = snap.docs.map(d => d.data().unitId);
    if (unitIds.length === 0) return [];
    const units = await getUnits(instituteId);
    return units.filter(u => unitIds.includes(u.id));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(getSubCollectionRef(instituteId, 'academicRecords'), id));
    return snap.exists() ? snap.data() as AcademicRecord : null;
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'academicRecords'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicRecord));
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: any[]) => {
    const batch = writeBatch(db);
    records.forEach(r => batch.set(doc(getSubCollectionRef(instituteId, 'academicRecords'), r.id), r, { merge: true }));
    await batch.commit();
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: any[]) => {
    const batch = writeBatch(db);
    for (const res of results) {
        batch.update(doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${res.studentId}_${year}_${period}`), { finalGrade: res.finalGrade, status: res.status });
        const matSnap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", res.studentId), where("unitId", "==", unitId), where("year", "==", year)));
        matSnap.docs.forEach(d => batch.update(d.ref, { status: res.status }));
    }
    await batch.commit();
};

// --- ASISTENCIA ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', `${unitId}_${year}_${period}`));
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, data: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', data.id), data, { merge: true });
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'schedules'));
    const days = new Set<string>();
    snap.forEach(d => {
        const data = d.data();
        if (data.year === year && data.semester === semester) {
            Object.values(data.schedule || {}).forEach((b:any) => { if(b.unitId === unitId) days.add(b.dayOfWeek); });
        }
    });
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(days).sort((a,b) => order.indexOf(a) - order.indexOf(b));
};

// --- SÍLABO Y PLANNER ---
export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus'), data, { merge: true });
};

export const getWeeksData = async (instituteId: string, unitId: string): Promise<WeekData[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner'));
    return snap.docs.map(doc => doc.data() as WeekData);
};

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`));
    return snap.exists() ? snap.data() as WeekData : null;
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { isVisible, weekNumber }, { merge: true });
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { ...data, weekNumber }, { merge: true });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, content: any, file?: File) => {
    const id = doc(collection(db, 'idGenerator')).id;
    let value = content.value;
    if (file) value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${id}`);
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), {
        contents: arrayUnion({ ...content, id, value, createdAt: Timestamp.now() })
    }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, id: string, data: any, file?: File) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    const contents = snap.data()?.contents || [];
    const idx = contents.findIndex((c:any) => c.id === id);
    if (idx === -1) return;
    if (file) data.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${id}`);
    contents[idx] = { ...contents[idx], ...data };
    await updateDoc(ref, { contents });
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { contents: arrayRemove(content) });
    if (content.type === 'file') try { await deleteObject(ref(storage, content.value)); } catch (e) {}
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, task: any) => {
    const id = doc(collection(db, 'idGenerator')).id;
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), {
        tasks: arrayUnion({ ...task, id, createdAt: Timestamp.now() })
    }, { merge: true });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, id: string, data: any) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    const tasks = snap.data()?.tasks || [];
    const idx = tasks.findIndex((t:any) => t.id === id);
    if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...data }; await updateDoc(ref, { tasks }); }
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, id: string) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    const task = (snap.data()?.tasks || []).find((t:any) => t.id === id);
    if (task) await updateDoc(ref, { tasks: arrayRemove(task) });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
};

export const submitTask = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, student: StudentProfile, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/tasks/${taskId}/student_${student.documentId}`);
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', student.documentId), {
        studentName: student.fullName, fileUrl: url, submittedAt: Timestamp.now()
    });
};

export const gradeTaskSubmission = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, taskTitle: string, studentId: string, grade: number, feedback: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentId), { grade, feedback });
    const indicators = await getAchievementIndicators(instituteId, unitId);
    const target = indicators.find(i => weekNumber >= i.startWeek && weekNumber <= i.endWeek);
    if (target) {
        const rId = `${unitId}_${studentId}_${new Date().getFullYear()}_${(await getUnit(instituteId, unitId))?.period}`;
        const ref = doc(getSubCollectionRef(instituteId, 'academicRecords'), rId);
        const rSnap = await getDoc(ref);
        const grades = rSnap.data()?.grades?.[target.id] || [];
        const idx = grades.findIndex((g:any) => g.refId === taskId);
        const entry = { type: 'task', refId: taskId, label: taskTitle, grade, weekNumber };
        if (idx !== -1) grades[idx] = entry; else grades.push(entry);
        await setDoc(ref, { grades: { [target.id]: grades } }, { merge: true });
    }
};

// --- ROLES Y ACCESOS ---
export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'roles'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, data: any) => {
    const id = data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await setDoc(doc(db, 'institutes', instituteId, 'roles', id), data);
};

export const updateRole = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', id), data);
};

export const deleteRole = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', id));
};

export const getRolePermissions = async (instituteId: string, id: string): Promise<Record<Permission, boolean> | null> => {
    if (id === 'student') return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true, 'planning:schedule:view:own': true } as any;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'roles', id));
    return snap.exists() ? (snap.data() as Role).permissions : null;
};

export const getAccessPoint = async (instituteId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
};

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'accessPoints'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessPoint));
};

export const addAccessPoint = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'accessPoints'), data);
};

export const updateAccessPoint = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'accessPoints', id), data);
};

export const deleteAccessPoint = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
};

export const listenToAllAccessLogs = (instituteId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForUser = (instituteId: string, docId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), where('userDocumentId', '==', docId), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForPoint = (instituteId: string, pId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), where('accessPointId', '==', pId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

// --- EFSRT ---
export const getEFSRTAssignmentsForStudent = async (instituteId: string, sId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', sId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() });
};

export const registerEFSRTVisit = async (instituteId: string, aId: string, visit: any) => {
    const id = Math.random().toString(36).substring(7);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', aId), { visits: arrayUnion({ ...visit, id }) });
};

export const evaluateEFSRT = async (instituteId: string, aId: string, grade: number, obs: string) => {
    const status: EFSRTStatus = grade >= 13 ? 'Aprobado' : 'Desaprobado';
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', aId), { grade, observations: obs, status });
};

export const uploadEFSRTReport = async (instituteId: string, aId: string, type: string, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${aId}/${type}_report`);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', aId), { [type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl']: url });
};

// --- NEWS Y GALLERY ---
export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'news'), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as News));
};

export const addNews = async (instituteId: string, data: any, file?: File) => {
    const ref = doc(getSubCollectionRef(instituteId, 'news'));
    let imageUrl = '';
    if (file) imageUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/news/${ref.id}`);
    await setDoc(ref, { ...data, imageUrl, createdAt: Timestamp.now() });
};

export const deleteNews = async (instituteId: string, news: News) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', news.id));
    if (news.imageUrl) try { await deleteObject(ref(storage, news.imageUrl)); } catch (e) {}
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'albums'), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const addAlbum = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const deleteAlbum = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const getAlbumPhotos = async (instituteId: string, id: string): Promise<Photo[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', id, 'photos'), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, id: string, files: File[]) => {
    const batch = writeBatch(db);
    const col = collection(db, 'institutes', instituteId, 'albums', id, 'photos');
    for (const file of files) {
        const pId = doc(col).id;
        const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/albums/${id}/${pId}`);
        batch.set(doc(col, pId), { albumId: id, url, createdAt: Timestamp.now() });
        if (files.indexOf(file) === 0) batch.update(doc(db, 'institutes', instituteId, 'albums', id), { coverImageUrl: url });
    }
    await batch.commit();
};

export const deletePhotoFromAlbum = async (instituteId: string, aId: string, photo: Photo) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', aId, 'photos', photo.id));
    try { await deleteObject(ref(storage, photo.url)); } catch (e) {}
};
