import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  addDoc,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  runTransaction,
  writeBatch,
  getCountFromServer,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { 
  AppUser, 
  UserRole, 
  Institute, 
  LoginDesign, 
  LoginImage,
  Program,
  Unit,
  StaffProfile,
  StudentProfile,
  PaymentConcept,
  Payment,
  SupplyItem,
  SupplyRequest,
  SupplyRequestItem,
  Building,
  Environment,
  Asset,
  AssetType,
  ScheduleTemplate,
  ScheduleBlock,
  WeekData,
  AchievementIndicator,
  AcademicRecord,
  AttendanceRecord,
  Syllabus,
  Matriculation,
  NonTeachingActivity,
  NonTeachingAssignment,
  EFSRTAssignment,
  EFSRTVisit,
  EFSRTStatus,
  Permission,
  Role,
  Album,
  Photo
} from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with persistence if config is valid
export const db = isConfigValid 
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    })
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);

export { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, firebaseSignOut as signOut, onAuthStateChanged };

// --- HELPER FUNCTIONS ---

export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const getSubCollectionRef = (instituteId: string, subCollection: string) => {
    return collection(db, 'institutes', instituteId, subCollection);
};

// --- USER & AUTH ---

export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
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
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No user logged in");
  const userRef = doc(db, 'users', currentUser.uid);
  await updateDoc(userRef, data);
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: any }) => {
    let q = query(collection(db, 'users'), orderBy('displayName'), limit(options.limit));
    if (options.instituteId) {
        q = query(collection(db, 'users'), where('instituteId', '==', options.instituteId), orderBy('displayName'), limit(options.limit));
    }
    if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
    }
    const snapshot = await getDocs(q);
    return {
        users: snapshot.docs.map(doc => doc.data() as AppUser),
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
};

export const getTotalUsersCount = async (instituteId?: string) => {
    const colRef = collection(db, 'users');
    const q = instituteId ? query(colRef, where('instituteId', '==', instituteId)) : colRef;
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
};

// --- INSTITUTES ---

export const getInstitutes = async (): Promise<Institute[]> => {
  const snapshot = await getDocs(collection(db, 'institutes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const docRef = doc(db, 'institutes', id);
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Institute) : null;
};

export const addInstitute = async (id: string, data: any, logoFile?: File) => {
  let logoUrl = '';
  if (logoFile) {
    logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
  }
  await setDoc(doc(db, 'institutes', id), { ...data, logoUrl, createdAt: Timestamp.now() });
};

export const updateInstitute = async (id: string, data: any, logoFile?: File) => {
  if (logoFile) {
    data.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
  }
  await updateDoc(doc(db, 'institutes', id), data);
};

export const deleteInstitute = async (id: string) => {
  await deleteDoc(doc(db, 'institutes', id));
};

// --- ROLES & PERMISSIONS ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
  const snapshot = await getDocs(getSubCollectionRef(instituteId, 'roles'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    const roleDoc = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
    if (roleDoc.exists()) {
        return roleDoc.data().permissions as Record<Permission, boolean>;
    }
    return null;
};

export const addRole = async (instituteId: string, role: Omit<Role, 'id'>) => {
  await addDoc(getSubCollectionRef(instituteId, 'roles'), role);
};

export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'roles', roleId), data);
};

export const deleteRole = async (instituteId: string, roleId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

// --- PROGRAMS ---

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
  const snapshot = await getDocs(getSubCollectionRef(instituteId, 'programs'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, program: Omit<Program, 'id'>) => {
  await addDoc(getSubCollectionRef(instituteId, 'programs'), program);
};

export const updateProgram = async (instituteId: string, programId: string, data: any) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), data);
};

export const deleteProgram = async (instituteId: string, programId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
};

// --- UNITS ---

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
  const snapshot = await getDocs(getSubCollectionRef(instituteId, 'units'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'units', unitId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Unit) : null;
};

export const addUnit = async (instituteId: string, unit: Omit<Unit, 'id' | 'totalHours'>): Promise<string> => {
  const docRef = await addDoc(getSubCollectionRef(instituteId, 'units'), {
      ...unit,
      totalHours: unit.theoreticalHours + unit.practicalHours
  });
  return docRef.id;
};

