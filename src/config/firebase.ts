
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot, increment, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, Delivery, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission, AIConfig, StudentEgresoAudit, SocialLinks, CompanyProfile, JobOffer, JobApplication, Plan, InstituteMetrics, DailyActivity } from '@/types';

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

export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

const getSubCollectionRef = (instituteId: string, name: string) => collection(db, 'institutes', instituteId, name);

// --- Roles y Permisos ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'roles'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, data: Omit<Role, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'roles'), data);
};

export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', roleId), data);
};

export const deleteRole = async (instituteId: string, roleId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

// --- Observability Functions ---

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
        'student': 'student',
        'teacher': 'teacher',
        'admin': 'admin',
        'coordinator': 'coordinator',
        'graduate': 'graduate',
        'company': 'company'
    };
    
    const roleField = fieldMap[roleId.toLowerCase()] || 'other';

    await setDoc(activityRef, {
        total: increment(1),
        [roleField]: increment(1),
        lastUpdate: Timestamp.now()
    }, { merge: true });
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

    return {
        totalStudents: studentsSnap.data().count,
        totalStaff: staffSnap.data().count,
        totalUnits: unitsSnap.data().count,
        activeToday,
        totalPayments: paymentsSnap.size,
        totalRevenue
    };
};

// --- Plans Functions ---

export const getPlans = async (): Promise<Plan[]> => {
    const plansCol = collection(db, 'config', 'platform', 'plans');
    const q = query(plansCol, orderBy("price", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
};

export const addPlan = async (data: Omit<Plan, 'id' | 'createdAt'>): Promise<string> => {
    const plansCol = collection(db, 'config', 'platform', 'plans');
    const docRef = await addDoc(plansCol, {
        ...data,
        createdAt: Timestamp.now()
    });
    return docRef.id;
};

export const updatePlan = async (planId: string, data: Partial<Plan>): Promise<void> => {
    const planRef = doc(db, 'config', 'platform', 'plans', planId);
    await updateDoc(planRef, data);
};

export const deletePlan = async (planId: string): Promise<void> => {
    const planRef = doc(db, 'config', 'platform', 'plans', planId);
    await deleteDoc(planRef);
};

export const getAIConfig = async (): Promise<AIConfig | null> => {
    const docRef = doc(db, 'config', 'aiConfig');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as AIConfig : null;
};

export const saveAIConfig = async (config: Partial<AIConfig>): Promise<void> => {
    const docRef = doc(db, 'config', 'aiConfig');
    await setDoc(docRef, { ...config, lastUpdated: Timestamp.now() }, { merge: true });
};

export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: UserRole, instituteId: string | null) => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { 
      uid: user.uid,
      role, 
      email: user.email, 
      displayName: user.displayName, 
      photoURL: user.photoURL,
      instituteId: instituteId || null,
      documentId: '', 
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user data to Firestore:", error);
    throw error;
  }
};

export const updateUserProfile = async (data: { 
  displayName?: string | null; 
  photoURL?: string | null, 
  documentId?: string | null, 
  bio?: string, 
  socialLinks?: SocialLinks, 
  coverImageUrl?: string,
  skills?: string[],
  cvUrl?: string
}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in.");
    try {
        const authUpdates: { displayName?: string | null; photoURL?: string | null } = {};
        if (data.displayName !== undefined) authUpdates.displayName = data.displayName;
        if (data.photoURL !== undefined) authUpdates.photoURL = data.photoURL;

        if (Object.keys(authUpdates).length > 0) {
            await firebaseUpdateProfile(user, authUpdates);
        }

        const firestoreUpdates: { [key: string]: any } = {};
        if (data.displayName !== undefined) firestoreUpdates.displayName = data.displayName;
        if (data.photoURL !== undefined) firestoreUpdates.photoURL = data.photoURL;
        if (data.documentId !== undefined) firestoreUpdates.documentId = data.documentId;
        if (data.bio !== undefined) firestoreUpdates.bio = data.bio;
        if (data.socialLinks !== undefined) firestoreUpdates.socialLinks = data.socialLinks;
        if (data.coverImageUrl !== undefined) firestoreUpdates.coverImageUrl = data.coverImageUrl;
        if (data.skills !== undefined) firestoreUpdates.skills = data.skills;
        if (data.cvUrl !== undefined) firestoreUpdates.cvUrl = data.cvUrl;
        
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            const userData = userSnap.data() as AppUser;

            await updateDoc(userDocRef, firestoreUpdates);

            if (userData.instituteId && userData.documentId) {
                const profileCollection = (userData.role === 'Student' || userData.role === 'Graduate') ? 'studentProfiles' : 'staffProfiles';
                const profileRef = doc(db, 'institutes', userData.instituteId, profileCollection, userData.documentId);
                await updateDoc(profileRef, firestoreUpdates);
            }
        }
    } catch (error) {
        console.error(`Error updating user profile for ${user.uid}:`, error);
        throw error;
    }
};

