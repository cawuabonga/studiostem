'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';
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
    const instituteRef = doc(db, 'institutes', id);
    const docSnap = await getDoc(instituteRef);
    if (docSnap.exists()) throw new Error(`Institute with ID "${id}" already exists.`);

    let logoUrl = '';
    if (logoFile) {
        logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    await setDoc(instituteRef, { ...data, logoUrl });
};

export const updateInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
    const updateData: any = { ...data };
    if (logoFile) {
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    await updateDoc(doc(db, 'institutes', id), updateData);
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
    await setDoc(doc(db, 'config', 'loginDesign', 'images', id), { name, url, createdAt: Timestamp.now() });
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
    const snap = await getDocs(q);
    return snap.size;
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
    
    const userUpdateData: any = {
        documentId: foundProfile.documentId,
        instituteId: foundInstituteId,
        displayName: name,
        role: foundProfile.role || 'Student',
        roleId: foundProfile.roleId || 'student',
        photoURL: foundProfile.photoURL || null
    };
    if ((foundProfile as any).programId) userUpdateData.programId = (foundProfile as any).programId;

    await updateDoc(doc(db, 'users', uid), userUpdateData);

    const col = foundProfile.type === 'staff' ? 'staffProfiles' : 'studentProfiles';
    await updateDoc(doc(db, 'institutes', foundInstituteId, col, documentId), { linkedUserUid: uid });

    return { role: foundProfile.role || 'Student', instituteName: institutes.find(i => i.id === foundInstituteId)?.name };
};

// --- PROGRAMAS Y UNIDADES ---
const getSubColRef = (instituteId: string, collectionName: string) => collection(db, 'institutes', instituteId, collectionName);

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'programs'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(getSubColRef(instituteId, 'programs'), { ...data, modules: data.modules.map(m => ({ ...m })) });
};

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Program>) => {
    const updateData = { ...data, ...(data.modules && { modules: data.modules.map(m => ({ ...m })) }) };
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), updateData);
};

export const deleteProgram = async (instituteId: string, programId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'unidadesDidacticas'), orderBy("code")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'imageUrl'>) => {
    const totalHours = (data.theoreticalHours || 0) + (data.practicalHours || 0);
    const ref = await addDoc(getSubColRef(instituteId, 'unidadesDidacticas'), { ...data, totalHours });
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
    const q = query(getSubColRef(instituteId, 'assignments'), where('__name__', '>=', `${year}_`), where('__name__', '<=', `${year}_\uf8ff`));
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
    const snap = await getDocs(query(getSubColRef(instituteId, 'staffProfiles'), orderBy("displayName")));
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
    const snap = await getDocs(query(getSubColRef(instituteId, 'studentProfiles'), orderBy("lastName")));
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

export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const allStaff = await getStaffProfiles(instituteId);
    const allPrograms = await getPrograms(instituteId);
    const programMap = new Map(allPrograms.map(p => [p.id, p.name]));
    return allStaff.map(data => ({
        id: data.documentId,
        documentId: data.documentId,
        fullName: data.displayName,
        email: data.email,
        phone: data.phone || '',
        specialty: 'N/A', 
        active: !!data.linkedUserUid,
        condition: data.condition,
        programId: data.programId,
        programName: programMap.get(data.programId) || 'N/A'
    } as Teacher));
};

