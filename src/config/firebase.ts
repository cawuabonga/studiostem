'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, increment, getCountFromServer, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission, AIConfig, StudentEgresoAudit, SocialLinks, CompanyProfile, JobOffer, JobApplication, Plan, InstituteMetrics, DailyActivity, Project, ProjectTeam } from '@/types';
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
const firebaseStorage = getStorage(app);

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

const getSubCollectionRef = (instituteId: string, collectionName: string) => {
    return collection(db, 'institutes', instituteId, collectionName);
}

export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// --- Observability & Metrics ---

export const trackDailyActivity = async (instituteId: string, roleId: string, userId: string): Promise<void> => {
    if (!instituteId || !roleId) return;
    const today = new Date().toISOString().split('T')[0];
    const activityRef = doc(db, 'institutes', instituteId, 'analytics', `activity_${today}`);
    const trackingKey = `track_${userId}_${today}`;
    if (typeof window !== 'undefined') {
        if (localStorage.getItem(trackingKey)) return;
        localStorage.setItem(trackingKey, 'true');
    }
    const fieldMap: Record<string, string> = { 'student': 'student', 'teacher': 'teacher', 'admin': 'admin', 'coordinator': 'coordinator', 'graduate': 'graduate', 'company': 'company' };
    const roleField = fieldMap[roleId.toLowerCase()] || 'other';
    await setDoc(activityRef, { total: increment(1), [roleField]: increment(1), lastUpdate: Timestamp.now() }, { merge: true });
};

export const getInstituteMetrics = async (instituteId: string): Promise<InstituteMetrics> => {
    const studentsCol = collection(db, 'institutes', instituteId, 'studentProfiles');
    const staffCol = collection(db, 'institutes', instituteId, 'staffProfiles');
    const unitsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas');
    const paymentsCol = collection(db, 'institutes', instituteId, 'payments');
    const today = new Date().toISOString().split('T')[0];
    const activityDocRef = doc(db, 'institutes', instituteId, 'analytics', `activity_${today}`);
    const [studentsSnap, staffSnap, unitsSnap, paymentsSnap, activitySnap] = await Promise.all([
        getCountFromServer(studentsCol),
        getCountFromServer(staffCol),
        getCountFromServer(unitsCol),
        getDocs(query(paymentsCol, where("status", "==", "Aprobado"))),
        getDoc(activityDocRef)
    ]);
    const totalRevenue = paymentsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
    const activeToday = activitySnap.exists() ? activitySnap.data() as DailyActivity : { total: 0, student: 0, teacher: 0, admin: 0, coordinator: 0, graduate: 0, company: 0, lastUpdate: Timestamp.now() };
    return { totalStudents: studentsSnap.data().count, totalStaff: staffSnap.data().count, totalUnits: unitsSnap.data().count, activeToday, totalPayments: paymentsSnap.size, totalRevenue };
};

// --- Plans & AI ---

export const getPlans = async (): Promise<Plan[]> => {
    const snapshot = await getDocs(query(collection(db, 'config', 'platform', 'plans'), orderBy("price", "asc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
};

export const addPlan = async (data: Omit<Plan, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'config', 'platform', 'plans'), { ...data, createdAt: Timestamp.now() });
    return docRef.id;
};

export const updatePlan = async (planId: string, data: Partial<Plan>): Promise<void> => {
    await updateDoc(doc(db, 'config', 'platform', 'plans', planId), data);
};

export const deletePlan = async (planId: string): Promise<void> => {
    await deleteDoc(doc(db, 'config', 'platform', 'plans', planId));
};

export const getAIConfig = async (): Promise<AIConfig | null> => {
    const docSnap = await getDoc(doc(db, 'config', 'aiConfig'));
    return docSnap.exists() ? docSnap.data() as AIConfig : null;
};

export const saveAIConfig = async (config: Partial<AIConfig>): Promise<void> => {
    await setDoc(doc(db, 'config', 'aiConfig'), { ...config, lastUpdated: Timestamp.now() }, { merge: true });
};

// --- User Management & Profiles ---

export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  await setDoc(doc(db, 'users', user.uid), { uid: user.uid, role, email: user.email, displayName: user.displayName, photoURL: user.photoURL, instituteId, documentId: '' }, { merge: true });
};

export const updateUserProfile = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    if (data.displayName || data.photoURL) await firebaseUpdateProfile(user, { displayName: data.displayName, photoURL: data.photoURL });
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data() as AppUser;
    if (userData.instituteId && userData.documentId) {
        const col = (userData.role === 'Student' || userData.role === 'Graduate') ? 'studentProfiles' : 'staffProfiles';
        await updateDoc(doc(db, 'institutes', userData.instituteId, col, userData.documentId), data);
    }
};

export const addInstitute = async (instituteId: string, data: any, logoFile?: File): Promise<void> => {
    const instituteRef = doc(db, 'institutes', instituteId);
    let logoUrl = '';
    if (logoFile) logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/logo`);
    await setDoc(instituteRef, { ...data, logoUrl });
    const rolesCol = collection(db, 'institutes', instituteId, 'roles');
    const defaultRoles = [
        { id: 'student', name: 'Estudiante', permissions: { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true, 'student:jobs:view': true, 'student:jobs:apply': true, 'user:supplies:request': true, 'user:access:view:own': true, 'planning:schedule:view:own': true } }
    ];
    const batch = writeBatch(db);
    defaultRoles.forEach(role => { const { id, ...rData } = role; batch.set(doc(rolesCol, id), { ...rData, description: `Rol de ${role.name}` }); });
    await batch.commit();
};

export const getInstitutes = async (): Promise<Institute[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const getInstitute = async (instituteId: string): Promise<Institute | null> => {
    const docRef = doc(db, 'institutes', instituteId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Institute : null;
};

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const design = await getLoginDesignSettings();
    return design?.imageUrl || null;
}

export const updateInstitute = async (instituteId: string, data: any, logoFile?: File): Promise<void> => {
    const updateData = { ...data };
    if (logoFile) updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/logo`);
    await updateDoc(doc(db, 'institutes', instituteId), updateData);
};