export const addInstitute = async (instituteId: string, data: Omit<Institute, 'id' | 'logoUrl'>, logoFile?: File): Promise<void> => {
    const instituteRef = doc(db, 'institutes', instituteId);
    const docSnap = await getDoc(instituteRef);
    if (docSnap.exists()) {
        throw new Error(`Institute with ID "${instituteId}" already exists.`);
    }

    let logoUrl = '';
    if (logoFile) {
        const storagePath = `institutes/${instituteId}/logo`;
        logoUrl = await uploadFileAndGetURL(logoFile, storagePath);
    }

    await setDoc(instituteRef, { ...data, logoUrl });

    const rolesCol = collection(db, 'institutes', instituteId, 'roles');
    const defaultRoles = [
        { id: 'student', name: 'Estudiante', description: 'Acceso estándar para alumnos matriculados.', permissions: { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true, 'student:jobs:view': true, 'student:jobs:apply': true, 'user:supplies:request': true, 'user:access:view:own': true, 'planning:schedule:view:own': true } },
        { id: 'graduate', name: 'Egresado', description: 'Acceso para ex-alumnos con enfoque en bolsa laboral.', permissions: { 'graduate:jobs:view': true, 'graduate:profile:view': true, 'student:grades:view': true, 'student:efsrt:view': true, 'student:payments:manage': true, 'user:access:view:own': true } },
        { id: 'teacher', name: 'Docente', description: 'Acceso para el personal de enseñanza y supervisión.', permissions: { 'teacher:unit:view': true, 'teacher:efsrt:supervise': true, 'user:supplies:request': true, 'user:access:view:own': true, 'planning:schedule:view:own': true } },
        { id: 'company', name: 'Empresa', description: 'Acceso para socios estratégicos de la bolsa laboral.', permissions: { 'company:jobs:manage': true, 'company:applicants:view': true } },
        { id: 'admin', name: 'Administrador', description: 'Control total de la gestión del instituto.', permissions: { 'admin:institute:manage': true, 'admin:fees:manage': true, 'admin:payments:validate': true, 'admin:access-control:manage': true, 'admin:attendance:report': true, 'admin:infra:manage': true, 'admin:supplies:manage': true, 'admin:deliveries:view': true, 'admin:companies:manage': true, 'admin:jobs:monitor': true, 'academic:program:manage': true, 'academic:unit:manage': true, 'academic:unit:manage:own': true, 'academic:assignment:manage': true, 'academic:teacher:view': true, 'academic:workload:view': true, 'academic:workload:monitor': true, 'academic:enrollment:manage': true, 'academic:periods:manage': true, 'academic:load:view': true, 'academic:efsrt:manage': true, 'planning:schedule:manage': true, 'planning:environment:manage': true, 'planning:schedule:view:own': true, 'users:staff:manage': true, 'users:student:manage': true } }
    ];

    const batch = writeBatch(db);
    defaultRoles.forEach(role => {
        const { id, ...roleData } = role;
        batch.set(doc(rolesCol, id), roleData);
    });
    await batch.commit();
};

export const getInstitutes = async (): Promise<Institute[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes'), orderBy("name")));
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Institute));
};

export const getInstitute = async (instituteId: string): Promise<Institute | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Institute : null;
}

export const updateInstitute = async (instituteId: string, data: Partial<Omit<Institute, 'id' | 'logoUrl'>>, logoFile?: File): Promise<void> => {
    const updateData: { [key: string]: any } = { ...data };
    if (logoFile) {
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/logo`);
    }
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

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snapshot = await getDocs(query(collection(db, 'config', 'loginDesign', 'images'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string): Promise<void> => {
    const newImageId = doc(collection(db, 'idGenerator')).id;
    const downloadURL = await uploadFileAndGetURL(file, `loginImages/${newImageId}`);
    await setDoc(doc(db, 'config/loginDesign/images', newImageId), { name, url: downloadURL, createdAt: Timestamp.now() });
};

export const setActiveLoginImage = async (imageUrl: string): Promise<void> => {
    await saveLoginDesignSettings({ imageUrl });
};

export const deleteLoginImage = async (image: LoginImage): Promise<void> => {
    await deleteDoc(doc(db, 'config/loginDesign/images', image.id));
    try { await deleteObject(ref(firebaseStorage, `loginImages/${image.id}`)); } catch (e) {}
};

export const getAllUsersPaginated = async (options: { instituteId?: string; limit: number; startAfter?: DocumentSnapshot | null; }): Promise<{ users: AppUser[], lastVisible: DocumentSnapshot | null }> => {
    const q_parts: any[] = [];
    if (options.instituteId && options.instituteId !== 'all') q_parts.push(where("instituteId", "==", options.instituteId));
    q_parts.push(orderBy("displayName"));
    if (options.startAfter) q_parts.push(startAfter(options.startAfter));
    q_parts.push(limit(options.limit));
    const snapshot = await getDocs(query(collection(db, 'users'), ...q_parts));
    const users = snapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { users, lastVisible };
};

export const getTotalUsersCount = async (instituteId?: string): Promise<number> => {
    const snapshot = await getDocs(instituteId && instituteId !== 'all' ? query(collection(db, 'users'), where("instituteId", "==", instituteId)) : collection(db, 'users'));
    return snapshot.size;
}

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'programs'), { ...data, modules: data.modules.map(m => ({ ...m })) });
}

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'programs'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
}

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Omit<Program, 'id'>>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', programId), { ...data, ...(data.modules && { modules: data.modules.map(m => ({...m})) }) });
}

export const deleteProgram = async (instituteId: string, programId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', programId));
}

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'imageUrl'>) => {
    const newDocRef = await addDoc(getSubCollectionRef(instituteId, 'unidadesDidacticas'), { ...data, totalHours: (data.theoreticalHours || 0) + (data.practicalHours || 0) });
    return newDocRef.id;
}

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Unit : null;
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'unidadesDidacticas'), orderBy("code")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), data);
}

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File): Promise<void> => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/coverImage`);
    await updateUnitImage(instituteId, unitId, url);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId));
}

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    for (const unitData of units) {
        await addDoc(getSubCollectionRef(instituteId, 'unidadesDidacticas'), { ...unitData, totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0) });
    }
}