// --- MATRÍCULAS ---
export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Matriculation)).sort((a,b) => b.year.localeCompare(a.year));
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    const unitIds = snap.docs.map(d => d.data().unitId);
    if (unitIds.length === 0) return [];
    const [allUnits, programs] = await Promise.all([getUnits(instituteId), getPrograms(instituteId)]);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    return allUnits.filter(u => unitIds.includes(u.id)).map(u => ({ ...u, programName: programMap.get(u.programId) || 'N/A' }));
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(u => {
        batch.set(doc(getSubColRef(instituteId, 'matriculations')), {
            studentId, unitId: u.id, programId: u.programId, year, period: u.period, semester: u.semester, moduleId: u.moduleId, status: 'cursando', createdAt: Timestamp.now()
        });
    });
    await batch.commit();
};

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    studentIds.forEach(sId => {
        units.forEach(u => {
            batch.set(doc(getSubColRef(instituteId, 'matriculations')), {
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

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'matriculations'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    const ids = snap.docs.map(d => d.data().studentId);
    if (ids.length === 0) return [];
    const sSnap = await getDocs(query(getSubColRef(instituteId, 'studentProfiles'), where('documentId', 'in', ids)));
    return sSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
};

// --- ACADÉMICO ---
export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', year));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'academicYears', year), data, { merge: true });
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(getSubColRef(instituteId, 'academicRecords'), id));
    return snap.exists() ? snap.data() as AcademicRecord : null;
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'academicRecords'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicRecord));
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: any[]) => {
    const batch = writeBatch(db);
    records.forEach(r => batch.set(doc(getSubColRef(instituteId, 'academicRecords'), r.id), r, { merge: true }));
    await batch.commit();
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: any[]) => {
    const batch = writeBatch(db);
    for (const res of results) {
        batch.update(doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${res.studentId}_${year}_${period}`), { finalGrade: res.finalGrade, status: res.status });
        const matSnap = await getDocs(query(getSubColRef(instituteId, 'matriculations'), where("studentId", "==", res.studentId), where("unitId", "==", unitId), where("year", "==", year)));
        matSnap.docs.forEach(d => batch.update(d.ref, { status: res.status }));
    }
    await batch.commit();
};

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators'), data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', indicatorId));
};

// --- ASISTENCIA ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', `${unitId}_${year}_${period}`);
    const docSnap = await getDoc(attendanceRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, data: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', data.id), data, { merge: true });
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const snap = await getDocs(getSubColRef(instituteId, 'schedules'));
    const daysSet = new Set<string>();
    snap.forEach(d => {
        const data = d.data();
        if (data.year === year && data.semester === semester) {
            Object.values(data.schedule || {}).forEach((b:any) => { if(b.unitId === unitId) daysSet.add(b.dayOfWeek); });
        }
    });
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(daysSet).sort((a,b) => order.indexOf(a) - order.indexOf(b));
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
    return snap.docs.map(doc => ({ ...doc.data(), weekNumber: doc.data().weekNumber || parseInt(doc.id.split('_')[1]) } as WeekData));
};

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`));
    return snap.exists() ? { ...snap.data(), weekNumber } as WeekData : null;
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
};

// --- ROLES Y PERMISOS ---
export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'roles'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, data: Omit<Role, 'id'>) => {
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
    if (!snap.exists()) return null;
    const permissions = (snap.data() as Role).permissions;
    if (Array.isArray(permissions)) {
        const map: any = {};
        permissions.forEach(p => map[p] = true);
        return map;
    }
    return permissions;
};

// --- CONTROL DE ACCESO ---
export const addAccessPoint = async (instituteId: string, data: any) => {
    await addDoc(getSubColRef(instituteId, 'accessPoints'), data);
};

export const getAccessPoint = async (instituteId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
};

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'accessPoints'), orderBy('name')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessPoint));
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
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints', pId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
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
    const snap = await getDocs(query(getSubColRef(instituteId, 'news'), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as News));
};