export const deleteInstitute = async (instituteId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId));
};

export const saveLoginDesignSettings = async (settings: Partial<LoginDesign>): Promise<void> => {
    await setDoc(doc(db, 'config', 'loginDesign'), settings, { merge: true });
};

export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const docSnap = await getDoc(doc(db, 'config', 'loginDesign'));
    return docSnap.exists() ? docSnap.data() as LoginDesign : null;
};

export const uploadLoginImage = async (file: File, name: string): Promise<void> => {
    const id = doc(collection(db, 'idGenerator')).id;
    const url = await uploadFileAndGetURL(file, `loginImages/${id}`);
    await setDoc(doc(db, 'config/loginDesign/images', id), { name, url, createdAt: Timestamp.now() });
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snapshot = await getDocs(query(collection(db, 'config', 'loginDesign', 'images'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const setActiveLoginImage = async (imageUrl: string): Promise<void> => {
    await saveLoginDesignSettings({ imageUrl });
};

export const deleteLoginImage = async (image: LoginImage): Promise<void> => {
    await deleteDoc(doc(db, 'config', 'loginDesign', 'images', image.id));
    try { await deleteObject(ref(firebaseStorage, `loginImages/${image.id}`)); } catch (e) {}
};

export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: any }) => {
    const col = collection(db, 'users');
    const qParts = [];
    if (options.instituteId && options.instituteId !== 'all') qParts.push(where("instituteId", "==", options.instituteId));
    qParts.push(orderBy("displayName"));
    if (options.startAfter) qParts.push(startAfter(options.startAfter));
    qParts.push(limit(options.limit));
    const snap = await getDocs(query(col, ...qParts));
    return { users: snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)), lastVisible: snap.docs[snap.docs.length - 1] || null };
};

export const getTotalUsersCount = async (instituteId?: string): Promise<number> => {
    const col = collection(db, 'users');
    const q = instituteId && instituteId !== 'all' ? query(col, where("instituteId", "==", instituteId)) : query(col);
    const snap = await getDocs(q);
    return snap.size;
}

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
}

export const updateUserByInstituteAdmin = async (instId: string, uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
}

// --- Programs & Units ---

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'programs'), data);
}

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'programs'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
}

export const updateProgram = async (instituteId: string, programId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), data);
}

export const deleteProgram = async (instituteId: string, programId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
}

export const addUnit = async (instituteId: string, data: any) => {
    const unitData = { ...data, totalHours: (data.theoreticalHours || 0) + (data.practicalHours || 0) };
    const res = await addDoc(getSubCollectionRef(instituteId, 'unidadesDidacticas'), unitData);
    return res.id;
}

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'unidadesDidacticas'), orderBy("code")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
}

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/cover`);
    await updateUnitImage(instituteId, unitId, url);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
}

export const bulkAddUnits = async (instituteId: string, units: any[]) => {
    const col = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    for (const u of units) {
        await addDoc(col, { ...u, totalHours: (u.theoreticalHours || 0) + (u.practicalHours || 0) });
    }
}

export const bulkDeleteUnits = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'unidadesDidacticas', id)));
    await batch.commit();
}

export const duplicateUnit = async (instituteId: string, unitId: string) => {
    const original = await getUnit(instituteId, unitId);
    if (!original) return;
    const { id, name, code, ...rest } = original;
    await addUnit(instituteId, { ...rest, name: `${name} (Copia)`, code: `${code}-COPY` });
};

// --- Staff & Student Profiles ---

export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'staffProfiles'), orderBy("displayName")));
    const programs = await getPrograms(instituteId);
    const pMap = new Map(programs.map(p => [p.id, p.name]));
    return snap.docs.map(doc => ({ ...doc.data(), documentId: doc.id, programName: pMap.get(doc.data().programId) || 'N/A' } as StaffProfile));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
    return snap.exists() ? snap.data() as StaffProfile : null;
};

export const bulkAddStaff = async (instituteId: string, list: any[]) => {
    const batch = writeBatch(db);
    list.forEach(s => batch.set(doc(db, 'institutes', instituteId, 'staffProfiles', s.documentId), { ...s, instituteId }));
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)));
    await batch.commit();
};

export const updateStaffProfile = async (instId: string, docId: string, data: any) => {
    const ref = doc(db, 'institutes', instId, 'staffProfiles', docId);
    await updateDoc(ref, data);
    const snap = await getDoc(ref);
    if (snap.data()?.linkedUserUid && data.role) await updateDoc(doc(db, 'users', snap.data()?.linkedUserUid), { role: data.role, displayName: data.displayName });
};

export const deleteStaffProfile = async (instId: string, docId: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'staffProfiles', docId));
};

export const addStudentProfile = async (instId: string, data: any) => {
    const ref = doc(db, 'institutes', instId, 'studentProfiles', data.documentId);
    await setDoc(ref, { ...data, instituteId: instId, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' });
};

export const getStudentProfiles = async (instId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'studentProfiles'), orderBy("lastName")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getStudentsPaginated = async (options: { instituteId: string, programId?: string, admissionYear?: string, turno?: UnitTurno, semester?: number, limitCount: number, startAfterDoc?: any, excludeEgresados?: boolean }) => {
    const col = getSubCollectionRef(options.instituteId, 'studentProfiles');
    let qParts: any[] = [];
    if (options.programId && options.programId !== 'all') qParts.push(where("programId", "==", options.programId));
    if (options.admissionYear && options.admissionYear !== 'all') qParts.push(where("admissionYear", "==", options.admissionYear));
    if (options.turno && options.turno !== 'all') qParts.push(where("turno", "==", options.turno));
    qParts.push(orderBy("lastName"));
    if (options.startAfterDoc) qParts.push(startAfter(options.startAfterDoc));
    qParts.push(limit(options.limitCount * 2));
    const snap = await getDocs(query(col, ...qParts));
    let students = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
    if (options.excludeEgresados) students = students.filter(s => s.academicStatus !== 'Egresado');
    return { students: students.slice(0, options.limitCount), lastVisible: snap.docs[snap.docs.length - 1] || null };
};

export const getStudentProfile = async (instId: string, sId: string): Promise<StudentProfile | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'studentProfiles', sId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as StudentProfile : null;
};

export const updateStudentProfile = async (instId: string, docId: string, data: any) => {
    const update: any = { ...data };
    if (data.firstName && data.lastName) update.fullName = `${data.firstName} ${data.lastName}`;
    await updateDoc(doc(db, 'institutes', instId, 'studentProfiles', docId), update);
};

export const deleteStudentProfile = async (instId: string, sId: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'studentProfiles', sId));
};

export const bulkDeleteStudents = async (instId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instId, 'studentProfiles', id)));
    await batch.commit();
}

export const bulkAddStudents = async (instId: string, list: any[]) => {
    const batch = writeBatch(db);
    list.forEach(s => batch.set(doc(db, 'institutes', instId, 'studentProfiles', s.documentId), { ...s, instituteId: instId, fullName: `${s.firstName} ${s.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' }));
    await batch.commit();
};

