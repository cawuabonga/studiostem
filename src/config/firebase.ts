
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';

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

// --- UTILS ---
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- AUTH & USERS ---
export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    instituteId: instituteId,
    createdAt: Timestamp.now(),
  }, { merge: true });
};

export const updateUserProfile = async (data: Partial<AppUser>) => {
  const user = auth.currentUser;
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, data);
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>) => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};

export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'users'), orderBy('email'));
    if (options.instituteId) q = query(q, where('instituteId', '==', options.instituteId));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    q = query(q, limit(options.limit));
    
    const snap = await getDocs(q);
    return {
        users: snap.docs.map(doc => doc.data() as AppUser),
        lastVisible: snap.docs[snap.docs.length - 1] || null
    };
};

export const getTotalUsersCount = async (instituteId?: string) => {
    let q = query(collection(db, 'users'));
    if (instituteId) q = query(q, where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    return snap.size;
};

export const linkUserToProfile = async (userId: string, documentId: string, email: string) => {
    const institutesSnap = await getDocs(collection(db, 'institutes'));
    for (const instDoc of institutesSnap.docs) {
        const instId = instDoc.id;
        const staffRef = doc(db, 'institutes', instId, 'staffProfiles', documentId);
        const studentRef = doc(db, 'institutes', instId, 'studentProfiles', documentId);

        const [staffSnap, studentSnap] = await Promise.all([getDoc(staffRef), getDoc(studentRef)]);

        if (staffSnap.exists() && staffSnap.data().email === email) {
            await updateDoc(staffRef, { linkedUserUid: userId });
            const data = staffSnap.data() as StaffProfile;
            await updateDoc(doc(db, 'users', userId), { 
                instituteId: instId, 
                documentId, 
                role: data.role, 
                roleId: data.roleId 
            });
            return { role: data.role, instituteName: instDoc.data().name };
        }

        if (studentSnap.exists() && studentSnap.data().email === email) {
            await updateDoc(studentRef, { linkedUserUid: userId });
            const data = studentSnap.data() as StudentProfile;
            await updateDoc(doc(db, 'users', userId), { 
                instituteId: instId, 
                documentId, 
                role: 'Student', 
                roleId: 'student' 
            });
            return { role: 'Student', instituteName: instDoc.data().name };
        }
    }
    throw new Error("No se encontró un perfil que coincida con el DNI y Email proporcionados.");
};

// --- INSTITUTES ---
export const addInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
  let logoUrl = '';
  if (logoFile) {
    logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
  }
  await setDoc(doc(db, 'institutes', id), { ...data, id, logoUrl }, { merge: true });
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const docSnap = await getDoc(doc(db, 'institutes', id));
  return docSnap.exists() ? docSnap.data() as Institute : null;
};

export const updateInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
    const updateData = { ...data };
    if (logoFile) {
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    await updateDoc(doc(db, 'institutes', id), updateData);
};

export const getInstitutes = async (): Promise<Institute[]> => {
  const snap = await getDocs(collection(db, 'institutes'));
  return snap.docs.map(doc => doc.data() as Institute);
};

export const deleteInstitute = async (id: string) => {
    await deleteDoc(doc(db, 'institutes', id));
};

// --- ROLES & PERMISSIONS ---
export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'roles'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, data: Omit<Role, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'roles'), data);
};

export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', roleId), data);
};

export const deleteRole = async (instituteId: string, roleId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'SuperAdmin') return null;
    if (roleId === 'student') {
        return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true } as any;
    }
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
    return docSnap.exists() ? (docSnap.data() as Role).permissions : null;
};

// --- PROGRAMS ---
export const getPrograms = async (instituteId: string): Promise<Program[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'programs'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
  await addDoc(collection(db, 'institutes', instituteId, 'programs'), data);
};

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Program>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), data);
};

export const deleteProgram = async (instituteId: string, programId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
};