export const addNews = async (instituteId: string, data: any, file?: File) => {
    const ref = doc(getSubColRef(instituteId, 'news'));
    let imageUrl = '';
    if (file) imageUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/news/${ref.id}`);
    await setDoc(ref, { ...data, imageUrl, createdAt: Timestamp.now() });
};

export const updateNews = async (instituteId: string, newsId: string, data: any, imageFile?: File) => {
    let imageUrl = data.imageUrl;
    if (imageFile) imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${newsId}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'news', newsId), { ...data, imageUrl });
};

export const deleteNews = async (instituteId: string, news: News) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', news.id));
    if (news.imageUrl) try { await deleteObject(ref(storage, news.imageUrl)); } catch (e) {}
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'albums'), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const addAlbum = async (instituteId: string, data: any) => {
    await addDoc(getSubColRef(instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const updateAlbum = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, albumId: string): Promise<void> => {
    const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
    await deleteDoc(albumRef);
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

// --- INFRAESTRUCTURA ---
export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'buildings'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
};

export const addBuilding = async (instituteId: string, data: any) => {
    await addDoc(getSubColRef(instituteId, 'buildings'), data);
};

export const updateBuilding = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', id), data);
};

export const deleteBuilding = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', id));
};

export const getEnvironmentsForBuilding = async (instituteId: string, bId: string): Promise<Environment[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), buildingId: bId } as Environment));
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const bSnap = await getBuildings(instituteId);
    let all: Environment[] = [];
    for (const b of bSnap) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        all = all.concat(envs);
    }
    return all;
};

export const addEnvironment = async (instituteId: string, bId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments'), { ...data, buildingId: bId });
};

export const updateEnvironment = async (instituteId: string, bId: string, eId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId), data);
};

export const deleteEnvironment = async (instituteId: string, bId: string, eId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId));
};

export const getAssetTypes = async (instituteId: string, options: any = {}): Promise<AssetType[]> => {
    let q = query(getSubColRef(instituteId, 'assetTypes'), orderBy("name"));
    if (options.search) {
        const s = options.search.toUpperCase();
        q = query(q, where('name', '>=', s), where('name', '<=', s + '\uf8ff'));
    }
    if (options.limit) q = query(q, limit(options.limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const getAssetTypeById = async (instituteId: string, id: string): Promise<AssetType | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AssetType : null;
};

export const addAssetType = async (instituteId: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'assetTypes', data.patrimonialCode), { ...data, lastAssignedNumber: 0 }, { merge: true });
};

export const bulkAddAssetTypes = async (instituteId: string, items: any[]) => {
    const batch = writeBatch(db);
    items.forEach(item => batch.set(doc(db, 'institutes', instituteId, 'assetTypes', item.patrimonialCode), { ...item, lastAssignedNumber: 0 }, { merge: true }));
    await batch.commit();
};

export const updateAssetType = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
};

export const getAssetsForEnvironment = async (instituteId: string, bId: string, eId: string): Promise<Asset[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const buildings = await getBuildings(instituteId);
    let all: Asset[] = [];
    for (const b of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        for (const e of envs) {
            const assets = await getAssetsForEnvironment(instituteId, b.id, e.id);
            all = all.concat(assets.map(a => ({ ...a, buildingName: b.name, environmentName: e.name })));
        }
    }
    return all;
};

export const addAsset = async (instituteId: string, bId: string, eId: string, typeId: string, data: any) => {
    const user = auth.currentUser;
    const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', typeId);
    let code = '';
    await runTransaction(db, async (tx) => {
        const tSnap = await tx.get(typeRef);
        if (!tSnap.exists()) throw new Error("Type not found");
        const next = (tSnap.data().lastAssignedNumber || 0) + 1;
        code = `${tSnap.data().patrimonialCode}-${String(next).padStart(4, '0')}`;
        tx.update(typeRef, { lastAssignedNumber: next });
        const aRef = doc(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets'));
        tx.set(aRef, { ...data, assetTypeId: typeId, name: tSnap.data().name, type: tSnap.data().class, codeOrSerial: code, instituteId, buildingId: bId, environmentId: eId });
        if (user) tx.set(doc(collection(aRef, 'history')), { action: 'create', userId: user.uid, userName: user.displayName || 'Sis', timestamp: Timestamp.now(), details: `Creado: ${code}` });
    });
    return code;
};

export const updateAsset = async (instituteId: string, bId: string, eId: string, aId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', aId), data);
};

export const deleteAsset = async (instituteId: string, bId: string, eId: string, aId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', aId));
};

export const moveAssets = async (instituteId: string, assets: Asset[], target: Environment) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        batch.delete(doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id));
        const nRef = doc(collection(db, 'institutes', instituteId, 'buildings', target.buildingId, 'environments', target.id, 'assets'));
        const { id, buildingId, environmentId, buildingName, environmentName, ...rest } = a;
        batch.set(nRef, { ...rest, instituteId, buildingId: target.buildingId, environmentId: target.id });
    });
    await batch.commit();
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string) => {
    const batch = writeBatch(db);
    assets.forEach(a => batch.update(doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id), { status }));
    await batch.commit();
};

export const getAssetHistory = async (instituteId: string, bId: string, eId: string, aId: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', aId, 'history'), orderBy("timestamp", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
};

// --- HORARIOS ---
export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'scheduleTemplates'), orderBy("name")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
};

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1)));
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const addScheduleTemplate = async (instituteId: string, data: any) => {
    const ref = await addDoc(getSubColRef(instituteId, 'scheduleTemplates'), data);
    return ref.id;
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string) => {
    const q = query(getSubColRef(instituteId, 'scheduleTemplates'), where("isDefault", "==", true));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach(d => batch.update(d.ref, { isDefault: false }));
    batch.update(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), { isDefault: true });
    await batch.commit();
};

export const getAllSchedules = async (instituteId: string, year: string, sem: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDocs(getSubColRef(instituteId, 'schedules'));
    const all: Record<string, ScheduleBlock> = {};
    snap.forEach(d => { if (d.data().year === year && d.data().semester === sem) Object.assign(all, d.data().schedule); });
    return all;
};

export const getSchedule = async (instituteId: string, pId: string, year: string, sem: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'schedules', `${pId}_${year}_${sem}`));
    return snap.exists() ? snap.data()?.schedule || {} : {};
};

export const saveSchedule = async (instituteId: string, pId: string, year: string, sem: number, turno: UnitTurno, schedule: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'schedules', `${pId}_${year}_${sem}`), { schedule, programId: pId, year, semester: sem, turno }, { merge: true });
};

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const snap = await getDocs(getSubColRef(instituteId, 'schedules'));
    let all: ScheduleBlock[] = [];
    snap.forEach(d => { if(d.data().year === year) all = all.concat(Object.values(d.data().schedule || {})); });
    return all;
};

// --- ABASTECIMIENTO ---
export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'supplyCatalog'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
};

export const addSupplyItem = async (instituteId: string, data: any) => {
    await addDoc(getSubColRef(instituteId, 'supplyCatalog'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, itemId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', itemId), data);
};

export const deleteSupplyItem = async (instituteId: string, itemId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', itemId));
};

export const updateStock = async (instituteId: string, itemId: string, quantityChange: number, notes?: string) => {
    const user = auth.currentUser;
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(itemRef);
        const newStock = (snap.data()?.stock || 0) + quantityChange;
        if (newStock < 0) throw new Error("Stock insuficiente");
        tx.update(itemRef, { stock: newStock });
        tx.set(doc(collection(itemRef, 'stockHistory')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName || 'Sis', change: quantityChange, newStock, notes });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'stockHistory'), orderBy("timestamp", "desc"), limit(50)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const createSupplyRequest = async (instituteId: string, data: any) => {
    const counterRef = doc(db, 'institutes', instituteId, 'counters', 'supplyRequests');
    let newCount = 1;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(counterRef);
        newCount = (snap.data()?.count || 0) + 1;
        tx.set(counterRef, { count: newCount }, { merge: true });
    });
    const code = `PED-${new Date().getFullYear()}-${String(newCount).padStart(4, '0')}`;
    await addDoc(getSubColRef(instituteId, 'supplyRequests'), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
};

export const getRequestsForUser = async (instituteId: string, uid: string): Promise<SupplyRequest[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'supplyRequests'), where("requesterAuthUid", "==", uid), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const snap = await getDocs(query(getSubColRef(instituteId, 'supplyRequests'), where("status", "==", status), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const updateSupplyRequestStatus = async (instituteId: string, requestId: string, status: SupplyRequestStatus, extra: any = {}) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', requestId), { status, processedAt: Timestamp.now(), ...extra });
};

export const createDirectApprovedRequest = async (instituteId: string, data: any) => {
    const user = auth.currentUser;
    const counterRef = doc(db, 'institutes', instituteId, 'counters', 'supplyRequests');
    let newCount = 1;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(counterRef);
        newCount = (snap.data()?.count || 0) + 1;
        tx.set(counterRef, { count: newCount }, { merge: true });
    });
    const code = `PED-${new Date().getFullYear()}-${String(newCount).padStart(4, '0')}`;
    await addDoc(getSubColRef(instituteId, 'supplyRequests'), { ...data, code, status: 'Aprobado', createdAt: Timestamp.now(), approvedById: user?.uid, processedAt: Timestamp.now() });
};

// --- OTROS ---
export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData | null> => {
    const [allPrograms, allUnits, allStaff] = await Promise.all([getPrograms(instituteId), getUnits(instituteId), getStaffProfiles(instituteId)]);
    const program = allPrograms.find(p => p.id === programId);
    if (!program) return null;
    const teacherMap = new Map(allStaff.map(s => [s.documentId, s.displayName]));
    const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
    const assignments = await getAssignments(instituteId, year, programId);
    const reportUnits = await Promise.all(unitsForSemester.map(async (unit) => {
        const teacherId = assignments[unit.period]?.[unit.id];
        const teacherName = teacherId ? teacherMap.get(teacherId) || null : null;
        const matriculationSnap = await getDocs(query(getSubColRef(instituteId, 'matriculations'), where("unitId", "==", unit.id), where("year", "==", year)));
        const ids = matriculationSnap.docs.map(d => d.data().studentId);
        let students: StudentProfile[] = [];
        if (ids.length > 0) {
            const sSnap = await getDocs(query(getSubColRef(instituteId, 'studentProfiles'), where('documentId', 'in', ids)));
            students = sSnap.docs.map(d => d.data() as StudentProfile).sort((a,b) => a.lastName.localeCompare(b.lastName));
        }
        return { unit, teacherName, students };
    }));
    return { program, units: reportUnits };
};