export const bulkAddGraduates = async (instId: string, list: any[]) => {
    const batch = writeBatch(db);
    list.forEach(s => batch.set(doc(db, 'institutes', instId, 'studentProfiles', s.documentId), { ...s, instituteId: instId, fullName: `${s.firstName} ${s.lastName}`, linkedUserUid: null, academicStatus: 'Egresado', role: 'Graduate', roleId: 'graduate' }));
    await batch.commit();
};

export const getGraduates = async (instId: string, options: { year?: string, programId?: string } = {}): Promise<StudentProfile[]> => {
    const col = getSubCollectionRef(instId, 'studentProfiles');
    const qParts = [where("academicStatus", "==", "Egresado")];
    if (options.year && options.year !== 'all') qParts.push(where("graduationYear", "==", options.year));
    if (options.programId && options.programId !== 'all') qParts.push(where("programId", "==", options.programId));
    qParts.push(orderBy("lastName", "asc"));
    const snap = await getDocs(query(col, ...qParts));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
};

export const linkUserToProfile = async (uid: string, docId: string, email: string) => {
    const insts = await getInstitutes();
    let found: any = null;
    let instId = '';
    for (const inst of insts) {
        const staff = await getDoc(doc(db, 'institutes', inst.id, 'staffProfiles', docId));
        if (staff.exists() && staff.data().email?.toLowerCase() === email.toLowerCase()) { found = { ...staff.data(), type: 'staff' }; instId = inst.id; break; }
        const student = await getDoc(doc(db, 'institutes', inst.id, 'studentProfiles', docId));
        if (student.exists() && student.data().email?.toLowerCase() === email.toLowerCase()) { found = { ...student.data(), type: 'student' }; instId = inst.id; break; }
        const comp = await getDoc(doc(db, 'institutes', inst.id, 'companyProfiles', docId));
        if (comp.exists() && comp.data().contactEmail?.toLowerCase() === email.toLowerCase()) { found = { ...comp.data(), type: 'company' }; instId = inst.id; break; }
    }
    if (!found) throw new Error("No coincide DNI/Email.");
    if (found.linkedUserUid) throw new Error("Perfil ya vinculado.");
    const update: any = { documentId: docId, instituteId: instId, displayName: found.displayName || found.name || found.fullName, role: found.role, roleId: found.roleId, programId: found.programId, photoURL: found.photoURL || found.logoUrl };
    await updateDoc(doc(db, 'users', uid), update);
    const col = found.type === 'staff' ? 'staffProfiles' : (found.type === 'company' ? 'companyProfiles' : 'studentProfiles');
    await updateDoc(doc(db, 'institutes', instId, col, docId), { linkedUserUid: uid });
    return { role: found.role, instituteName: insts.find(i => i.id === instId)?.name };
};

// --- Non-Teaching & Assignments ---

export const addNonTeachingActivity = async (instId: string, data: any) => {
    await addDoc(getSubCollectionRef(instId, 'nonTeachingActivities'), data);
};

export const getNonTeachingActivities = async (instId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(getSubCollectionRef(instId, 'nonTeachingActivities'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const updateNonTeachingActivity = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'nonTeachingActivities', id));
};

export const getAssignmentsForActivity = async (instId: string, actId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'nonTeachingAssignments'), where("activityId", "==", actId), where("year", "==", year)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getNonTeachingAssignments = async (instId: string, tId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'nonTeachingAssignments'), where("teacherId", "==", tId), where("year", "==", year), where("period", "==", period)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'nonTeachingAssignments'), where("year", "==", year)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
}

export const saveNonTeachingAssignmentsForTeacher = async (instId: string, tId: string, year: string, period: UnitPeriod, list: any[]) => {
    const batch = writeBatch(db);
    const col = getSubCollectionRef(instId, 'nonTeachingAssignments');
    const existing = await getDocs(query(col, where("teacherId", "==", tId), where("year", "==", year), where("period", "==", period)));
    existing.forEach(d => batch.delete(d.ref));
    list.forEach(a => { if (a.assignedHours > 0) batch.set(doc(col), a); });
    await batch.commit();
};