export const bulkDeleteUnits = async (instituteId: string, unitIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    unitIds.forEach(id => { batch.delete(doc(getSubCollectionRef(instituteId, 'unidadesDidacticas'), id)); });
    await batch.commit();
}

export const duplicateUnit = async (instituteId: string, unitId: string): Promise<void> => {
    const original = await getUnit(instituteId, unitId);
    if (!original) throw new Error("Unidad no encontrada.");
    const { id, name, code, ...rest } = original;
    await addUnit(instituteId, { ...rest, name: `${name} (Copia)`, code: `${code}-COPY` } as any);
};

export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const [allStaff, allPrograms] = await Promise.all([getStaffProfiles(instituteId), getPrograms(instituteId)]);
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

export const getAssignments = async (instituteId: string, year: string, programId: string): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
  const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`));
  return docSnap.exists() ? docSnap.data() as any : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
    const q = query(getSubCollectionRef(instituteId, 'assignments'), where('__name__', '>=', `${year}_`), where('__name__', '<', `${year}_\uf8ff`));
    const querySnapshot = await getDocs(q);
    const all: any = { 'MAR-JUL': {}, 'AGO-DIC': {} };
    querySnapshot.forEach(doc => {
        const data = doc.data() as any;
        if (data['MAR-JUL']) Object.assign(all['MAR-JUL'], data['MAR-JUL']);
        if (data['AGO-DIC']) Object.assign(all['AGO-DIC'], data['AGO-DIC']);
    });
    return all;
};

export const saveSingleAssignment = async (instituteId: string, year: string, programId: string, period: UnitPeriod, unitId: string, teacherId: string | null): Promise<void> => {
    const assignmentDocRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    await setDoc(assignmentDocRef, { [period]: { [unitId]: teacherId || deleteField() } }, { merge: true });
};

export const addStaffProfile = async (instituteId: string, data: Omit<StaffProfile, 'linkedUserUid'>) => {
    const profileRef = doc(db, 'institutes', instituteId, 'staffProfiles', data.documentId);
    if ((await getDoc(profileRef)).exists()) throw new Error(`Documento ${data.documentId} ya existe.`);
    await setDoc(profileRef, { ...data, instituteId, linkedUserUid: null });
};

export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'staffProfiles'), orderBy("displayName")));
    const programs = await getPrograms(instituteId);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    return snapshot.docs.map(doc => ({ ...doc.data(), documentId: doc.id, programName: programMap.get(doc.data().programId) || 'N/A' } as any));
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
    return docSnap.exists() ? docSnap.data() as StaffProfile : null;
}

export const bulkAddStaff = async (instituteId: string, list: Omit<StaffProfile, 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    list.forEach(data => { batch.set(doc(db, 'institutes', instituteId, 'staffProfiles', data.documentId), { ...data, instituteId }); });
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, documentIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    documentIds.forEach(id => { batch.delete(doc(db, 'institutes', instituteId, 'staffProfiles', id)); });
    await batch.commit();
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
    const staffRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    await updateDoc(staffRef, data);
    const profileData = (await getDoc(staffRef)).data();
    if (profileData?.linkedUserUid && data.role) {
        await updateDoc(doc(db, 'users', profileData.linkedUserUid), { role: data.role, displayName: data.displayName });
    }
}

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'staffProfiles', documentId));
}

export const addStudentProfile = async (instituteId: string, data: Omit<StudentProfile, 'fullName' | 'linkedUserUid' | 'id'>) => {
    const profileRef = doc(db, 'institutes', instituteId, 'studentProfiles', data.documentId);
    if ((await getDoc(profileRef)).exists()) throw new Error(`Documento ${data.documentId} ya existe.`);
    await setDoc(profileRef, { ...data, instituteId, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' });
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), orderBy("lastName")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getStudentsPaginated = async (options: { instituteId: string; programId?: string; admissionYear?: string; turno?: UnitTurno; semester?: number; limitCount: number; startAfterDoc?: DocumentSnapshot | null; excludeEgresados?: boolean; }): Promise<{ students: StudentProfile[], lastVisible: DocumentSnapshot | null }> => {
    const q_parts: any[] = [];
    if (options.programId && options.programId !== 'all') q_parts.push(where("programId", "==", options.programId));
    if (options.admissionYear && options.admissionYear !== 'all') q_parts.push(where("admissionYear", "==", options.admissionYear));
    if (options.turno && options.turno !== 'all') q_parts.push(where("turno", "==", options.turno));
    q_parts.push(orderBy("lastName"));
    if (options.startAfterDoc) q_parts.push(startAfter(options.startAfterDoc));
    q_parts.push(limit(options.limitCount * 2)); 
    const snapshot = await getDocs(query(getSubCollectionRef(options.instituteId, 'studentProfiles'), ...q_parts));
    let students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
    if (options.excludeEgresados) students = students.filter(s => s.academicStatus !== 'Egresado');
    if (options.semester) students = students.filter(p => (p.currentSemester || 1) === options.semester);
    return { students: students.slice(0, options.limitCount), lastVisible: snapshot.docs[snapshot.docs.length - 1] || null };
};

export const getStudentProfile = async (instituteId: string, studentId: string): Promise<StudentProfile | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'studentProfiles', studentId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as StudentProfile : null;
}

export const updateStudentProfile = async (instituteId: string, documentId: string, data: Partial<Omit<StudentProfile, 'id' | 'documentId' | 'photoURL'>>) => {
    const updateData: any = { ...data };
    if (data.firstName && data.lastName) updateData.fullName = `${data.firstName} ${data.lastName}`;
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', documentId), updateData);
}

export const deleteStudentProfile = async (instituteId: string, studentId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'studentProfiles', studentId));
}

export const bulkDeleteStudents = async (instituteId: string, documentIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    documentIds.forEach(id => { batch.delete(doc(db, 'institutes', instituteId, 'studentProfiles', id)); });
    await batch.commit();
}

export const bulkAddStudents = async (instituteId: string, list: Omit<StudentProfile, 'id' | 'fullName'| 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    list.forEach(data => { batch.set(doc(db, 'institutes', instituteId, 'studentProfiles', data.documentId), { ...data, instituteId, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null, academicStatus: 'Cursando' }); });
    await batch.commit();
};

export const bulkAddGraduates = async (instituteId: string, list: Omit<StudentProfile, 'id' | 'fullName'| 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    list.forEach(data => { batch.set(doc(db, 'institutes', instituteId, 'studentProfiles', data.documentId), { ...data, instituteId, fullName: `${data.firstName} ${data.lastName}`, linkedUserUid: null, academicStatus: 'Egresado', role: 'Graduate', roleId: 'graduate' }); });
    await batch.commit();
};

export const getGraduates = async (instituteId: string, options: { year?: string, programId?: string } = {}): Promise<StudentProfile[]> => {
    const q_parts = [where("academicStatus", "==", "Egresado")];
    if (options.year && options.year !== 'all') q_parts.push(where("graduationYear", "==", options.year));
    if (options.programId && options.programId !== 'all') q_parts.push(where("programId", "==", options.programId));
    q_parts.push(orderBy("lastName", "asc"));
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), ...q_parts));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};
    
export const linkUserToProfile = async (uid: string, documentId: string, email: string) => {
    const institutes = await getInstitutes();
    let foundProfile: any = null;
    let foundInstituteId: string | null = null;
    const searchDocId = documentId.trim();
    const searchEmail = email.toLowerCase().trim();

    for (const institute of institutes) {
        for (const col of ['staffProfiles', 'studentProfiles', 'companyProfiles']) {
            const snap = await getDoc(doc(db, 'institutes', institute.id, col, searchDocId));
            if (snap.exists() && (snap.data().email || snap.data().contactEmail)?.toLowerCase().trim() === searchEmail) {
                foundProfile = { ...snap.data(), type: col };
                foundInstituteId = institute.id;
                break;
            }
        }
        if (foundProfile) break;
    }

    if (!foundProfile) throw new Error("No matching profile found.");
    if (foundProfile.linkedUserUid) throw new Error("Profile already linked.");
    
    const userUpdate: any = { documentId: searchDocId, instituteId: foundInstituteId, displayName: foundProfile.displayName || foundProfile.name || `${foundProfile.firstName} ${foundProfile.lastName}`, role: foundProfile.role || 'Student', roleId: foundProfile.roleId || 'student' };
    if (foundProfile.programId) userUpdate.programId = foundProfile.programId;
    if (foundProfile.photoURL || foundProfile.logoUrl) userUpdate.photoURL = foundProfile.photoURL || foundProfile.logoUrl;

    await updateDoc(doc(db, 'users', uid), userUpdate);
    await updateDoc(doc(db, 'institutes', foundInstituteId!, foundProfile.type, searchDocId), { linkedUserUid: uid });
    return { role: userUpdate.role, instituteName: institutes.find(i => i.id === foundInstituteId)?.name };
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'nonTeachingActivities'), data);
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'nonTeachingActivities'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const updateNonTeachingActivity = async (instituteId: string, activityId: string, data: Partial<NonTeachingActivity>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', activityId), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, activityId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', activityId));
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("activityId", "==", activityId), where("year", "==", year));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const q = query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'nonTeachingAssignments'), where("year", "==", year)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
}

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, list: Omit<NonTeachingAssignment, 'id'>[]) => {
    const batch = writeBatch(db);
    const col = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    (await getDocs(query(col, where("teacherId", "==", teacherId), where("year", "==", year), where("period", "==", period)))).forEach(d => batch.delete(d.ref));
    list.forEach(data => { if (data.assignedHours > 0) batch.set(doc(col), data); });
    await batch.commit();
};

export const addPaymentConcept = async (instituteId: string, data: Omit<PaymentConcept, 'id' | 'createdAt'>) => {
    await addDoc(getSubCollectionRef(instituteId, 'paymentConcepts'), { ...data, createdAt: Timestamp.now() });
};

export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    const col = getSubCollectionRef(instituteId, 'paymentConcepts');
    const snapshot = await getDocs(activeOnly ? query(col, where("isActive", "==", true)) : col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept)).sort((a,b) => a.name.localeCompare(b.name));
};

export const registerPayment = async (instituteId: string, data: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>, file?: File, opt: any = {}): Promise<string> => {
    const pRef = doc(getSubCollectionRef(instituteId, 'payments'));
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instituteId}/vouchers/${pRef.id}`);
    await setDoc(pRef, { ...data, voucherUrl: url, status: opt.autoApprove ? 'Aprobado' : 'Pendiente', receiptNumber: opt.autoApprove ? opt.receiptNumber : undefined, processedAt: opt.autoApprove ? Timestamp.now() : undefined, createdAt: Timestamp.now() });
    return pRef.id;
}

