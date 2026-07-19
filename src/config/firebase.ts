'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, increment, getCountFromServer } from 'firebase/firestore';
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
        { id: 'student', name: 'Estudiante', permissions: { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true, 'student:jobs:view': true, 'student:jobs:apply': true, 'user:supplies:request': true, 'user:access:view:own': true, 'planning:schedule:view:own': true } },
        { id: 'graduate', name: 'Egresado', permissions: { 'graduate:jobs:view': true, 'graduate:profile:view': true, 'student:grades:view': true, 'student:efsrt:view': true, 'student:payments:manage': true, 'user:access:view:own': true } },
        { id: 'teacher', name: 'Docente', permissions: { 'teacher:unit:view': true, 'teacher:efsrt:supervise': true, 'user:supplies:request': true, 'user:access:view:own': true, 'planning:schedule:view:own': true } },
        { id: 'company', name: 'Empresa', permissions: { 'company:jobs:manage': true, 'company:applicants:view': true } },
        { id: 'admin', name: 'Administrador', permissions: { 'admin:institute:manage': true, 'admin:fees:manage': true, 'admin:payments:validate': true, 'admin:access-control:manage': true, 'admin:attendance:report': true, 'admin:infra:manage': true, 'admin:supplies:manage': true, 'admin:deliveries:view': true, 'admin:companies:manage': true, 'admin:jobs:monitor': true, 'academic:program:manage': true, 'academic:unit:manage': true, 'academic:assignment:manage': true, 'academic:enrollment:manage': true, 'planning:schedule:manage': true, 'users:staff:manage': true, 'users:student:manage': true } }
    ];
    const batch = writeBatch(db);
    defaultRoles.forEach(role => { const { id, ...rData } = role; batch.set(doc(rolesCol, id), { ...rData, description: `Rol de ${role.name}` }); });
    await batch.commit();
};

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
    if ((await getDoc(ref)).exists()) throw new Error("Estudiante ya existe.");
    await setDoc(ref, { ...data, instituteId: instId, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' });
};

export const getStudentProfiles = async (instId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'studentProfiles'), orderBy("lastName")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
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

export const bulkAddStudents = async (instId: string, list: any[]) => {
    const batch = writeBatch(db);
    list.forEach(s => batch.set(doc(db, 'institutes', instId, 'studentProfiles', s.documentId), { ...s, instituteId: instId, fullName: `${s.firstName} ${s.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' }));
    await batch.commit();
};

export const promoteToEgresado = async (instId: string, sId: string, year: string) => {
    const ref = doc(db, 'institutes', instId, 'studentProfiles', sId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const batch = writeBatch(db);
    batch.update(ref, { academicStatus: 'Egresado', graduationYear: year, role: 'Graduate', roleId: 'graduate' });
    if (snap.data().linkedUserUid) batch.update(doc(db, 'users', snap.data().linkedUserUid), { role: 'Graduate', roleId: 'graduate' });
    await batch.commit();
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
    }
    if (!found) throw new Error("No coincide DNI/Email.");
    if (found.linkedUserUid) throw new Error("Perfil ya vinculado.");
    const update: any = { documentId: docId, instituteId: instId, displayName: found.displayName || found.fullName, role: found.role, roleId: found.roleId, programId: found.programId, photoURL: found.photoURL };
    await updateDoc(doc(db, 'users', uid), update);
    const col = found.type === 'staff' ? 'staffProfiles' : 'studentProfiles';
    await updateDoc(doc(db, 'institutes', instId, col, docId), { linkedUserUid: uid });
    return { role: found.role, instituteName: insts.find(i => i.id === instId)?.name };
};

// --- Roles ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const snapshot = await getDocs(query(rolesCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, roleData: Omit<Role, 'id'>): Promise<string> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const roleId = roleData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const roleRef = doc(rolesCol, roleId);
    if ((await getDoc(roleRef)).exists()) throw new Error("Rol ya existe.");
    await setDoc(roleRef, roleData);
    return roleId;
}

export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>): Promise<void> => {
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    await updateDoc(roleRef, data);
}

export const deleteRole = async (instituteId: string, roleId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

// --- Academic periods & matriculation ---

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', year));
    if (docSnap.exists()) return docSnap.data() as AcademicYearSettings;
    const prevSnap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', (parseInt(year) - 1).toString()));
    return prevSnap.exists() ? prevSnap.data() as AcademicYearSettings : null;
}

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'academicYears', year), data, { merge: true });
}

export const createMatriculations = async (instId: string, sId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(u => { batch.set(doc(getSubCollectionRef(instId, 'matriculations')), { studentId: sId, unitId: u.id, programId: u.programId, year, period: u.period, semester: u.semester, status: 'cursando', createdAt: Timestamp.now() }); });
    await batch.commit();
};

export const getEnrolledUnits = async (instId: string, sId: string): Promise<EnrolledUnit[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'matriculations'), where("studentId", "==", sId)));
    if (snap.empty) return [];
    const uIds = Array.from(new Set(snap.docs.map(d => d.data().unitId)));
    const [progs, allU] = await Promise.all([getPrograms(instId), getUnits(instId)]);
    const pMap = new Map(progs.map(p => [p.id, p.name]));
    const uMap = new Map(allU.map(u => [u.id, u]));
    return uIds.map(id => uMap.get(id)).filter(Boolean).map(u => ({ ...u!, programName: pMap.get(u!.programId) || 'N/A' }));
};

export const getMatriculationsForStudent = async (instId: string, sId: string): Promise<Matriculation[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'matriculations'), where("studentId", "==", sId)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation)).sort((a,b) => b.year.localeCompare(a.year) || b.period.localeCompare(a.period));
};

export const getEnrolledStudentProfiles = async (instId: string, uId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'matriculations'), where("unitId", "==", uId), where("year", "==", year), where("period", "==", period)));
    if (snap.empty) return [];
    const sIds = snap.docs.map(d => d.data().studentId);
    const sSnap = await getDocs(query(getSubCollectionRef(instId, 'studentProfiles'), where('documentId', 'in', sIds)));
    return sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

// --- LMS, Grades & Attendance ---

export const getAchievementIndicators = async (instId: string, uId: string): Promise<AchievementIndicator[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'achievementIndicators'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
}

export const getAcademicRecordsForUnit = async (instId: string, uId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
  const snap = await getDocs(query(getSubCollectionRef(instId, 'academicRecords'), where("unitId", "==", uId), where("year", "==", year), where("period", "==", period)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instId: string, uId: string, sId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const snap = await getDoc(doc(getSubCollectionRef(instId, 'academicRecords'), `${uId}_${sId}_${year}_${period}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AcademicRecord : null;
}

export const batchUpdateAcademicRecords = async (instId: string, records: AcademicRecord[]) => {
    for (let i = 0; i < records.length; i += 5) {
        const batch = writeBatch(db);
        records.slice(i, i + 5).forEach(r => {
            batch.set(doc(db, 'institutes', instId, 'academicRecords', r.id), r, { merge: true });
            if (r.grades) Object.values(r.grades).flat().filter(g => g.type === 'task').forEach(g => {
                batch.update(doc(db, 'institutes', instId, 'unidadesDidacticas', r.unitId, 'weeklyPlanner', `week_${g.weekNumber}`, 'tasks', g.refId, 'submissions', r.studentId), { grade: g.grade });
            });
        });
        await batch.commit();
    }
}

export const addManualEvaluationToRecord = async (instId: string, uId: string, year: string, period: UnitPeriod, sIds: string[], evalData: any) => {
    const batch = writeBatch(db);
    const id = doc(collection(db, 'idGenerator')).id; 
    sIds.forEach(sId => {
        batch.set(doc(getSubCollectionRef(instId, 'academicRecords'), `${uId}_${sId}_${year}_${period}`), { evaluations: { [evalData.indicatorId]: arrayUnion({ ...evalData, id, createdAt: Timestamp.now() }) } }, { merge: true });
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

// --- Horarios ---

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

export const saveSchedule = async (instId: string, pId: string, year: string, sem: number, turno: UnitTurno, schedule: any) => {
    await setDoc(doc(db, 'institutes', instId, 'schedules', `${pId}_${year}_${sem}`), { schedule, programId: pId, year, semester: sem, turno }, { merge: true });
}

export const getAllSchedules = async (instId: string, year: string, sem: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDocs(getSubCollectionRef(instId, 'schedules'));
    const all: any = {};
    snap.forEach(d => { if (d.data().year === year && parseInt(d.data().semester) === sem) Object.assign(all, d.data().schedule); });
    return all;
}

export const getInstituteSchedulesForYear = async (instId: string, year: string): Promise<ScheduleBlock[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'schedules'), where("year", "==", year)));
    const all: any[] = [];
    snap.forEach(d => { if (d.data().schedule) all.push(...Object.values(d.data().schedule)); });
    return all;
}

export const getWeekData = async (instId: string, uId: string, wNum: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner', `week_${wNum}`));
    return snap.exists() ? snap.data() as WeekData : null;
};

export const getWeeksData = async (instId: string, uId: string): Promise<WeekData[]> => {
    const snap = await getDocs(collection(db, 'institutes', instId, 'unidadesDidacticas', uId, 'weeklyPlanner'));
    return snap.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData));
};

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

// --- End of critical functions ---

export const getPrograms = async (instId: string): Promise<Program[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'programs'), orderBy("name")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
}

export const getUnits = async (instId: string): Promise<Unit[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'unidadesDidacticas'), orderBy("code")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export const getDefaultScheduleTemplate = async (instId: string): Promise<ScheduleTemplate | null> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1)));
    if (snap.empty) {
        const any = await getDocs(query(getSubCollectionRef(instId, 'scheduleTemplates'), limit(1)));
        return any.empty ? null : { id: any.docs[0].id, ...any.docs[0].data() } as ScheduleTemplate;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};