// --- UNITS ---
export const getUnits = async (instituteId: string): Promise<Unit[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id'>) => {
  const docRef = await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), data);
  return docRef.id;
};

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
};

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'institutes', instituteId, 'unidadesDidacticas');
    units.forEach(u => {
        const docRef = doc(colRef);
        batch.set(docRef, { ...u, totalHours: u.theoreticalHours + u.practicalHours });
    });
    await batch.commit();
};

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/custom_image`);
    await updateUnitImage(instituteId, unitId, url);
};

export const duplicateUnit = async (instituteId: string, unitId: string) => {
    const original = await getUnit(instituteId, unitId);
    if (!original) return;
    const { id, ...data } = original;
    await addUnit(instituteId, { ...data, name: `${data.name} (Copia)`, code: `${data.code}-copy` });
};

export const bulkDeleteUnits = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'unidadesDidacticas', id)));
    await batch.commit();
};

// --- STAFF PROFILES ---
export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'staffProfiles'));
  return snap.docs.map(doc => ({ ...doc.data(), documentId: doc.id } as StaffProfile));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
  const snap = await getDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
  return snap.exists() ? { ...snap.data(), documentId: snap.id } as StaffProfile : null;
};

export const addStaffProfile = async (instituteId: string, data: Omit<StaffProfile, 'documentId'> & { documentId: string }) => {
  const { documentId, ...rest } = data;
  await setDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId), rest);
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId), data);
};

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
};

export const bulkAddStaff = async (instituteId: string, staff: any[]) => {
    const batch = writeBatch(db);
    staff.forEach(s => {
        const { documentId, ...data } = s;
        batch.set(doc(db, 'institutes', instituteId, 'staffProfiles', documentId), data);
    });
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)));
    await batch.commit();
};

// --- STUDENT PROFILES ---
export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'studentProfiles'));
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id, documentId: doc.id } as StudentProfile));
};

export const getStudentProfile = async (instituteId: string, documentId: string): Promise<StudentProfile | null> => {
  const snap = await getDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId));
  return snap.exists() ? { ...snap.data(), id: snap.id, documentId: snap.id } as StudentProfile : null;
};

export const addStudentProfile = async (instituteId: string, data: Omit<StudentProfile, 'id' | 'documentId' | 'fullName'> & { documentId: string }) => {
  const { documentId, ...rest } = data;
  const fullName = `${rest.firstName} ${rest.lastName}`.trim();
  await setDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), { ...rest, fullName });
};

export const updateStudentProfile = async (instituteId: string, documentId: string, data: Partial<StudentProfile>) => {
  if (data.firstName || data.lastName) {
      const current = await getStudentProfile(instituteId, documentId);
      if (current) {
          data.fullName = `${data.firstName || current.firstName} ${data.lastName || current.lastName}`.trim();
      }
  }
  await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), data);
};

export const bulkAddStudents = async (instituteId: string, students: any[]) => {
    const batch = writeBatch(db);
    students.forEach(s => {
        const { documentId, ...data } = s;
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        batch.set(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), { ...data, fullName });
    });
    await batch.commit();
};

// --- TEACHERS (Docentes y Coordinadores) ---
export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const staff = await getStaffProfiles(instituteId);
    const roles = await getRoles(instituteId);
    const targetRoleIds = roles
        .filter(r => r.name.toLowerCase() === 'docente' || r.name.toLowerCase() === 'coordinador')
        .map(r => r.id);
    const legacyRoles = ['Teacher', 'Coordinator'];

    return staff
        .filter(s => targetRoleIds.includes(s.roleId) || legacyRoles.includes(s.role))
        .map(s => ({
            id: s.documentId,
            documentId: s.documentId,
            fullName: s.displayName,
            email: s.email,
            phone: s.phone || '',
            specialty: '',
            active: true,
            condition: s.condition,
            programId: s.programId
        }));
};

// --- ASSIGNMENTS (Carga Lectiva) ---
export const getAssignments = async (instituteId: string, year: string, programId: string) => {
    const docRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string) => {
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

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: UnitPeriod, unitId: string, teacherId: string | null) => {
    const docRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    await setDoc(docRef, { [period]: { [unitId]: teacherId || deleteField() } }, { merge: true });
};

// --- NON-TEACHING ACTIVITIES ---
export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'nonTeachingActivities'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'nonTeachingActivities'), data);
};

export const updateNonTeachingActivity = async (instituteId: string, id: string, data: Partial<NonTeachingActivity>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('teacherId', '==', teacherId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, assignments: Omit<NonTeachingAssignment, 'id'>[]) => {
    const batch = writeBatch(db);
    const existing = await getNonTeachingAssignments(instituteId, teacherId, year, period);
    existing.forEach(e => batch.delete(doc(db, 'institutes', instituteId, 'nonTeachingAssignments', e.id)));
    assignments.forEach(a => batch.set(doc(collection(db, 'institutes', instituteId, 'nonTeachingAssignments')), a));
    await batch.commit();
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('activityId', '==', activityId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

// --- ACCESS CONTROL ---
export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'accessPoints'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const getAccessPoint = async (instituteId: string, docId: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', docId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AccessPoint : null;
};

export const addAccessPoint = async (instituteId: string, data: Omit<AccessPoint, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'accessPoints'), data);
};

export const updateAccessPoint = async (instituteId: string, id: string, data: Partial<AccessPoint>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'accessPoints', id), data);
};

export const deleteAccessPoint = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
};

export const listenToAllAccessLogs = (instituteId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForPoint = (instituteId: string, accessPointDocId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

export const listenToAccessLogsForUser = (instituteId: string, userDocumentId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), where('userDocumentId', '==', userDocumentId), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog))));
};

// --- MATRICULATION ---
export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where('studentId', '==', studentId), orderBy('semester', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    let maxSemester = 0;
    units.forEach(unit => {
        const mRef = doc(collection(db, 'institutes', instituteId, 'matriculations'));
        batch.set(mRef, { studentId, unitId: unit.id, programId: unit.programId, year, period: unit.period, semester: unit.semester, moduleId: unit.moduleId, status: 'cursando', createdAt: Timestamp.now() });
        if (unit.semester > maxSemester) maxSemester = unit.semester;
    });
    await updateStudentProfile(instituteId, studentId, { currentSemester: maxSemester });
    await batch.commit();
};

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    for (const sId of studentIds) {
        units.forEach(unit => {
            const mRef = doc(collection(db, 'institutes', instituteId, 'matriculations'));
            batch.set(mRef, { studentId: sId, unitId: unit.id, programId: unit.programId, year, period: unit.period, semester: unit.semester, moduleId: unit.moduleId, status: 'cursando', createdAt: Timestamp.now() });
        });
        batch.update(doc(db, 'institutes', instituteId, 'studentProfiles', sId), { currentSemester: semester });
    }
    await batch.commit();
};

export const deleteMatriculation = async (instituteId: string, studentId: string, mId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'matriculations', mId));
    const history = await getMatriculationsForStudent(instituteId, studentId);
    const maxSemester = history.length > 0 ? Math.max(...history.map(m => m.semester)) : 1;
    await updateStudentProfile(instituteId, studentId, { currentSemester: maxSemester });
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const matriculations = await getMatriculationsForStudent(instituteId, studentId);
    const units = await getUnits(instituteId);
    const programs = await getPrograms(instituteId);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    
    return matriculations
        .map(m => {
            const unit = units.find(u => u.id === m.unitId);
            return unit ? { ...unit, programName: programMap.get(unit.programId) || 'N/A' } : null;
        })
        .filter(Boolean) as EnrolledUnit[];
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    const studentIds = snap.docs.map(d => d.data().studentId);
    const profiles: StudentProfile[] = [];
    for (const id of studentIds) {
        const p = await getStudentProfile(instituteId, id);
        if (p) profiles.push(p);
    }
    return profiles;
};

// --- ACADEMIC RECORDS & GRADES ---
export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicRecords', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AcademicRecord : null;
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const batch = writeBatch(db);
    records.forEach(r => batch.set(doc(db, 'institutes', instituteId, 'academicRecords', r.id), r, { merge: true }));
    await batch.commit();
};

export const addManualEvaluationToRecord = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod, indicatorId: string, label: string, weekNumber: number) => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const ref = doc(db, 'institutes', instituteId, 'academicRecords', id);
    const evalId = Math.random().toString(36).substring(7);
    const newEval: ManualEvaluation = { id: evalId, indicatorId, label, weekNumber, createdAt: Timestamp.now() };
    await updateDoc(ref, { [`evaluations.${indicatorId}`]: arrayUnion(newEval) });
};

export const deleteManualEvaluationFromRecord = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod, indicatorId: string, evalId: string) => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const ref = doc(db, 'institutes', instituteId, 'academicRecords', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const evals = snap.data().evaluations?.[indicatorId] || [];
    const item = evals.find((e: any) => e.id === evalId);
    if (item) await updateDoc(ref, { [`evaluations.${indicatorId}`]: arrayRemove(item) });
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]) => {
    const batch = writeBatch(db);
    results.forEach(res => {
        const recordId = `${unitId}_${res.studentId}_${year}_${period}`;
        batch.update(doc(db, 'institutes', instituteId, 'academicRecords', recordId), { finalGrade: res.finalGrade, status: res.status });
        const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where('studentId', '==', res.studentId), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
        getDocs(q).then(snap => snap.docs.forEach(d => batch.update(d.ref, { status: res.status })));
    });
    await batch.commit();
};

// --- INDICATORS ---
export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
  await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators'), data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators', indicatorId));
};

// --- WEEKLY PLANNER & TASKS ---
export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`));
    return snap.exists() ? { ...snap.data(), weekNumber } as WeekData : null;
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: Partial<WeekData>) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), data, { merge: true });
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { isVisible }, { merge: true });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Omit<Content, 'id'>, file?: File) => {
    const id = Math.random().toString(36).substring(7);
    let value = content.value;
    if (file) {
        value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/contents/${id}`);
    }
    const finalContent = { ...content, id, value, createdAt: Timestamp.now() };
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { contents: arrayUnion(finalContent) });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const contents = snap.data().contents as Content[];
    const index = contents.findIndex(c => c.id === contentId);
    if (index === -1) return;
    let value = data.value || contents[index].value;
    if (file) value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/contents/${contentId}`);
    contents[index] = { ...contents[index], ...data, value };
    await updateDoc(ref, { contents });
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { contents: arrayRemove(content) });
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, task: Omit<Task, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const finalTask = { ...task, id, createdAt: Timestamp.now() };
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`), { tasks: arrayUnion(finalTask) });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, data: Partial<Task>) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const tasks = snap.data().tasks as Task[];
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;
    tasks[index] = { ...tasks[index], ...data };
    await updateDoc(ref, { tasks });
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const ref = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const tasks = snap.data().tasks as Task[];
    const task = tasks.find(t => t.id === taskId);
    if (task) await updateDoc(ref, { tasks: arrayRemove(task) });
};

export const submitTask = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, student: StudentProfile, file: File): Promise<void> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/submissions/${student.documentId}`;
    const fileUrl = await uploadFileAndGetURL(file, storagePath);
    await setDoc(doc(submissionsCol, student.documentId), { studentName: student.fullName, fileUrl, submittedAt: Timestamp.now() }, { merge: true });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const snap = await getDocs(submissionsCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
};