export const bulkRegisterPayments = async (instituteId: string, list: any[]) => {
    const batch = writeBatch(db);
    const col = getSubCollectionRef(instituteId, 'payments');
    list.forEach(data => { batch.set(doc(col), { ...data, status: 'Aprobado', voucherUrl: '', createdAt: Timestamp.now(), processedAt: Timestamp.now() }); });
    await batch.commit();
};

export const getStudentPaymentsByStatus = async (instituteId: string, payerId: string, status: PaymentStatus): Promise<Payment[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), where("payerId", "==", payerId), where("status", "==", status)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus, opt: any = {}): Promise<any> => {
    const q_parts = [where("status", "==", status), orderBy("createdAt", "desc"), limit(20)];
    if (opt.lastVisible) q_parts.push(startAfter(opt.lastVisible));
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), ...q_parts));
    return { payments: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment)), newLastVisible: snapshot.docs[snapshot.docs.length - 1] || null };
};

export const getRecentApprovedPayments = async (instituteId: string, limitCount = 6): Promise<Payment[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), where("status", "==", "Aprobado"), orderBy("processedAt", "desc"), limit(limitCount)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, from: Date, to: Date): Promise<Payment[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'payments'), where("status", "==", "Aprobado"), where("processedAt", ">=", from), where("processedAt", "<=", to), orderBy("processedAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (instituteId: string, paymentId: string, status: PaymentStatus, extra: any = {}) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'payments', paymentId), { status, processedAt: Timestamp.now(), ...extra });
};

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'supplyCatalog'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
}