export const updateUnit = async (instituteId: string, unitId: string, data: any) => {
  if (data.theoreticalHours !== undefined || data.practicalHours !== undefined) {
      data.totalHours = (data.theoreticalHours || 0) + (data.practicalHours || 0);
  }
  await updateDoc(doc(db, 'institutes', instituteId, 'units', unitId), data);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'units', unitId));
};

export const bulkAddUnits = async (instituteId: string, units: any[]) => {
    const batch = writeBatch(db);
    units.forEach(unit => {
        const ref = doc(getSubCollectionRef(instituteId, 'units'));
        batch.set(ref, { ...unit, totalHours: unit.theoreticalHours + unit.practicalHours });
    });
    await batch.commit();
};

export const duplicateUnit = async (instituteId: string, unitId: string) => {
    const unit = await getUnit(instituteId, unitId);
    if (unit) {
        const { id, ...data } = unit;
        await addUnit(instituteId, { ...data, name: `${data.name} (Copia)` });
    }
};

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'units', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File) => {
    const path = `institutes/${instituteId}/units/${unitId}/custom_image`;
    const url = await uploadFileAndGetURL(file, path);
    await updateUnitImage(instituteId, unitId, url);
};

// --- SYLLABUS ---

export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'config', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus) => {
    await setDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'config', 'syllabus'), data);
};