export const gradeTaskSubmission = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, taskTitle: string, studentId: string, grade: number, feedback: string): Promise<void> => {
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentId);
    await updateDoc(submissionRef, { grade, feedback });
    const year = new Date().getFullYear().toString();
    const [unit, allIndicators] = await Promise.all([getUnit(instituteId, unitId), getAchievementIndicators(instituteId, unitId)]);
    if (!unit) return;
    const indicator = allIndicators.find(ind => weekNumber >= ind.startWeek && weekNumber <= ind.endWeek);
    if (!indicator) return;
    const recordId = `${unitId}_${studentId}_${year}_${unit.period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    const recordSnap = await getDoc(recordRef);
    const gradeEntry: GradeEntry = { type: 'task', refId: taskId, label: taskTitle, grade, weekNumber };
    if (recordSnap.exists()) {
        const currentGrades = (recordSnap.data() as AcademicRecord).grades || {};
        if (!currentGrades[indicator.id]) currentGrades[indicator.id] = [];
        const idx = currentGrades[indicator.id].findIndex(g => g.refId === taskId);
        if (idx !== -1) currentGrades[indicator.id][idx] = gradeEntry;
        else currentGrades[indicator.id].push(gradeEntry);
        await updateDoc(recordRef, { grades: currentGrades });
    } else {
        await setDoc(recordRef, { studentId, unitId, programId: unit.programId, year, period: unit.period, grades: { [indicator.id]: [gradeEntry] }, evaluations: {}, finalGrade: null, attendancePercentage: 100, status: 'cursando' });
    }
};

// --- SYLLABUS ---
export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus'), data);
};

// --- ATTENDANCE ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const id = `${unitId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', id));
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, record: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', record.id), record);
};

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings) => {
    await setDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`), data);
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('unitId', '==', unitId), where('year', '==', year));
    const snap = await getDocs(q);
    const daysFound = new Set<string>();
    snap.docs.forEach(d => daysFound.add(d.data().dayOfWeek));
    
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(daysFound).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

// --- PAYMENTS ---
export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    let q = query(collection(db, 'institutes', instituteId, 'paymentConcepts'), orderBy('name'));
    if (activeOnly) q = query(q, where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
};

export const addPaymentConcept = async (instituteId: string, data: Omit<PaymentConcept, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'paymentConcepts'), { ...data, createdAt: Timestamp.now() });
};

export const updatePaymentConcept = async (instituteId: string, id: string, data: Partial<PaymentConcept>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id), data);
};

export const deletePaymentConcept = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id));
};

export const registerPayment = async (instituteId: string, data: Omit<Payment, 'id' | 'status' | 'createdAt' | 'voucherUrl'>, voucherFile?: File, options?: { autoApprove?: boolean, receiptNumber?: string }) => {
    let voucherUrl = '';
    if (voucherFile) voucherUrl = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/payments/${data.payerId}/${Date.now()}`);
    const paymentData: Omit<Payment, 'id'> = { 
        ...data, 
        voucherUrl, 
        status: options?.autoApprove ? 'Aprobado' : 'Pendiente', 
        createdAt: Timestamp.now(),
        processedAt: options?.autoApprove ? Timestamp.now() : undefined,
        receiptNumber: options?.receiptNumber
    };
    await addDoc(collection(db, 'institutes', instituteId, 'payments'), paymentData);
};

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus, options?: { lastVisible?: DocumentSnapshot, limit?: number }) => {
    let q = query(collection(db, 'institutes', instituteId, 'payments'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(options?.limit || 20));
    if (options?.lastVisible) q = query(q, startAfter(options.lastVisible));
    const snap = await getDocs(q);
    return { payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)), newLastVisible: snap.docs[snap.docs.length - 1] || null };
};