export const updateStock = async (instituteId: string, itemId: string, quantity: number, notes?: string) => {
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    await runTransaction(db, async (t) => {
        const item = await t.get(itemRef);
        const newStock = (item.data()?.stock || 0) + quantity;
        t.update(itemRef, { stock: newStock });
        t.set(doc(collection(itemRef, 'stockHistory')), { timestamp: Timestamp.now(), userId: auth.currentUser?.uid, userName: auth.currentUser?.displayName, change: quantity, newStock, notes: notes || 'Movimiento' });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'stockHistory'), orderBy("timestamp", "desc"), limit(50)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockHistoryLog));
};

export const createSupplyRequest = async (instituteId: string, data: any) => {
    const counterRef = doc(db, 'institutes', instituteId, 'counters', 'supplyRequests');
    let code = '';
    await runTransaction(db, async (t) => {
        const count = (await t.get(counterRef)).data()?.count || 0;
        const newCount = count + 1;
        t.set(counterRef, { count: newCount }, { merge: true });
        code = `PED-${new Date().getFullYear()}-${String(newCount).padStart(4, '0')}`;
        t.set(doc(getSubCollectionRef(instituteId, 'supplyRequests')), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
    });
};

export const getRequestsForUser = async (instituteId: string, uid: string): Promise<SupplyRequest[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'supplyRequests'), where("requesterAuthUid", "==", uid), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'supplyRequests'), where("status", "==", status), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