// --- Payments ---

export const addPaymentConcept = async (instId: string, data: any) => {
    await addDoc(getSubCollectionRef(instId, 'paymentConcepts'), { ...data, createdAt: Timestamp.now() });
};

export const getPaymentConcepts = async (instId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    const q = activeOnly ? query(getSubCollectionRef(instId, 'paymentConcepts'), where("isActive", "==", true)) : query(getSubCollectionRef(instId, 'paymentConcepts'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept)).sort((a,b) => a.name.localeCompare(b.name));
};

export const registerPayment = async (instId: string, data: any, file?: File, options: any = {}) => {
    const col = getSubCollectionRef(instId, 'payments');
    const pRef = doc(col);
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instId}/vouchers/${pRef.id}`);
    const pData = { ...data, voucherUrl: url, status: options.autoApprove ? 'Aprobado' : 'Pendiente', processedAt: options.autoApprove ? Timestamp.now() : undefined, createdAt: Timestamp.now() };
    await setDoc(pRef, pData);
    return pRef.id;
}

export const bulkRegisterPayments = async (instId: string, list: any[]) => {
    const batch = writeBatch(db);
    const col = getSubCollectionRef(instId, 'payments');
    list.forEach(p => batch.set(doc(col), { ...p, status: 'Aprobado', voucherUrl: '', createdAt: Timestamp.now(), processedAt: Timestamp.now() }));
    await batch.commit();
};

export const getStudentPaymentsByStatus = async (instId: string, sId: string, status: PaymentStatus): Promise<Payment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'payments'), where("payerId", "==", sId), where("status", "==", status)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getPaymentsByStatus = async (instId: string, status: PaymentStatus, opt: any = {}) => {
    const col = getSubCollectionRef(instId, 'payments');
    let q = query(col, where("status", "==", status), orderBy("createdAt", "desc"), limit(20));
    if (opt.lastVisible) q = query(col, where("status", "==", status), orderBy("createdAt", "desc"), startAfter(opt.lastVisible), limit(20));
    const snap = await getDocs(q);
    return { payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)), newLastVisible: snap.docs[snap.docs.length - 1] || null };
};

export const getRecentApprovedPayments = async (instId: string, limitCount = 6): Promise<Payment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'payments'), where("status", "==", "Aprobado"), orderBy("processedAt", "desc"), limit(limitCount)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getApprovedPaymentsInDateRange = async (instId: string, from: Date, to: Date): Promise<Payment[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'payments'), where("status", "==", "Aprobado"), where("processedAt", ">=", from), where("processedAt", "<=", to), orderBy("processedAt", "desc")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (instId: string, pId: string, status: PaymentStatus, extra: any = {}) => {
    await updateDoc(doc(db, 'institutes', instId, 'payments', pId), { status, processedAt: Timestamp.now(), ...extra });
};

// --- Academic Periods & Matriculation ---

export const getAcademicPeriodSettings = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'academicYears', year);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as AcademicYearSettings;
    return null;
}

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'academicYears', year);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as AcademicYearSettings;
    const prevYear = (parseInt(year) - 1).toString();
    const prevSnap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', prevYear));
    return prevSnap.exists() ? prevSnap.data() as AcademicYearSettings : null;
}

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'academicYears', year);
    await setDoc(docRef, data, { merge: true });
}

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    units.forEach(unit => {
        const mRef = doc(matriculationsCol);
        batch.set(mRef, { studentId, unitId: unit.id, programId: unit.programId, year, period: unit.period, semester: unit.semester, moduleId: unit.moduleId, status: 'cursando', createdAt: Timestamp.now() });
    });
    await batch.commit();
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    const unitIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().unitId)));
    const [programs, allUnits] = await Promise.all([getPrograms(instituteId), getUnits(instituteId)]);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    const unitMap = new Map(allUnits.map(u => [u.id, u]));
    return unitIds.map(id => unitMap.get(id)).filter(Boolean).map(u => ({ ...u!, programName: programMap.get(u!.programId) || 'N/A' }));
};

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation)).sort((a, b) => b.year.localeCompare(a.year) || b.period.localeCompare(a.period));
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const q = query(getSubCollectionRef(instituteId, 'matriculations'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
    const mSnap = await getDocs(q);
    if (mSnap.empty) return [];
    const sIds = mSnap.docs.map(d => d.data().studentId);
    const sSnap = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), where('documentId', 'in', sIds)));
    return sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

// --- LMS, Grades & Attendance ---

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
}

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators'), data);
}

export const updateAchievementIndicator = async (instituteId: string, unitId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', id), data);
}

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', id));
}

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
  const snap = await getDocs(query(getSubCollectionRef(instituteId, 'academicRecords'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, sId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${sId}_${year}_${period}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AcademicRecord : null;
}

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    for (let i = 0; i < records.length; i += 5) {
        const batch = writeBatch(db);
        records.slice(i, i + 5).forEach(r => {
            batch.set(doc(db, 'institutes', instituteId, 'academicRecords', r.id), r, { merge: true });
            if (r.grades) Object.values(r.grades).flat().filter(g => g.type === 'task').forEach(g => {
                batch.update(doc(db, 'institutes', instituteId, 'unidadesDidacticas', r.unitId, 'weeklyPlanner', `week_${g.weekNumber}`, 'tasks', g.refId, 'submissions', r.studentId), { grade: g.grade });
            });
        });
        await batch.commit();
    }
}

export const addManualEvaluationToRecord = async (instId: string, uId: string, year: string, period: UnitPeriod, sIds: string[], data: any) => {
    const batch = writeBatch(db);
    const id = doc(collection(db, 'idGenerator')).id; 
    sIds.forEach(sId => {
        batch.set(doc(db, 'institutes', instId, 'academicRecords', `${uId}_${sId}_${year}_${period}`), { evaluations: { [data.indicatorId]: arrayUnion({ ...data, id, createdAt: Timestamp.now() }) } }, { merge: true });
    });
    await batch.commit();
}

export const deleteManualEvaluationFromRecord = async (instId: string, uId: string, year: string, period: UnitPeriod, indId: string, evId: string) => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'academicRecords'), where("unitId", "==", uId), where("year", "==", year), where("period", "==", period)));
    const batch = writeBatch(db);
    snap.forEach(d => {
        const r = d.data() as AcademicRecord;
        if (r.evaluations?.[indId]) {
            const evs = { ...r.evaluations, [indId]: r.evaluations[indId].filter(e => e.id !== evId) };
            const grs = r.grades || {};
            if (grs[indId]) grs[indId] = grs[indId].filter(g => g.refId !== evId);
            batch.update(d.ref, { evaluations: evs, grades: grs });
        }
    });
    await batch.commit();
}

export const getAttendanceForUnit = async (instId: string, uId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'attendance', `${uId}_${year}_${period}`));
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instId: string, data: AttendanceRecord): Promise<void> => {
    await setDoc(doc(db, 'institutes', instId, 'attendance', data.id), data, { merge: true });
};

export const saveSyllabus = async (instId: string, uId: string, data: Syllabus): Promise<void> => {
    await setDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'data', 'syllabus'), data, { merge: true });
}

export const getSyllabus = async (instId: string, uId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'data', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
}

export const getWeekData = async (instId: string, uId: string, wNum: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`));
    return snap.exists() ? snap.data() as WeekData : null;
};