export const getStudentPaymentsByStatus = async (instituteId: string, studentId: string, status: PaymentStatus): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where('payerId', '==', studentId), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const updatePaymentStatus = async (instituteId: string, paymentId: string, status: PaymentStatus, data?: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'payments', paymentId), { status, processedAt: Timestamp.now(), ...data });
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, start: Date, end: Date): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where('status', '==', 'Aprobado'), where('paymentDate', '>=', Timestamp.fromDate(start)), where('paymentDate', '<=', Timestamp.fromDate(end)));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

// --- EFSRT (PRACTICAS) ---
export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supervisorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: Omit<EFSRTAssignment, 'id' | 'status' | 'createdAt' | 'visits'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() });
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>) => {
    const ref = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(ref, { visits: arrayUnion({ ...visit, id: Math.random().toString(36).substring(7) }) });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { grade, observations, status: grade >= 13 ? 'Aprobado' : 'Desaprobado', processedAt: Timestamp.now() });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [`${type}ReportUrl`]: url });
};

export const checkEgresoEligibility = async (instituteId: string, studentId: string) => {
    const [mats, efsrt, student] = await Promise.all([getMatriculationsForStudent(instituteId, studentId), getEFSRTAssignmentsForStudent(instituteId, studentId), getStudentProfile(instituteId, studentId)]);
    const pendingUnits = mats.filter(m => m.status !== 'aprobado').map(m => m.unitId);
    const pendingEFSRT = efsrt.filter(e => e.status !== 'Aprobado').map(e => e.moduleId);
    return { eligible: pendingUnits.length === 0 && pendingEFSRT.length === 0, pendingUnits, pendingEFSRT };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, year: string) => {
    await updateStudentProfile(instituteId, studentId, { academicStatus: 'Egresado', graduationYear: year });
};