// --- WEEK DATA ---

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`));
    return snap.exists() ? snap.data() as WeekData : null;
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    await setDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`), { isVisible }, { merge: true });
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: Partial<WeekData>) => {
    await setDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`), data, { merge: true });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, content: any, file?: File) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    if (file) {
        content.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/contents/${Date.now()}`);
    }
    const id = doc(collection(db, 'idGen')).id;
    await setDoc(weekRef, { contents: arrayUnion({ ...content, id, createdAt: Timestamp.now() }) }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: any, file?: File) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    const snap = await getDoc(weekRef);
    if (!snap.exists()) return;
    const contents = snap.data().contents as any[];
    const index = contents.findIndex(c => c.id === contentId);
    if (index === -1) return;
    if (file) {
        data.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/weeks/${weekNumber}/contents/${Date.now()}`);
    }
    contents[index] = { ...contents[index], ...data };
    await updateDoc(weekRef, { contents });
};

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: any) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    await updateDoc(weekRef, { contents: arrayRemove(content) });
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, task: any) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    const id = doc(collection(db, 'idGen')).id;
    await setDoc(weekRef, { tasks: arrayUnion({ ...task, id, createdAt: Timestamp.now() }) }, { merge: true });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, data: any) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    const snap = await getDoc(weekRef);
    if (!snap.exists()) return;
    const tasks = snap.data().tasks as any[];
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;
    tasks[index] = { ...tasks[index], ...data };
    await updateDoc(weekRef, { tasks });
};

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const weekRef = doc(db, 'institutes', instituteId, 'units', unitId, 'weeks', `week_${weekNumber}`);
    const snap = await getDoc(weekRef);
    if (!snap.exists()) return;
    const tasks = (snap.data().tasks as any[]).filter(t => t.id !== taskId);
    await updateDoc(weekRef, { tasks });
};

// --- STAFF & STUDENT PROFILES ---

export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
  const snapshot = await getDocs(getSubCollectionRef(instituteId, 'staffProfiles'));
  return snapshot.docs.map(doc => ({ ...doc.data() } as StaffProfile));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as StaffProfile : null;
};

export const addStaffProfile = async (instituteId: string, profile: StaffProfile) => {
  await setDoc(doc(db, 'institutes', instituteId, 'staffProfiles', profile.documentId), { ...profile, linkedUserUid: null });
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
  await updateDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId), data);
};

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
};

export const bulkAddStaff = async (instituteId: string, staffList: any[]) => {
    const batch = writeBatch(db);
    staffList.forEach(s => {
        const ref = doc(db, 'institutes', instituteId, 'staffProfiles', s.documentId);
        batch.set(ref, { ...s, linkedUserUid: null });
    });
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
        batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id));
    });
    await batch.commit();
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
  const snapshot = await getDocs(getSubCollectionRef(instituteId, 'studentProfiles'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getStudentProfile = async (instituteId: string, documentId: string): Promise<StudentProfile | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'studentProfiles', documentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        return { ...data, fullName: `${data.lastName}, ${data.firstName}` } as StudentProfile;
    }
    return null;
};

export const addStudentProfile = async (instituteId: string, profile: any) => {
  const fullName = `${profile.lastName}, ${profile.firstName}`;
  await setDoc(doc(db, 'institutes', instituteId, 'studentProfiles', profile.documentId), { ...profile, fullName, linkedUserUid: null, academicStatus: 'Cursando' });
};

export const updateStudentProfile = async (instituteId: string, documentId: string, data: any) => {
  if (data.firstName && data.lastName) {
      data.fullName = `${data.lastName}, ${data.firstName}`;
  }
  await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), data);
};

export const deleteStudentProfile = async (instituteId: string, documentId: string) => {
  await deleteDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId));
};

export const bulkAddStudents = async (instituteId: string, students: any[]) => {
    const batch = writeBatch(db);
    students.forEach(s => {
        const ref = doc(db, 'institutes', instituteId, 'studentProfiles', s.documentId);
        const fullName = `${s.lastName}, ${s.firstName}`;
        batch.set(ref, { ...s, fullName, linkedUserUid: null, academicStatus: 'Cursando' });
    });
    await batch.commit();
};

export const linkUserToProfile = async (uid: string, documentId: string, email: string) => {
    const institutes = await getInstitutes();
    for (const inst of institutes) {
        // Try staff
        const staffRef = doc(db, 'institutes', inst.id, 'staffProfiles', documentId);
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists() && staffSnap.data().email === email) {
            const staffData = staffSnap.data() as StaffProfile;
            await updateDoc(staffRef, { linkedUserUid: uid });
            await updateDoc(doc(db, 'users', uid), { 
                instituteId: inst.id, 
                documentId, 
                role: staffData.role, 
                roleId: staffData.roleId,
                displayName: staffData.displayName
            });
            return { role: staffData.role, instituteName: inst.name };
        }
        // Try student
        const studentRef = doc(db, 'institutes', inst.id, 'studentProfiles', documentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists() && studentSnap.data().email === email) {
            const studentData = studentSnap.data() as StudentProfile;
            await updateDoc(studentRef, { linkedUserUid: uid });
            await updateDoc(doc(db, 'users', uid), { 
                instituteId: inst.id, 
                documentId, 
                role: 'Student', 
                roleId: 'student',
                displayName: studentData.fullName
            });
            return { role: 'Estudiante', instituteName: inst.name };
        }
    }
    throw new Error("No se encontró un perfil que coincida con los datos proporcionados.");
};

// --- ACADEMIC RECORDS & GRADES ---

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: string): Promise<AcademicRecord | null> => {
    const id = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicRecords', id));
    return snap.exists() ? snap.data() as AcademicRecord : null;
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: string): Promise<AcademicRecord[]> => {
    const q = query(getSubCollectionRef(instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AcademicRecord);
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const batch = writeBatch(db);
    records.forEach(r => {
        batch.set(doc(db, 'institutes', instituteId, 'academicRecords', r.id), r);
    });
    await batch.commit();
};

export const addManualEvaluationToRecord = async (instituteId: string, unitId: string, year: string, period: string, evaluation: any) => {
    const q = query(getSubCollectionRef(instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    const evalId = doc(collection(db, 'idGen')).id;
    const newEval = { ...evaluation, id: evalId, createdAt: Timestamp.now() };
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { [`evaluations.${evaluation.indicatorId}`]: arrayUnion(newEval) });
    });
    await batch.commit();
};

export const deleteManualEvaluationFromRecord = async (instituteId: string, unitId: string, year: string, period: string, indicatorId: string, evaluationId: string) => {
    const q = query(getSubCollectionRef(instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        const data = d.data() as AcademicRecord;
        const evals = (data.evaluations[indicatorId] || []).filter(e => e.id !== evaluationId);
        batch.update(d.ref, { [`evaluations.${indicatorId}`]: evals });
    });
    await batch.commit();
};

// --- ATTENDANCE ---

export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: string): Promise<AttendanceRecord | null> => {
    const id = `${unitId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', id));
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, record: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', record.id), record);
};

export const getAcademicPeriods = async (instituteId: string, year: string) => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`));
    return snap.exists() ? snap.data() : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`), data);
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    // This would normally fetch from the generated schedules. For now, return a default.
    return ['Lunes', 'Miércoles', 'Viernes'];
};