export const getWeeksData = async (instId: string, uId: string): Promise<WeekData[]> => {
    const snap = await getDocs(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner'));
    return snap.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData));
};

export const addContentToWeek = async (instId: string, uId: string, wNum: number, data: any, file?: File) => {
    const id = doc(collection(db, 'idGenerator')).id;
    let url = data.value || '';
    if (data.type === 'file' && file) url = await uploadFileAndGetURL(file, `institutes/${instId}/units/${uId}/week_${wNum}/${id}`);
    await setDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { contents: arrayUnion({ ...data, id, value: url, createdAt: Timestamp.now() }) }, { merge: true });
};

export const updateContentInWeek = async (instId: string, uId: string, wNum: number, cId: string, data: any, file?: File) => {
    const wData = await getWeekData(instId, uId, wNum);
    if (!wData?.contents) return;
    const idx = wData.contents.findIndex(c => c.id === cId);
    if (idx === -1) return;
    const updated = { ...wData.contents[idx], ...data };
    if (data.type === 'file' && file) updated.value = await uploadFileAndGetURL(file, `institutes/${instId}/units/${uId}/week_${wNum}/${cId}`);
    wData.contents[idx] = updated;
    await updateDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { contents: wData.contents });
}

export const deleteContentFromWeek = async (instId: string, uId: string, wNum: number, content: Content) => {
    if (content.type === 'file') try { await deleteObject(ref(firebaseStorage, content.value)); } catch (e) {}
    await updateDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { contents: arrayRemove(content) });
};

export const addTaskToWeek = async (instId: string, uId: string, wNum: number, data: any, file?: File) => {
    const id = doc(collection(db, 'idGenerator')).id;
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instId}/units/${uId}/week_${wNum}/tasks/${id}`);
    await setDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { tasks: arrayUnion({ ...data, id, fileUrl: url, createdAt: Timestamp.now() }) }, { merge: true });
};

export const updateTaskInWeek = async (instId: string, uId: string, wNum: number, tId: string, data: any, file?: File) => {
    const wData = await getWeekData(instId, uId, wNum);
    if (!wData?.tasks) return;
    const idx = wData.tasks.findIndex(t => t.id === tId);
    if (idx === -1) return;
    let url = data.fileUrl || wData.tasks[idx].fileUrl;
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instId}/units/${uId}/week_${wNum}/tasks/${tId}`);
    wData.tasks[idx] = { ...wData.tasks[idx], ...data, fileUrl: url };
    await updateDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { tasks: wData.tasks });
}

export const deleteTaskFromWeek = async (instId: string, uId: string, wNum: number, tId: string) => {
    const wData = await getWeekData(instId, uId, wNum);
    if (!wData?.tasks) return;
    const item = wData.tasks.find(t => t.id === tId);
    if (item) await updateDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { tasks: arrayRemove(item) });
};

export const setWeekVisibility = async (instId: string, uId: string, wNum: number, isVisible: boolean) => {
    await setDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { isVisible, weekNumber: wNum }, { merge: true });
};