// --- SCHEDULES / HORARIOS ---
export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const colRef = collection(db, 'institutes', instituteId, 'scheduleTemplates');
    const snap = await getDocs(colRef);
    if (snap.empty) return null;
    const templates = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
    return templates.find(t => t.isDefault) || templates[0];
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'scheduleTemplates'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
};

export const addScheduleTemplate = async (instituteId: string, data: Omit<ScheduleTemplate, 'id'>) => {
    const ref = await addDoc(collection(db, 'institutes', instituteId, 'scheduleTemplates'), data);
    return ref.id;
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: Partial<ScheduleTemplate>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string) => {
    const batch = writeBatch(db);
    const all = await getScheduleTemplates(instituteId);
    all.forEach(t => batch.update(doc(db, 'institutes', instituteId, 'scheduleTemplates', t.id), { isDefault: t.id === id }));
    await batch.commit();
};

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('year', '==', year), where('semester', '==', semester));
    const snap = await getDocs(q);
    const map: Record<string, ScheduleBlock> = {};
    snap.docs.forEach(d => {
        const b = d.data() as ScheduleBlock;
        map[`${b.dayOfWeek}-${b.startTime}`] = b;
    });
    return map;
};

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleBlock));
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, blocks: Record<string, ScheduleBlock>) => {
    const colId = `${programId}_${year}_${semester}_${turno}`;
    const batch = writeBatch(db);
    const colRef = collection(db, 'institutes', instituteId, 'schedules', colId, 'scheduleBlocks');
    const existing = await getDocs(colRef);
    existing.docs.forEach(d => batch.delete(d.ref));
    Object.entries(blocks).forEach(([key, b]) => batch.set(doc(colRef, key), { ...b, instituteId }));
    await batch.commit();
};