// --- ASIGNACIONES ---

export const getAssignments = async (instituteId: string, year: string, programId: string): Promise<any> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`));
    return snap.exists() ? snap.data() : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string): Promise<any> => {
    const q = query(getSubCollectionRef(instituteId, 'assignments'));
    const snapshot = await getDocs(q);
    const yearPrefix = `${year}_`;
    const result = { 'MAR-JUL': {}, 'AGO-DIC': {} };
    snapshot.docs.forEach(doc => {
        if (doc.id.startsWith(yearPrefix)) {
            const data = doc.data();
            Object.assign(result['MAR-JUL'], data['MAR-JUL'] || {});
            Object.assign(result['AGO-DIC'], data['AGO-DIC'] || {});
        }
    });
    return result;
};

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: string, unitId: string, teacherId: string | null) => {
    const ref = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    await setDoc(ref, { [period]: { [unitId]: teacherId } }, { merge: true });
};

// --- MATRICULA ---

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const q = query(getSubCollectionRef(instituteId, 'matriculations'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: string): Promise<StudentProfile[]> => {
    const q = query(getSubCollectionRef(instituteId, 'matriculations'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snapshot = await getDocs(q);
    const studentIds = snapshot.docs.map(d => d.data().studentId);
    if (studentIds.length === 0) return [];
    
    // Batch fetch student profiles
    const profiles: StudentProfile[] = [];
    for (const id of studentIds) {
        const p = await getStudentProfile(instituteId, id);
        if (p) profiles.push(p);
    }
    return profiles;
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<Unit[]> => {
    const q = query(getSubCollectionRef(instituteId, 'matriculations'), where('studentId', '==', studentId), where('status', '==', 'cursando'));
    const snapshot = await getDocs(q);
    const unitIds = snapshot.docs.map(d => d.data().unitId);
    if (unitIds.length === 0) return [];
    
    const units: Unit[] = [];
    for (const id of unitIds) {
        const u = await getUnit(instituteId, id);
        if (u) units.push(u);
    }
    return units;
};

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(unit => {
        const id = `${unit.id}_${studentId}_${year}_${unit.period}`;
        const ref = doc(db, 'institutes', instituteId, 'matriculations', id);
        batch.set(ref, {
            studentId,
            unitId: unit.id,
            programId: unit.programId,
            year,
            period: unit.period,
            semester: unit.semester,
            moduleId: unit.moduleId,
            status: 'cursando',
            createdAt: Timestamp.now()
        });
    });
    await batch.commit();
};

// --- PAYMENTS ---

export const getPaymentConcepts = async (instituteId: string, onlyActive = false): Promise<PaymentConcept[]> => {
    let q = getSubCollectionRef(instituteId, 'paymentConcepts');
    const snapshot = await getDocs(onlyActive ? query(q, where('isActive', '==', true)) : q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
};

export const addPaymentConcept = async (instituteId: string, concept: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'paymentConcepts'), { ...concept, createdAt: Timestamp.now() });
};

export const updatePaymentConcept = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id), data);
};

export const deletePaymentConcept = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'paymentConcepts', id));
};

export const registerPayment = async (instituteId: string, payment: any, voucherFile?: File, options?: { autoApprove?: boolean, receiptNumber?: string }) => {
    let voucherUrl = '';
    if (voucherFile) {
        voucherUrl = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/payments/${Date.now()}_voucher`);
    }
    const paymentData: any = {
        ...payment,
        voucherUrl,
        status: options?.autoApprove ? 'Aprobado' : 'Pendiente',
        paymentDate: Timestamp.fromDate(payment.paymentDate),
        createdAt: Timestamp.now(),
        ...(options?.autoApprove && { processedAt: Timestamp.now(), receiptNumber: options.receiptNumber })
    };
    await addDoc(getSubCollectionRef(instituteId, 'payments'), paymentData);
};