export const updateSupplyRequestStatus = async (instituteId: string, requestId: string, status: SupplyRequestStatus, extra: any = {}) => {
    const ref = doc(db, 'institutes', instituteId, 'supplyRequests', requestId);
    if (status === 'Entregado' || status === 'Anulado') {
        await runTransaction(db, async (t) => {
            const data = (await t.get(ref)).data() as SupplyRequest;
            for (const item of data.items) {
                const iRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const q = item.approvedQuantity ?? item.requestedQuantity;
                const change = status === 'Entregado' ? -q : q;
                const newStock = ((await t.get(iRef)).data()?.stock || 0) + change;
                t.update(iRef, { stock: newStock });
                t.set(doc(collection(iRef, 'stockHistory')), { timestamp: Timestamp.now(), userId: auth.currentUser?.uid, userName: auth.currentUser?.displayName, change, newStock, notes: `${status} pedido ${data.code}` });
            }
            t.update(ref, { status, processedAt: Timestamp.now(), ...extra });
        });
    } else await updateDoc(ref, { status, processedAt: Timestamp.now(), ...extra });
};

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', year));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
}

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings) => {
    await setDoc(doc(db, 'institutes', instituteId, 'academicYears', year), data, { merge: true });
}

export const createMatriculations = async (instituteId: string, studentId: string, units: Unit[], year: string) => {
    const batch = writeBatch(db);
    units.forEach(u => { batch.set(doc(getSubCollectionRef(instituteId, 'matriculations')), { studentId, unitId: u.id, programId: u.programId, year, period: u.period, semester: u.semester, moduleId: u.moduleId, status: 'cursando', createdAt: Timestamp.now() }); });
    await batch.commit();
};

/**
 * Realiza una matrícula masiva para múltiples estudiantes.
 */
export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    const col = getSubCollectionRef(instituteId, 'matriculations');
    
    for (const studentId of studentIds) {
        units.forEach(u => {
            batch.set(doc(col), {
                studentId,
                unitId: u.id,
                programId: u.programId,
                year,
                period: u.period,
                semester: u.semester,
                moduleId: u.moduleId,
                status: 'cursando',
                createdAt: Timestamp.now()
            });
        });
        // Actualizar el semestre actual del estudiante en su perfil para seguimiento
        const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
        batch.update(studentRef, { currentSemester: semester });
    }
    await batch.commit();
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const mSnap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", studentId)));
    if (mSnap.empty) return [];
    const [progs, allUnits] = await Promise.all([getPrograms(instituteId), getUnits(instituteId)]);
    const programMap = new Map(progs.map(p => [p.id, p.name]));
    const unitMap = new Map(allUnits.map(u => [u.id, u]));
    return mSnap.docs.map(d => {
        const u = unitMap.get(d.data().unitId);
        return u ? { ...u, programName: programMap.get(u.programId) || 'N/A', enrollmentYear: d.data().year } as EnrolledUnit : null;
    }).filter(Boolean) as EnrolledUnit[];
};

export const getMatriculationsForStudent = async (instituteId: string, sId: string): Promise<Matriculation[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("studentId", "==", sId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Matriculation)).sort((a,b) => b.year.localeCompare(a.year) || b.period.localeCompare(a.period));
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const mSnap = await getDocs(query(getSubCollectionRef(instituteId, 'matriculations'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    if (mSnap.empty) return [];
    const ids = mSnap.docs.map(d => d.data().studentId);
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), where('documentId', 'in', ids)));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const rId = `${unitId}_${studentId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'academicRecords', rId));
    return snap.exists() ? snap.data() as AcademicRecord : null;
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'academicRecords'), where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const CHUNK_SIZE = 5;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const record of chunk) {
            batch.set(doc(db, 'institutes', instituteId, 'academicRecords', record.id), record, { merge: true });
        }
        await batch.commit();
    }
}

export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', `${unitId}_${year}_${period}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, data: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', data.id), data, { merge: true });
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'schedules'));
    const days = new Set<string>();
    snapshot.forEach(doc => {
        const d = doc.data();
        if (d.year === year && d.semester === semester) {
            Object.values(d.schedule as any).forEach((b: any) => { if (b.unitId === unitId) days.add(b.dayOfWeek); });
        }
    });
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(days).sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'scheduleTemplates'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
};

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1)));
    if (snap.empty) {
        const any = await getDocs(query(getSubCollectionRef(instituteId, 'scheduleTemplates'), limit(1)));
        return any.empty ? null : { id: any.docs[0].id, ...any.docs[0].data() } as ScheduleTemplate;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, schedule: Record<string, ScheduleBlock>): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'schedules', `${programId}_${year}_${semester}`), { schedule, programId, year, semester, turno }, { merge: true });
}

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'schedules'), where("year", "==", year)));
    const all: ScheduleBlock[] = [];
    snap.forEach(doc => { if (doc.data().schedule) Object.values(doc.data().schedule as any).forEach((b: any) => all.push(b)); });
    return all;
}