export const saveWeekSyllabusData = async (instId: string, uId: string, wNum: number, data: any) => {
    await setDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`), { ...data, weekNumber: wNum }, { merge: true });
};

// --- Roles & Access ---

export const getRolePermissions = async (instId: string, rId: string) => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'roles', rId));
    return snap.exists() ? snap.data().permissions : null;
}

export const updateRole = async (instId: string, rId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'roles', rId), data);
}

export const addAccessPoint = async (instId: string, data: any) => {
    await addDoc(getSubCollectionRef(instId, 'accessPoints'), data);
};

export const getAccessPoint = async (instId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'accessPoints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
}

export const getAccessPoints = async (instId: string): Promise<AccessPoint[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'accessPoints'), orderBy('name')));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const updateAccessPoint = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'accessPoints', id), data);
};

export const deleteAccessPoint = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'accessPoints', id));
};

export const listenToAllAccessLogs = (instId: string, cb: any) => {
    return onSnapshot(query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instId), orderBy('timestamp', 'desc'), limit(50)), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const getAccessLogsPaginated = async (opt: any) => {
    let q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', opt.instituteId));
    if (opt.accessPointId && opt.accessPointId !== 'all') q = query(q, where('accessPointId', '==', opt.accessPointId));
    if (opt.userDocumentId) q = query(q, where('userDocumentId', '==', opt.userDocumentId));
    if (opt.startDate) q = query(q, where('timestamp', '>=', Timestamp.fromDate(opt.startDate)));
    if (opt.endDate) q = query(q, where('timestamp', '<=', Timestamp.fromDate(opt.endDate)));
    q = query(q, orderBy('timestamp', 'desc'));
    if (opt.startAfterDoc) q = query(q, startAfter(opt.startAfterDoc));
    q = query(q, limit(opt.limitCount));
    const s = await getDocs(q);
    return { logs: s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog)), lastVisible: s.docs[s.docs.length-1] || null };
};

export const listenToAccessLogs = (opt: any, cb: any) => {
    let q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', opt.instituteId));
    if (opt.accessPointId && opt.accessPointId !== 'all') q = query(q, where('accessPointId', '==', opt.accessPointId));
    if (opt.userDocumentId) q = query(q, where('userDocumentId', '==', opt.userDocumentId));
    if (opt.startDate) q = query(q, where('timestamp', '>=', Timestamp.fromDate(opt.startDate)));
    if (opt.endDate) q = query(q, where('timestamp', '<=', Timestamp.fromDate(opt.endDate)));
    q = query(q, orderBy('timestamp', 'desc'), limit(opt.limitCount));
    return onSnapshot(q, (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog)), s.docs[s.docs.length-1] || null));
};

export const listenToAccessLogsForPoint = (instId: string, apId: string, cb: any) => {
    return onSnapshot(query(collection(db, 'institutes', instId, 'accessPoints', apId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50)), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForUser = (instId: string, uId: string, cb: any) => {
    return onSnapshot(query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instId), where('userDocumentId', '==', uId), orderBy('timestamp', 'desc'), limit(20)), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const getMonthlyAccessLogs = async (instId: string, year: number, month: number, apId?: string) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    let q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instId), where('timestamp', '>=', Timestamp.fromDate(start)), where('timestamp', '<=', Timestamp.fromDate(end)));
    if (apId && apId !== 'all') q = query(q, where('accessPointId', '==', apId));
    const s = await getDocs(query(q, orderBy('timestamp', 'asc')));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog));
}

// --- Infrastructure & Inventory ---

export const getMatriculationReportData = async (instId: string, pId: string, year: string, sem: number): Promise<MatriculationReportData | null> => {
    const [progs, allU, allS] = await Promise.all([getPrograms(instId), getUnits(instId), getStaffProfiles(instId)]);
    const prog = progs.find(p => p.id === pId);
    if (!prog) return null;
    const tMap = new Map(allS.map(s => [s.documentId, s.displayName]));
    const units = allU.filter(u => u.programId === pId && u.semester === sem);
    const ass = await getAssignments(instId, year, pId);
    const reportUnits = await Promise.all(units.map(async (u) => {
        const mSnap = await getDocs(query(getSubCollectionRef(instId, 'matriculations'), where("unitId", "==", u.id), where("year", "==", year)));
        const sIds = mSnap.docs.map(d => d.data().studentId);
        let students: StudentProfile[] = [];
        if (sIds.length > 0) {
            const sSnap = await getDocs(query(getSubCollectionRef(instId, 'studentProfiles'), where('documentId', 'in', sIds)));
            students = sSnap.docs.map(d => d.data() as StudentProfile).sort((a,b) => a.lastName.localeCompare(b.lastName));
        }
        return { unit: u, teacherName: ass[u.period]?.[u.id] ? tMap.get(ass[u.period][u.id]) || null : null, students };
    }));
    return { program: prog, units: reportUnits };
};

export const addBuilding = async (instId: string, data: any) => {
    await addDoc(getSubCollectionRef(instId, 'buildings'), data);
};

export const getBuildings = async (instId: string): Promise<Building[]> => {
    const s = await getDocs(query(getSubCollectionRef(instId, 'buildings'), orderBy("name")));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as Building));
};

export const updateBuilding = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'buildings', id), data);
};

export const deleteBuilding = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'buildings', id));
};

export const addEnvironment = async (instId: string, bId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instId, 'buildings', bId, 'environments'), { ...data, buildingId: bId });
};

export const getEnvironmentsForBuilding = async (instId: string, bId: string): Promise<Environment[]> => {
    const s = await getDocs(query(collection(db, 'institutes', instId, 'buildings', bId, 'environments'), orderBy("name")));
    return s.docs.map(d => ({ id: d.id, buildingId: bId, ...d.data() } as Environment));
};

export const getEnvironments = async (instId: string): Promise<Environment[]> => {
    const bs = await getBuildings(instId);
    let all: Environment[] = [];
    for (const b of bs) all = all.concat(await getEnvironmentsForBuilding(instId, b.id));
    return all;
};

export const updateEnvironment = async (instId: string, bId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'buildings', bId, 'environments', id), data);
};

export const deleteEnvironment = async (instId: string, bId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'buildings', bId, 'environments', id));
};

export const getAssetTypes = async (instId: string, opt: any) => {
    let q = query(getSubCollectionRef(instId, 'assetTypes'));
    if (opt?.search) {
        const s = opt.search.toUpperCase();
        q = query(q, where('name', '>=', s), where('name', '<=', s + '\uf8ff'));
    }
    const snap = await getDocs(query(q, orderBy("name"), limit(opt?.limit || 20)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const getAssetTypeById = async (instId: string, id: string): Promise<AssetType | null> => {
    const s = await getDoc(doc(db, 'institutes', instId, 'assetTypes', id));
    return s.exists() ? { id: s.id, ...s.data() } as AssetType : null;
};

export const addAssetType = async (instId: string, data: any) => {
    await setDoc(doc(db, 'institutes', instId, 'assetTypes', data.patrimonialCode), { ...data, lastAssignedNumber: 0 }, { merge: true });
};

export const bulkAddAssetTypes = async (instId: string, list: any[]) => {
    const batch = writeBatch(db);
    list.forEach(t => batch.set(doc(db, 'institutes', instId, 'assetTypes', t.patrimonialCode), { ...t, lastAssignedNumber: 0 }, { merge: true }));
    await batch.commit();
};

export const updateAssetType = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'assetTypes', id));
};

export const getAllAssets = async (instId: string): Promise<Asset[]> => {
    const bs = await getBuildings(instId);
    let all: Asset[] = [];
    for (const b of bs) {
        const es = await getEnvironmentsForBuilding(instId, b.id);
        for (const e of es) {
            const as = await getAssetsForEnvironment(instId, b.id, e.id);
            all = all.concat(as.map(a => ({ ...a, buildingName: b.name, environmentName: e.name })));
        }
    }
    return all;
};

export const getAssetsForEnvironment = async (instId: string, bId: string, eId: string): Promise<Asset[]> => {
    const s = await getDocs(query(collection(db, 'institutes', instId, 'buildings', bId, 'environments', eId, 'assets'), orderBy("name")));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const addAsset = async (instId: string, bId: string, eId: string, tId: string, data: any) => {
    const user = auth.currentUser;
    const tRef = doc(db, 'institutes', instId, 'assetTypes', tId);
    let code = '';
    await runTransaction(db, async (t) => {
        const tDoc = await t.get(tRef);
        if (!tDoc.exists()) throw new Error("Tipo no existe.");
        const tData = tDoc.data() as AssetType;
        const nNum = (tData.lastAssignedNumber || 0) + 1;
        code = `${tData.patrimonialCode}-${String(nNum).padStart(4, '0')}`;
        t.update(tRef, { lastAssignedNumber: nNum });
        const aRef = doc(collection(db, 'institutes', instId, 'buildings', bId, 'environments', eId, 'assets'));
        t.set(aRef, { ...data, assetTypeId: tId, name: tData.name, type: tData.class, codeOrSerial: code, instituteId: instId, buildingId: bId, environmentId: eId });
        if (user) t.set(doc(collection(aRef, 'history')), { action: 'create', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Creado.` });
    });
    return code;
};