export const getPaymentsByStatus = async (instituteId: string, status: string, options: { lastVisible?: any } = {}) => {
    let q = query(getSubCollectionRef(instituteId, 'payments'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(20));
    if (options.lastVisible) q = query(q, startAfter(options.lastVisible));
    const snapshot = await getDocs(q);
    return {
        payments: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)),
        newLastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
};

export const updatePaymentStatus = async (instituteId: string, id: string, status: string, data: any = {}) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'payments', id), { 
        status, 
        processedAt: Timestamp.now(),
        ...data 
    });
};

export const getStudentPaymentsByStatus = async (instituteId: string, studentId: string, status: string): Promise<Payment[]> => {
    const q = query(getSubCollectionRef(instituteId, 'payments'), where('payerId', '==', studentId), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, start: Date, end: Date): Promise<Payment[]> => {
    const q = query(getSubCollectionRef(instituteId, 'payments'), where('status', '==', 'Aprobado'), where('paymentDate', '>=', Timestamp.fromDate(start)), where('paymentDate', '<=', Timestamp.fromDate(end)));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

// --- SUPPLIES ---

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'supplyCatalog'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
};

export const addSupplyItem = async (instituteId: string, item: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'supplyCatalog'), { ...item, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id));
};

export const updateStock = async (instituteId: string, itemId: string, change: number, notes: string) => {
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    const historyRef = collection(itemRef, 'history');
    const user = auth.currentUser;
    
    await runTransaction(db, async (transaction) => {
        const itemSnap = await transaction.get(itemRef);
        const newStock = (itemSnap.data()?.stock || 0) + change;
        transaction.update(itemRef, { stock: newStock });
        transaction.add(historyRef, {
            timestamp: Timestamp.now(),
            userId: user?.uid,
            userName: user?.displayName || 'Admin',
            change,
            newStock,
            notes
        });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string) => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'history'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createSupplyRequest = async (instituteId: string, request: any) => {
    const count = (await getCountFromServer(getSubCollectionRef(instituteId, 'supplyRequests'))).data().count;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(getSubCollectionRef(instituteId, 'supplyRequests'), {
        ...request,
        code,
        status: 'Pendiente',
        createdAt: Timestamp.now()
    });
};

export const createDirectApprovedRequest = async (instituteId: string, request: any) => {
    const count = (await getCountFromServer(getSubCollectionRef(instituteId, 'supplyRequests'))).data().count;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(getSubCollectionRef(instituteId, 'supplyRequests'), {
        ...request,
        code,
        status: 'Aprobado',
        createdAt: Timestamp.now()
    });
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: string): Promise<SupplyRequest[]> => {
    const q = query(getSubCollectionRef(instituteId, 'supplyRequests'), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

export const updateSupplyRequest = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), data);
};

export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: string, data: any = {}) => {
    if (status === 'Entregado') {
        const reqSnap = await getDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id));
        const items = reqSnap.data()?.items || [];
        for (const item of items) {
            await updateStock(instituteId, item.itemId, -(item.approvedQuantity || item.requestedQuantity), `Entrega Pedido ${reqSnap.data()?.code}`);
        }
    } else if (status === 'Anulado') {
        const reqSnap = await getDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id));
        if (reqSnap.data()?.status === 'Entregado') {
            const items = reqSnap.data()?.items || [];
            for (const item of items) {
                await updateStock(instituteId, item.itemId, (item.approvedQuantity || item.requestedQuantity), `Anulación Pedido ${reqSnap.data()?.code}`);
            }
        }
    }
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), { 
        status, 
        processedAt: Timestamp.now(),
        ...data 
    });
};