export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'news'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};

export const addNews = async (instituteId: string, data: any, file?: File) => {
    const ref = doc(getSubCollectionRef(instituteId, 'news'));
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instituteId}/news/${ref.id}`);
    await setDoc(ref, { ...data, imageUrl: url, createdAt: Timestamp.now() });
};

export const addAlbum = async (instituteId: string, data: any) => {
    await addDoc(getSubCollectionRef(instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'albums'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]) => {
    const col = collection(db, 'institutes', instituteId, 'albums', albumId, 'photos');
    for (const f of files) {
        const pRef = doc(col);
        const url = await uploadFileAndGetURL(f, `institutes/${instituteId}/albums/${albumId}/${pRef.id}`);
        await setDoc(pRef, { albumId, url, createdAt: Timestamp.now() });
    }
};

export const getEFSRTAssignmentsForStudent = async (instituteId: string, sId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', sId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() });
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: any[]) => {
    const col = getSubCollectionRef(instituteId, 'matriculations');
    const mSnap = await getDocs(query(col, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period)));
    const mIdsByStudent = new Map<string, string[]>();
    mSnap.forEach(d => {
        const sId = d.data().studentId;
        if (!mIdsByStudent.has(sId)) mIdsByStudent.set(sId, []);
        mIdsByStudent.get(sId)!.push(d.id);
    });
    for (let i = 0; i < results.length; i += 5) {
        const chunk = results.slice(i, i + 5);
        const batch = writeBatch(db);
        chunk.forEach(r => {
            batch.update(doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${r.studentId}_${year}_${period}`), { finalGrade: r.finalGrade, status: r.status });
            (mIdsByStudent.get(r.studentId) || []).forEach(mId => batch.update(doc(col, mId), { status: r.status }));
        });
        await batch.commit();
    }
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'buildings'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
};

export const getEnvironmentsForBuilding = async (instituteId: string, bId: string): Promise<Environment[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, buildingId: bId, ...doc.data() } as Environment));
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const buildings = await getBuildings(instituteId);
    let all: Asset[] = [];
    for (const b of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        for (const e of envs) {
            const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', b.id, 'environments', e.id, 'assets'));
            all = all.concat(snap.docs.map(d => ({ ...d.data(), id: d.id, buildingName: b.name, environmentName: e.name } as any)));
        }
    }
    return all;
};

export const getCompanyProfiles = async (instituteId: string): Promise<CompanyProfile[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'companyProfiles'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyProfile));
};

export const getJobOffers = async (instituteId: string, opt: any = {}): Promise<JobOffer[]> => {
    const col = getSubCollectionRef(instituteId, 'jobOffers');
    const q_parts = [orderBy('createdAt', 'desc')];
    if (opt.companyId) q_parts.unshift(where('companyId', '==', opt.companyId));
    else if (!opt.all) q_parts.unshift(where('status', '==', 'Abierta')); 
    const snap = await getDocs(query(col, ...q_parts));
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobOffer));
    if (opt.programId) list = list.filter(o => o.programIds.includes(opt.programId) || o.programIds.length === 0);
    return list;
};

export const getApplicationsForStudent = async (instituteId: string, sId: string): Promise<JobApplication[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'jobApplications'), where('studentId', '==', sId), orderBy('appliedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
};

export const setVirtualClassroomStatus = async (instituteId: string, unitId: string, status: boolean) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { isVirtualClassroomActive: status });
};

export const saveAttendanceLimitWeek = async (instituteId: string, unitId: string, limit: number) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { attendanceLimitWeek: limit });
};

export const bulkAddAssetTypes = async (instituteId: string, types: any[]) => {
    const batch = writeBatch(db);
    types.forEach(t => { batch.set(doc(collection(db, 'institutes', instituteId, 'assetCatalog')), { ...t, lastAssignedNumber: 0 }); });
    await batch.commit();
}

export const getAssetTypes = async (instituteId: string, options: any = {}): Promise<AssetType[]> => {
    const q_parts = [orderBy("name")];
    if (options.limit) q_parts.push(limit(options.limit));
    if (options.search) {
        q_parts.unshift(where("name", ">=", options.search), where("name", "<=", options.search + "\uf8ff"));
    }
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'assetCatalog'), ...q_parts));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
}