export const updateAsset = async (instId: string, bId: string, eId: string, id: string, data: any) => {
    const user = auth.currentUser;
    const aRef = doc(db, 'institutes', instId, 'buildings', bId, 'environments', id);
    if(user) await addDoc(collection(aRef, 'history'), { action: 'update', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Actualizado.` });
    await updateDoc(aRef, data);
};

export const deleteAsset = async (instId: string, bId: string, eId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'buildings', bId, 'environments', id));
};

export const bulkUpdateAssetsStatus = async (instId: string, as: Asset[], s: string) => {
    const user = auth.currentUser;
    const batch = writeBatch(db);
    as.forEach(a => {
        const aRef = doc(db, 'institutes', instId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        batch.update(aRef, { status: s });
        if (user) batch.set(doc(collection(aRef, 'history')), { action: 'status_change', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Estado a ${s}.` });
    });
    await batch.commit();
}

export const moveAssets = async (instId: string, as: Asset[], tE: Environment) => {
  const user = auth.currentUser;
  const batch = writeBatch(db);
  as.forEach(a => {
    batch.delete(doc(db, 'institutes', instId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id));
    const nRef = doc(collection(db, 'institutes', instId, 'buildings', tE.buildingId, 'environments', tE.id, 'assets'));
    const { id, buildingId, environmentId, buildingName, environmentName, ...rest } = a;
    batch.set(nRef, { ...rest, instituteId: instId, buildingId: tE.buildingId, environmentId: tE.id });
    if (user) batch.set(doc(collection(nRef, 'history')), { action: 'move', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Movido a ${tE.name}.` });
  });
  await batch.commit();
};

export const getAssetHistory = async (instId: string, bId: string, eId: string, aId: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instId, 'buildings', bId, 'environments', eId, 'assets', aId, 'history'), orderBy("timestamp", "desc")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetHistoryLog));
}

// --- Schedule Management ---

export const getScheduleTemplates = async (instId: string): Promise<ScheduleTemplate[]> => {
    const s = await getDocs(query(getSubCollectionRef(instId, 'scheduleTemplates'), orderBy("name")));
    return s.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
};

export const getDefaultScheduleTemplate = async (instId: string): Promise<ScheduleTemplate | null> => {
    const q = query(getSubCollectionRef(instId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
        const any = await getDocs(query(getSubCollectionRef(instId, 'scheduleTemplates'), limit(1)));
        return any.empty ? null : { id: any.docs[0].id, ...any.docs[0].data() } as ScheduleTemplate;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const addScheduleTemplate = async (instId: string, data: any) => {
    const res = await addDoc(getSubCollectionRef(instId, 'scheduleTemplates'), data);
    return res.id;
};

export const updateScheduleTemplate = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instId: string, id: string) => {
    const col = getSubCollectionRef(instId, 'scheduleTemplates');
    const batch = writeBatch(db);
    (await getDocs(query(col, where("isDefault", "==", true)))).forEach(d => batch.update(d.ref, { isDefault: false }));
    batch.update(doc(col, id), { isDefault: true });
    await batch.commit();
}

export const getScheduledDaysForUnit = async (instId: string, uId: string, year: string, sem: number): Promise<string[]> => {
    const snap = await getDocs(getSubCollectionRef(instId, 'schedules'));
    const days = new Set<string>();
    snap.forEach(doc => {
        const d = doc.data();
        if ((d.year === year || d.year === (parseInt(year)-1).toString()) && (parseInt(d.semester) === sem || d.semester === sem) && d.schedule) {
            Object.values(d.schedule as any).forEach((b: any) => { if (b.unitId === uId) days.add(b.dayOfWeek); });
        }
    });
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(days).sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export const getSchedule = async (instId: string, pId: string, year: string, sem: number) => {
    const s = await getDoc(doc(db, 'institutes', instId, 'schedules', `${pId}_${year}_${sem}`));
    return s.exists() ? s.data().schedule || {} : {};
}

export const getAllSchedules = async (instId: string, year: string, sem: number) => {
    const snap = await getDocs(getSubCollectionRef(instId, 'schedules'));
    const all: any = {};
    snap.forEach(d => { if (d.data().year === year && parseInt(d.data().semester) === sem) Object.assign(all, d.data().schedule); });
    return all;
}

export const getInstituteSchedulesForYear = async (instId: string, year: string): Promise<ScheduleBlock[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'schedules'), where("year", "==", year)));
    const all: any[] = [];
    snap.forEach(d => { if (d.data().schedule) all.push(...Object.values(d.data().schedule as any)); });
    return all;
}

export const saveSchedule = async (instId: string, pId: string, year: string, sem: number, turno: UnitTurno, schedule: any) => {
    await setDoc(doc(db, 'institutes', instId, 'schedules', `${pId}_${year}_${sem}`), { schedule, programId: pId, year, semester: sem, turno }, { merge: true });
}

// --- PBL / ABP ---

export const getUnitProject = async (instId: string, uId: string): Promise<Project | null> => {
    const q = query(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'projects'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Project;
};

export const saveUnitProject = async (instId: string, uId: string, data: any) => {
    const col = collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'projects');
    const existing = await getUnitProject(instId, uId);
    if (existing) { await updateDoc(doc(col, existing.id), data); return existing.id; }
    const res = await addDoc(col, { ...data, createdAt: Timestamp.now() });
    return res.id;
};

export const getProjectTeams = async (instId: string, uId: string, pId: string): Promise<ProjectTeam[]> => {
    const snap = await getDocs(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'projects', pId, 'teams'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectTeam));
};

export const saveProjectTeam = async (instId: string, uId: string, pId: string, team: any) => {
    await addDoc(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'projects', pId, 'teams'), team);
};

// --- Job Board ---

export const getCompanyProfiles = async (instId: string): Promise<CompanyProfile[]> => {
    const snap = await getDocs(getSubCollectionRef(instId, 'companyProfiles'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyProfile));
};

export const addCompanyProfile = async (instId: string, data: any, file?: File) => {
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instId}/companies/${data.documentId}/logo`);
    await setDoc(doc(db, 'institutes', instId, 'companyProfiles', data.documentId), { ...data, logoUrl: url, instituteId: instId, linkedUserUid: null });
};

export const updateCompanyProfile = async (instId: string, ruc: string, data: any, file?: File) => {
    const update = { ...data };
    if (file) update.logoUrl = await uploadFileAndGetURL(file, `institutes/${instId}/companies/${ruc}/logo`);
    await updateDoc(doc(db, 'institutes', instId, 'companyProfiles', ruc), update);
};

export const deleteCompanyProfile = async (instId: string, ruc: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'companyProfiles', ruc));
};

export const addJobOffer = async (instId: string, data: any) => {
    await addDoc(getSubCollectionRef(instId, 'jobOffers'), { ...data, status: 'Abierta', createdAt: Timestamp.now(), applicantCount: 0 });
};

export const updateJobOffer = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'jobOffers', id), data);
};