export const getRequestsForUser = async (instituteId: string, uid: string): Promise<SupplyRequest[]> => {
    const q = query(getSubCollectionRef(instituteId, 'supplyRequests'), where('requesterAuthUid', '==', uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

// --- ACCESS CONTROL ---

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'accessPoints'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const getAccessPoint = async (instituteId: string, id: string): Promise<AccessPoint | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', id));
    return snap.exists() ? snap.data() as AccessPoint : null;
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

export const listenToAllAccessLogs = (instituteId: string, callback: (logs: any[]) => void) => {
    const q = query(collection(db, 'institutes', instituteId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const listenToAccessLogsForUser = (instituteId: string, documentId: string, callback: (logs: any[]) => void) => {
    const q = query(collection(db, 'institutes', instituteId, 'accessLogs'), where('userDocumentId', '==', documentId), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const listenToAccessLogsForPoint = (instituteId: string, pointId: string, callback: (logs: any[]) => void) => {
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints', pointId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- INFRASTRUCTURE ---

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'buildings'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
};

export const addBuilding = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'buildings'), data);
};

export const updateBuilding = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', id), data);
};

export const deleteBuilding = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', id));
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snapshot = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Environment));
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    // This is more complex since environments are subcollections. 
    // In a real app, a collectionGroup query or a flat list might be used.
    const buildings = await getBuildings(instituteId);
    let allEnvs: Environment[] = [];
    for (const b of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        allEnvs = [...allEnvs, ...envs];
    }
    return allEnvs;
};

export const addEnvironment = async (instituteId: string, buildingId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), data);
};

export const updateEnvironment = async (instituteId: string, buildingId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id), data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id));
};

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const snapshot = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, typeId: string, data: any): Promise<string> => {
    const batch = writeBatch(db);
    const assetTypeRef = doc(db, 'institutes', instituteId, 'assetCatalog', typeId);
    const assetTypeSnap = await getDoc(assetTypeRef);
    const newNum = (assetTypeSnap.data()?.lastAssignedNumber || 0) + 1;
    const code = `${assetTypeSnap.data()?.patrimonialCode}-${String(newNum).padStart(4, '0')}`;
    
    const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    batch.set(assetRef, { 
        ...data, 
        codeOrSerial: code, 
        name: assetTypeSnap.data()?.name,
        type: assetTypeSnap.data()?.class,
        createdAt: Timestamp.now(),
        instituteId,
        buildingId,
        environmentId
    });
    batch.update(assetTypeRef, { lastAssignedNumber: newNum });
    await batch.commit();
    return code;
};

export const updateAsset = async (instituteId: string, buildingId: string, environmentId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', id), data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, environmentId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', id));
};

export const getAssetHistory = async (instituteId: string, buildingId: string, environmentId: string, id: string) => {
    // Placeholder
    return [];
};

export const getAssetTypes = async (instituteId: string, options: any = {}) => {
    let q = query(getSubCollectionRef(instituteId, 'assetCatalog'), orderBy('name'), limit(options.limit || 50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
};

export const getAssetTypeById = async (instituteId: string, id: string) => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetCatalog', id));
    return snap.exists() ? snap.data() as AssetType : null;
};

export const bulkAddAssetTypes = async (instituteId: string, types: any[]) => {
    const batch = writeBatch(db);
    types.forEach(t => {
        batch.set(doc(getSubCollectionRef(instituteId, 'assetCatalog')), { ...t, lastAssignedNumber: 0 });
    });
    await batch.commit();
};

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetCatalog', id));
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    // Placeholder - implementation would use collectionGroup or denormalized list
    return [];
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        batch.update(doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id), { status });
    });
    await batch.commit();
};

export const moveAssets = async (instituteId: string, assets: Asset[], targetEnv: Environment) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const oldRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        const newRef = doc(db, 'institutes', instituteId, 'buildings', targetEnv.buildingId, 'environments', targetEnv.id, 'assets', a.id);
        batch.set(newRef, { ...a, buildingId: targetEnv.buildingId, environmentId: targetEnv.id });
        batch.delete(oldRef);
    });
    await batch.commit();
};