export const getAssetTypeById = async (instituteId: string, id: string): Promise<AssetType | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetCatalog', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AssetType : null;
}

export const addAssetType = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'assetCatalog'), { ...data, lastAssignedNumber: 0 });
}

export const updateAssetType = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetCatalog', id), data);
}

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetCatalog', id));
}

export const getAssetsForEnvironment = async (inst: string, bld: string, env: string): Promise<Asset[]> => {
    const snap = await getDocs(collection(db, 'institutes', inst, 'buildings', bld, 'environments', env, 'assets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
}

export const addAsset = async (inst: string, bld: string, env: string, typeId: string, data: any) => {
    let code = '';
    await runTransaction(db, async (t) => {
        const tRef = doc(db, 'institutes', inst, 'assetCatalog', typeId);
        const tData = (await t.get(tRef)).data() as AssetType;
        const next = (tData.lastAssignedNumber || 0) + 1;
        code = `${tData.patrimonialCode}-${String(next).padStart(4, '0')}`;
        t.update(tRef, { lastAssignedNumber: next });
        const aRef = doc(collection(db, 'institutes', inst, 'buildings', bld, 'environments', env, 'assets'));
        t.set(aRef, { ...data, codeOrSerial: code, name: tData.name, type: tData.class, assetTypeId: typeId });
        t.set(doc(collection(aRef, 'history')), { timestamp: Timestamp.now(), details: 'Registro inicial del activo', userName: auth.currentUser?.displayName || 'Sistema' });
    });
    return code;
}

export const updateAsset = async (inst: string, bld: string, env: string, id: string, data: any) => {
    const ref = doc(db, 'institutes', inst, 'buildings', bld, 'environments', env, 'assets', id);
    await updateDoc(ref, data);
    await addDoc(collection(ref, 'history'), { timestamp: Timestamp.now(), details: 'Actualización de datos', userName: auth.currentUser?.displayName || 'Sistema' });
}

export const deleteAsset = async (inst: string, bld: string, env: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', inst, 'buildings', bld, 'environments', env, 'assets', id));
}

export const getAssetHistory = async (inst: string, bld: string, env: string, id: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', inst, 'buildings', bld, 'environments', env, 'assets', id, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
}

export const bulkUpdateAssetsStatus = async (inst: string, assets: Asset[], status: any) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const ref = doc(db, 'institutes', inst, 'buildings', a.buildingId!, 'environments', a.environmentId!, 'assets', a.id);
        batch.update(ref, { status });
        batch.set(doc(collection(ref, 'history')), { timestamp: Timestamp.now(), details: `Cambio de estado masivo a ${status}`, userName: auth.currentUser?.displayName || 'Sistema' });
    });
    await batch.commit();
}

export const moveAssets = async (inst: string, assets: Asset[], target: Environment) => {
    const batch = writeBatch(db);
    for (const a of assets) {
        const oldRef = doc(db, 'institutes', inst, 'buildings', a.buildingId!, 'environments', a.environmentId!, 'assets', a.id);
        const newRef = doc(db, 'institutes', inst, 'buildings', target.buildingId, 'environments', target.id, 'assets', a.id);
        const history = await getAssetHistory(inst, a.buildingId!, a.environmentId!, a.id);
        batch.delete(oldRef);
        batch.set(newRef, { ...a, buildingId: target.buildingId, environmentId: target.id });
        history.forEach(h => { batch.set(doc(db, 'institutes', inst, 'buildings', target.buildingId, 'environments', target.id, 'assets', a.id, 'history', h.id), h); });
        batch.set(doc(collection(newRef, 'history')), { timestamp: Timestamp.now(), details: `Traslado de ambiente: ${a.environmentName} -> ${target.name}`, userName: auth.currentUser?.displayName || 'Sistema' });
    }
    await batch.commit();
}

export const getBuildingsForInstitute = async (id: string): Promise<Building[]> => {
    const snap = await getDocs(query(getSubCollectionRef(id, 'buildings'), orderBy('name')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
}

export const addBuilding = async (inst: string, data: any) => {
    await addDoc(getSubCollectionRef(inst, 'buildings'), data);
}

export const updateBuilding = async (inst: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', inst, 'buildings', id), data);
}

export const deleteBuilding = async (inst: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', inst, 'buildings', id));
}

export const addEnvironment = async (inst: string, bld: string, data: any) => {
    await addDoc(collection(db, 'institutes', inst, 'buildings', bld, 'environments'), data);
}

export const updateEnvironment = async (inst: string, bld: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', inst, 'buildings', bld, 'environments', id), data);
}

export const deleteEnvironment = async (inst: string, bld: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', inst, 'buildings', bld, 'environments', id));
}