export const deleteJobOffer = async (instId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instId, 'jobOffers', id));
};

export const getJobOffers = async (instId: string, opt: any = {}): Promise<JobOffer[]> => {
    const col = getSubCollectionRef(instId, 'jobOffers');
    let q = query(col, orderBy('createdAt', 'desc'));
    if (opt.companyId) q = query(col, where('companyId', '==', opt.companyId), orderBy('createdAt', 'desc'));
    else if (!opt.all) q = query(col, where('status', '==', 'Abierta'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    let os = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobOffer));
    if (opt.programId) os = os.filter(o => o.programIds.includes(opt.programId) || o.programIds.length === 0);
    return os;
};

export const applyToJob = async (instId: string, app: any) => {
    const col = getSubCollectionRef(instId, 'jobApplications');
    const existing = await getDocs(query(col, where('jobId', '==', app.jobId), where('studentId', '==', app.studentId)));
    if (!existing.empty) throw new Error("Ya has postulado.");
    const s = await getStudentProfile(instId, app.studentId);
    if (!s) throw new Error("Perfil no encontrado.");
    await addDoc(col, { ...app, studentType: s.academicStatus === 'Egresado' ? 'Egresado' : 'Estudiante', cvUrl: s.cvUrl || '', status: 'Pendiente', appliedAt: Timestamp.now() });
    await updateDoc(doc(db, 'institutes', instId, 'jobOffers', app.jobId), { applicantCount: increment(1) });
};

export const getJobApplications = async (instId: string, jId: string): Promise<JobApplication[]> => {
    const s = await getDocs(query(getSubCollectionRef(instId, 'jobApplications'), where('jobId', '==', jId), orderBy('appliedAt', 'desc')));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
};

export const getApplicationsForStudent = async (instId: string, sId: string): Promise<JobApplication[]> => {
    const s = await getDocs(query(getSubCollectionRef(instId, 'jobApplications'), where('studentId', '==', sId), orderBy('appliedAt', 'desc')));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
};

export const updateJobApplication = async (instId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instId, 'jobApplications', id), data);
};