// --- SCHEDULES & PLANNING ---

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const q = query(getSubCollectionRef(instituteId, 'scheduleTemplates'), where('isDefault', '==', true), limit(1));
    const snap = await getDocs(q);
    return !snap.empty ? ({ id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate) : null;
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'scheduleTemplates'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
};

export const addScheduleTemplate = async (instituteId: string, template: any) => {
    const docRef = await addDoc(getSubCollectionRef(instituteId, 'scheduleTemplates'), template);
    return docRef.id;
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string) => {
    const templates = await getScheduleTemplates(instituteId);
    const batch = writeBatch(db);
    templates.forEach(t => {
        batch.update(doc(db, 'institutes', instituteId, 'scheduleTemplates', t.id), { isDefault: t.id === id });
    });
    await batch.commit();
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, data: any) => {
    await setDoc(doc(db, 'institutes', instituteId, 'schedules', `${year}_${programId}_S${semester}`), data);
};

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<any> => {
    const q = query(getSubCollectionRef(instituteId, 'schedules'));
    const snap = await getDocs(q);
    let result = {};
    snap.docs.forEach(doc => {
        if (doc.id.startsWith(year) && doc.id.endsWith(`_S${semester}`)) {
            Object.assign(result, doc.data());
        }
    });
    return result;
};

// --- NON-TEACHING ACTIVITIES ---

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'nonTeachingActivities'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const addNonTeachingActivity = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'nonTeachingActivities'), data);
};

export const updateNonTeachingActivity = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: string) => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where('teacherId', '==', teacherId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string) => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string) => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where('activityId', '==', activityId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: string, assignments: any[]) => {
    const batch = writeBatch(db);
    // Delete old ones first
    const old = await getNonTeachingAssignments(instituteId, teacherId, year, period);
    old.forEach(o => batch.delete(doc(db, 'institutes', instituteId, 'nonTeachingAssignments', o.id)));
    // Add new ones
    assignments.forEach(a => {
        const ref = doc(getSubCollectionRef(instituteId, 'nonTeachingAssignments'));
        batch.set(ref, a);
    });
    await batch.commit();
};

// --- ACHIEVEMENT INDICATORS ---

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'units', unitId, 'indicators'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'units', unitId, 'indicators'), data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'units', unitId, 'indicators', id));
};