// --- LOGIN DESIGN ---
export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
  const snap = await getDoc(doc(db, 'config', 'loginDesign'));
  return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: LoginDesign) => {
  await setDoc(doc(db, 'config', 'loginDesign'), data);
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
  const snap = await getDocs(collection(db, 'config', 'loginDesign', 'images'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string) => {
  const url = await uploadFileAndGetURL(file, `config/login/images/${Date.now()}`);
  await addDoc(collection(db, 'config', 'loginDesign', 'images'), { name, url, createdAt: Timestamp.now() });
};

export const deleteLoginImage = async (image: LoginImage) => {
  await deleteDoc(doc(db, 'config', 'loginDesign', 'images', image.id));
  try { await deleteObject(ref(storage, image.url)); } catch (e) {}
};

export const setActiveLoginImage = async (url: string) => {
  await updateDoc(doc(db, 'config', 'loginDesign'), { imageUrl: url });
};

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const design = await getLoginDesignSettings();
    return design?.imageUrl || null;
};

// --- ENVIRONMENTS ---
export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const buildings = await getBuildings(instituteId);
    const allEnvs: Environment[] = [];
    for (const b of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        allEnvs.push(...envs);
    }
    return allEnvs;
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), buildingId } as Environment));
};

export const addBuilding = async (instituteId: string, data: Omit<Building, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings'), data);
};

export const updateBuilding = async (instituteId: string, id: string, data: Partial<Building>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', id), data);
};

export const deleteBuilding = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', id));
};

export const addEnvironment = async (instituteId: string, buildingId: string, data: Omit<Environment, 'id' | 'buildingId'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), data);
};

export const updateEnvironment = async (instituteId: string, buildingId: string, id: string, data: Partial<Environment>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id), data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id));
};

// --- ASSETS ---
export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const q = query(collectionGroup(db, 'assets'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const getAssetTypeById = async (instituteId: string, typeId: string): Promise<AssetType | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', typeId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AssetType : null;
};

export const getAssetTypes = async (instituteId: string, options: { search?: string, limit?: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'institutes', instituteId, 'assetTypes'), orderBy('name'));
    if (options.search) q = query(q, where('name', '>=', options.search), where('name', '<=', options.search + '\uf8ff'));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    if (options.limit) q = query(q, limit(options.limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const addAssetType = async (instituteId: string, data: Omit<AssetType, 'id' | 'lastAssignedNumber'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'assetTypes'), { ...data, lastAssignedNumber: 0 });
};

export const updateAssetType = async (instituteId: string, id: string, data: Partial<AssetType>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
};

export const bulkAddAssetTypes = async (instituteId: string, types: any[]) => {
    const batch = writeBatch(db);
    types.forEach(t => batch.set(doc(collection(db, 'institutes', instituteId, 'assetTypes')), { ...t, lastAssignedNumber: 0 }));
    await batch.commit();
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, assetTypeId: string, data: any) => {
    const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    const typeSnap = await getDoc(typeRef);
    if (!typeSnap.exists()) throw new Error("Tipo de activo no encontrado.");
    const typeData = typeSnap.data() as AssetType;
    const newNumber = (typeData.lastAssignedNumber || 0) + 1;
    const code = `${typeData.patrimonialCode}-${String(newNumber).padStart(4, '0')}`;
    const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    await runTransaction(db, async (tx) => {
        tx.update(typeRef, { lastAssignedNumber: newNumber });
        tx.set(assetRef, { ...data, id: assetRef.id, assetTypeId, codeOrSerial: code, name: typeData.name, type: typeData.class, instituteId, buildingId, environmentId });
    });
    return code;
};

export const updateAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string, data: Partial<Asset>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId), data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId));
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string) => {
    const batch = writeBatch(db);
    assets.forEach(a => batch.update(doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id), { status }));
    await batch.commit();
};

export const moveAssets = async (instituteId: string, assets: Asset[], target: Environment) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const oldRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        const newRef = doc(db, 'institutes', instituteId, 'buildings', target.buildingId, 'environments', target.id, 'assets', a.id);
        batch.delete(oldRef);
        batch.set(newRef, { ...a, buildingId: target.buildingId, environmentId: target.id, buildingName: deleteField(), environmentName: deleteField() });
    });
    await batch.commit();
};

export const getAssetHistory = async (instituteId: string, bId: string, eId: string, aId: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', aId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
};

// --- SUPPLY CATALOG & STOCK ---
export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'supplyItems'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyItem));
};

export const addSupplyItem = async (instituteId: string, data: Omit<SupplyItem, 'id' | 'stock'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'supplyItems'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: Partial<SupplyItem>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyItems', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyItems', id));
};

export const updateStock = async (instituteId: string, itemId: string, change: number, notes: string) => {
    const ref = doc(db, 'institutes', instituteId, 'supplyItems', itemId);
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Insumo no encontrado.");
        const current = snap.data().stock || 0;
        const next = current + change;
        if (next < 0) throw new Error("Stock insuficiente.");
        tx.update(ref, { stock: next });
        tx.set(doc(collection(ref, 'history')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change, newStock: next, notes });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyItems', itemId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const createSupplyRequest = async (instituteId: string, data: Omit<SupplyRequest, 'id' | 'status' | 'createdAt' | 'code'>) => {
    const count = (await getDocs(collection(db, 'institutes', instituteId, 'supplyRequests'))).size;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
};

export const createDirectApprovedRequest = async (instituteId: string, data: Omit<SupplyRequest, 'id' | 'status' | 'createdAt' | 'code'>) => {
    const count = (await getDocs(collection(db, 'institutes', instituteId, 'supplyRequests'))).size;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { ...data, code, status: 'Aprobado', createdAt: Timestamp.now(), processedAt: Timestamp.now() });
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const getRequestsForUser = async (instituteId: string, authUid: string): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where('requesterAuthUid', '==', authUid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const updateSupplyRequest = async (instituteId: string, id: string, data: Partial<SupplyRequest>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), data);
};