// --- LOGIN IMAGES ---

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snapshot = await getDocs(query(collection(db, 'login_images'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string) => {
    const url = await uploadFileAndGetURL(file, `login_images/${Date.now()}_${name}`);
    await addDoc(collection(db, 'login_images'), { name, url, createdAt: Timestamp.now() });
};

export const deleteLoginImage = async (image: LoginImage) => {
    await deleteDoc(doc(db, 'login_images', image.id));
    await deleteObject(ref(storage, image.url));
};

export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const snap = await getDoc(doc(db, 'config', 'login_design'));
    return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: LoginDesign) => {
    await setDoc(doc(db, 'config', 'login_design'), data);
};

export const setActiveLoginImage = async (url: string) => {
    await setDoc(doc(db, 'config', 'login_design'), { imageUrl: url }, { merge: true });
};

export const getInstituteLoginPageImage = async () => {
    const design = await getLoginDesignSettings();
    return design?.imageUrl || null;
};

// --- NEWS & GALLERY ---

export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const q = query(getSubCollectionRef(instituteId, 'news'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};

export const addNews = async (instituteId: string, data: any, imageFile?: File) => {
    if (imageFile) {
        data.imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${Date.now()}`);
    }
    await addDoc(getSubCollectionRef(instituteId, 'news'), { ...data, createdAt: Timestamp.now() });
};

export const updateNews = async (instituteId: string, id: string, data: any, imageFile?: File) => {
    if (imageFile) {
        data.imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${Date.now()}`);
    }
    await updateDoc(doc(db, 'institutes', instituteId, 'news', id), data);
};

export const deleteNews = async (instituteId: string, news: News) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', news.id));
    if (news.imageUrl) await deleteObject(ref(storage, news.imageUrl));
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const q = query(getSubCollectionRef(instituteId, 'albums'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Album) : null;
};

export const addAlbum = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const updateAlbum = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]) => {
    const batch = writeBatch(db);
    const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
    let coverUrl = '';
    
    for (const file of files) {
        const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/albums/${albumId}/${Date.now()}_${file.name}`);
        if (!coverUrl) coverUrl = url;
        const photoRef = doc(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'));
        batch.set(photoRef, { url, createdAt: Timestamp.now() });
    }
    
    batch.update(albumRef, { coverImageUrl: coverUrl });
    await batch.commit();
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
    await deleteObject(ref(storage, photo.url));
};

// --- EFSRT (EXPERIENCIAS FORMATIVAS) ---

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const q = query(efsrtCol, where("studentId", "==", studentId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const q = query(efsrtCol, where("supervisorId", "==", supervisorId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: Omit<EFSRTAssignment, 'id' | 'status' | 'createdAt' | 'visits' | 'studentReportUrl' | 'supervisorReportUrl' | 'grade' | 'observations'>): Promise<void> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const newAssignment: Omit<EFSRTAssignment, 'id'> = {
        ...data,
        status: 'Programado',
        visits: [],
        createdAt: Timestamp.now(),
    };
    await addDoc(efsrtCol, newAssignment);
};

export const updateEFSRTStatus = async (instituteId: string, assignmentId: string, status: EFSRTStatus): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(docRef, { status });
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const newVisit: EFSRTVisit = {
        ...visit,
        id: doc(collection(db, 'idGenerator')).id,
    };
    await updateDoc(docRef, {
        visits: arrayUnion(newVisit),
        status: 'En Curso'
    });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File): Promise<void> => {
    const storagePath = `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`;
    const downloadURL = await uploadFileAndGetURL(file, storagePath);
    
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const updateField = type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl';
    
    await updateDoc(docRef, { 
        [updateField]: downloadURL,
        ...(type === 'student' && { status: 'Por Evaluar' })
    });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const status = grade >= 13 ? 'Aprobado' : 'Desaprobado';
    await updateDoc(docRef, { grade, observations, status });
};

// --- EGRESO LOGIC ---

export const checkEgresoEligibility = async (instituteId: string, studentId: string): Promise<{ eligible: boolean; pendingUnits: string[]; pendingEFSRT: string[] }> => {
    const [studentData, matriculations, efsrtAssignments, allUnits] = await Promise.all([
        getStudentProfile(instituteId, studentId),
        getMatriculationsForStudent(instituteId, studentId),
        getEFSRTAssignmentsForStudent(instituteId, studentId),
        getUnits(instituteId)
    ]);

    if (!studentData) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };

    const programs = await getPrograms(instituteId);
    const programData = programs.find(p => p.id === studentData.programId);
    if (!programData) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };

    const programUnits = allUnits.filter(u => u.programId === programData.id);
    const approvedUnitIds = new Set(matriculations.filter(m => m.status === 'aprobado').map(m => m.unitId));
    
    const pendingUnits = programUnits
        .filter(u => !approvedUnitIds.has(u.id))
        .map(u => u.name);

    const approvedModuleCodes = new Set(efsrtAssignments.filter(a => a.status === 'Aprobado').map(a => a.moduleId));
    const pendingEFSRT = programData.modules
        .filter(m => !approvedModuleCodes.has(m.code))
        .map(m => m.name);

    const eligible = pendingUnits.length === 0 && pendingEFSRT.length === 0;

    return { eligible, pendingUnits, pendingEFSRT };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, graduationYear: string): Promise<void> => {
    const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    await updateDoc(studentRef, { 
        academicStatus: 'Egresado',
        graduationYear
    });
    
    const profileSnap = await getDoc(studentRef);
    const linkedUid = profileSnap.data()?.linkedUserUid;
    if (linkedUid) {
        await updateDoc(doc(db, 'users', linkedUid), { academicStatus: 'Egresado' });
    }
};