export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: SupplyRequestStatus, data?: any) => {
    const ref = doc(db, 'institutes', instituteId, 'supplyRequests', id);
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Pedido no encontrado.");
        const req = snap.data() as SupplyRequest;
        if (status === 'Entregado') {
            for (const item of req.items) {
                const qty = item.approvedQuantity ?? item.requestedQuantity;
                const itemRef = doc(db, 'institutes', instituteId, 'supplyItems', item.itemId);
                const itemSnap = await tx.get(itemRef);
                const current = itemSnap.data()?.stock || 0;
                tx.update(itemRef, { stock: current - qty });
                tx.set(doc(collection(itemRef, 'history')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change: -qty, newStock: current - qty, notes: `Entrega pedido ${req.code}` });
            }
        } else if (status === 'Anulado' && req.status === 'Entregado') {
            for (const item of req.items) {
                const qty = item.approvedQuantity ?? item.requestedQuantity;
                const itemRef = doc(db, 'institutes', instituteId, 'supplyItems', item.itemId);
                const itemSnap = await tx.get(itemRef);
                const current = itemSnap.data()?.stock || 0;
                tx.update(itemRef, { stock: current + qty });
                tx.set(doc(collection(itemRef, 'history')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change: qty, newStock: current + qty, notes: `Anulación entrega ${req.code}` });
            }
        }
        tx.update(ref, { status, processedAt: Timestamp.now(), ...data });
    });
};

// --- NEWS & GALLERY ---
export const getNewsList = async (instituteId: string): Promise<News[]> => {
  const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'news'), orderBy('createdAt', 'desc')));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};

export const addNews = async (instituteId: string, data: Omit<News, 'id' | 'createdAt' | 'imageUrl'>, imageFile?: File) => {
  let imageUrl = '';
  const id = Math.random().toString(36).substring(7);
  if (imageFile) imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${id}`);
  await setDoc(doc(db, 'institutes', instituteId, 'news', id), { ...data, imageUrl, createdAt: Timestamp.now() });
};

export const updateNews = async (instituteId: string, id: string, data: Partial<News>, imageFile?: File) => {
    const updateData = { ...data };
    if (imageFile) updateData.imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${id}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'news', id), updateData);
};

export const deleteNews = async (instituteId: string, news: News) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', news.id));
    if (news.imageUrl) try { await deleteObject(ref(storage, news.imageUrl)); } catch (e) {}
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const addAlbum = async (instituteId: string, data: Omit<Album, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const updateAlbum = async (instituteId: string, id: string, data: Partial<Album>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]) => {
    const batch = writeBatch(db);
    for (const f of files) {
        const id = Math.random().toString(36).substring(7);
        const url = await uploadFileAndGetURL(f, `institutes/${instituteId}/albums/${albumId}/${id}`);
        batch.set(doc(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos')), { url, createdAt: Timestamp.now(), albumId });
        if (files.indexOf(f) === 0) await updateDoc(doc(db, 'institutes', instituteId, 'albums', albumId), { coverImageUrl: url });
    }
    await batch.commit();
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
    try { await deleteObject(ref(storage, photo.url)); } catch (e) {}
};

// --- MATRICULATION REPORTS ---
export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData> => {
    const programs = await getPrograms(instituteId);
    const prog = programs.find(p => p.id === programId);
    if (!prog) throw new Error("Programa no encontrado.");
    
    const units = (await getUnits(instituteId)).filter(u => u.programId === programId && u.semester === semester);
    const assignments = await getAssignments(instituteId, year, programId);
    const teachers = await getTeachers(instituteId);
    
    const reportUnits = [];
    for (const u of units) {
        const tId = assignments[u.period]?.[u.id];
        const teacher = teachers.find(t => t.documentId === tId);
        const students = await getEnrolledStudentProfiles(instituteId, u.id, year, u.period);
        reportUnits.push({ unit: u, teacherName: teacher?.fullName || null, students });
    }
    
    return { program: prog, units: reportUnits };
};
