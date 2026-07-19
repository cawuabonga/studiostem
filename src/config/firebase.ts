'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot, increment, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, Delivery, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission, AIConfig, StudentEgresoAudit, SocialLinks, CompanyProfile, JobOffer, JobApplication, Plan, InstituteMetrics, DailyActivity } from '@/types';
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

export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// --- Observability Functions ---

export const trackDailyActivity = async (instituteId: string, roleId: string, userId: string): Promise<void> => {
    if (!instituteId || !roleId) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
        { 
            id: 'student', 
            name: 'Estudiante', 
            description: 'Acceso estándar para alumnos matriculados.', 
            permissions: { 
                'student:unit:view': true, 
                'student:grades:view': true, 
                'student:payments:manage': true, 
                'student:efsrt:view': true, 
                'student:jobs:view': true, 
                'student:jobs:apply': true, 
                'user:supplies:request': true,
                'user:access:view:own': true,
                'planning:schedule:view:own': true
            } 
        },
        { 
            id: 'graduate', 
            name: 'Egresado', 
            description: 'Acceso para ex-alumnos con enfoque en bolsa laboral.', 
            permissions: { 
                'graduate:jobs:view': true, 
                'graduate:profile:view': true, 
                'student:grades:view': true, 
                'student:efsrt:view': true, 
                'student:payments:manage': true,
                'user:access:view:own': true
            } 
        },
        { 
            id: 'teacher', 
            name: 'Docente', 
            description: 'Acceso para el personal de enseñanza y supervisión.', 
            permissions: { 
                'teacher:unit:view': true, 
                'teacher:efsrt:supervise': true, 
                'user:supplies:request': true, 
                'user:access:view:own': true,
                'planning:schedule:view:own': true 
            } 
        },
        { 
            id: 'company', 
            name: 'Empresa', 
            description: 'Acceso para socios estratégicos de la bolsa laboral.', 
            permissions: { 
                'company:jobs:manage': true, 
                'company:applicants:view': true 
            } 
        },
        { 
            id: 'admin', 
            name: 'Administrador', 
            description: 'Control total de la gestión del instituto.', 
            permissions: { 
                'admin:institute:manage': true, 
                'admin:fees:manage': true, 
                'admin:payments:validate': true, 
                'admin:access-control:manage': true, 
                'admin:attendance:report': true, 
                'admin:infra:manage': true, 
                'admin:supplies:manage': true, 
                'admin:deliveries:view': true, 
                'admin:companies:manage': true, 
                'admin:jobs:monitor': true,
                'academic:program:manage': true, 
                'academic:unit:manage': true, 
                'academic:unit:manage:own': true,
                'academic:assignment:manage': true, 
                'academic:teacher:view': true, 
                'academic:workload:view': true, 
                'academic:enrollment:manage': true, 
                'academic:periods:manage': true, 
                'academic:load:view': true, 
                'academic:efsrt:manage': true, 
                'planning:schedule:manage': true, 
                'planning:environment:manage': true, 
                'planning:schedule:view:own': true, 
                'users:staff:manage': true, 
                'users:student:manage': true 
            } 
        }
    ];

    const batch = writeBatch(db);
    defaultRoles.forEach(role => {
        const { id, ...roleData } = role;
        const roleRef = doc(rolesCol, id);
        batch.set(roleRef, roleData);
    });
    await batch.commit();
};

export const getInstitutes = async (): Promise<Institute[]> => {
    const institutesCol = collection(db, 'institutes');
    const q = query(institutesCol, orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    } as Institute));
};

export const getInstitute = async (instituteId: string): Promise<Institute | null> => {
    const docRef = doc(db, 'institutes', instituteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Institute;
    }
    return null;
}

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const loginDesign = await getLoginDesignSettings();
    return loginDesign?.imageUrl || null;
}

export const updateInstitute = async (instituteId: string, data: Partial<Omit<Institute, 'id' | 'logoUrl'>>, logoFile?: File): Promise<void> => {
    const updateData: { [key: string]: any } = { ...data };

    if (logoFile) {
        const storagePath = `institutes/${instituteId}/logo`;
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, storagePath);
    }

    await updateDoc(doc(db, 'institutes', instituteId), updateData);
};

export const deleteInstitute = async (instituteId: string): Promise<void> => {
    const instituteRef = doc(db, 'institutes', instituteId);
    await deleteDoc(instituteRef);
};

export const saveLoginDesignSettings = async (settings: Partial<LoginDesign>): Promise<void> => {
    const designRef = doc(db, 'config', 'loginDesign');
    await setDoc(designRef, settings, { merge: true });
};

export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const designRef = doc(db, 'config', 'loginDesign');
    const docSnap = await getDoc(designRef);
    if (docSnap.exists()) {
        return docSnap.data() as LoginDesign;
    }
    return null;
};

export const uploadLoginImage = async (file: File, name: string): Promise<void> => {
    try {
        const newImageId = doc(collection(db, 'idGenerator')).id;
        const storagePath = `loginImages/${newImageId}`;
        const downloadURL = await uploadFileAndGetURL(file, storagePath);

        const imageDocRef = doc(db, 'config/loginDesign/images', newImageId);
        await setDoc(imageDocRef, {
            name,
            url: downloadURL,
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error("[DEBUG] Error in uploadLoginImage:", error);
        throw error;
    }
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const imagesCol = collection(db, 'config', 'loginDesign', 'images');
    const q = query(imagesCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const setActiveLoginImage = async (imageUrl: string): Promise<void> => {
    await saveLoginDesignSettings({ imageUrl });
};

export const deleteLoginImage = async (image: LoginImage): Promise<void> => {
    const imageDocRef = doc(db, 'config/loginDesign/images', image.id);
    await deleteDoc(imageDocRef);
    const storageRef = ref(firebaseStorage, `loginImages/${image.id}`);
    try {
        await deleteObject(storageRef);
    } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
            throw error;
        }
    }
};

export const getAllUsersPaginated = async (options: { 
    instituteId?: string; 
    limit: number; 
    startAfter?: DocumentSnapshot | null;
}): Promise<{ users: AppUser[], lastVisible: DocumentSnapshot | null }> => {
    const usersCol = collection(db, 'users');
    const q_parts: any[] = [];
    if (options.instituteId && options.instituteId !== 'all') {
        q_parts.push(where("instituteId", "==", options.instituteId));
    }
    q_parts.push(orderBy("displayName"));
    if (options.startAfter) {
        q_parts.push(startAfter(options.startAfter));
    }
    q_parts.push(limit(options.limit));
    const q = query(usersCol, ...q_parts);
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return { users, lastVisible };
};

export const getTotalUsersCount = async (instituteId?: string): Promise<number> => {
    const usersCol = collection(db, 'users');
    let q;
    if (instituteId && instituteId !== 'all') {
        q = query(usersCol, where("instituteId", "==", instituteId));
    } else {
        q = query(usersCol);
    }
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

const getSubCollectionRef = (instituteId: string, collectionName: string) => {
    return collection(db, 'institutes', instituteId, collectionName);
}

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    const programsCol = getSubCollectionRef(instituteId, 'programs');
    const programData = {
        ...data,
        modules: data.modules.map(module => ({ ...module })) 
    };
    await addDoc(programsCol, programData);
}

export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const programsCol = getSubCollectionRef(instituteId, 'programs');
    const q = query(programsCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
}

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Omit<Program, 'id'>>) => {
    const programRef = doc(db, 'institutes', instituteId, 'programs', programId);
    const updateData = {
        ...data,
        ...(data.modules && { modules: data.modules.map(module => ({...module})) }),
    };
    await updateDoc(programRef, updateData);
}

export const deleteProgram = async (instituteId: string, programId: string) => {
    const programRef = doc(db, 'institutes', instituteId, 'programs', programId);
    await deleteDoc(programRef);
}

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'imageUrl'>) => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
     const unitData = {
        ...data,
        totalHours: (data.theoreticalHours || 0) + (data.practicalHours || 0)
    };
    const newDocRef = await addDoc(unitsCol, unitData);
    return newDocRef.id;
}

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    const docSnap = await getDoc(unitRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as Unit;
    }
    return null;
};

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    const q = query(unitsCol, orderBy("code"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, data);
}

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string): Promise<void> => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File): Promise<void> => {
    const path = `institutes/${instituteId}/units/${unitId}/coverImage`;
    const downloadURL = await uploadFileAndGetURL(file, path);
    await updateUnitImage(instituteId, unitId, downloadURL);
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await deleteDoc(unitRef);
}

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    for (const unitData of units) {
        const docRef = doc(unitsCol); 
        const dataWithHours = {
            ...unitData,
            totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0),
        };
        await setDoc(docRef, dataWithHours);
    }
}

export const bulkDeleteUnits = async (instituteId: string, unitIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    unitIds.forEach(id => {
        const docRef = doc(unitsCol, id);
        batch.delete(docRef);
    });
    await batch.commit();
}

export const duplicateUnit = async (instituteId: string, unitId: string): Promise<void> => {
    const originalUnit = await getUnit(instituteId, unitId);
    if (!originalUnit) {
        throw new Error("La unidad original no fue encontrada.");
    }
    const { id, name, code, ...restOfUnit } = originalUnit;
    const newUnitData = {
        ...restOfUnit,
        name: `${name} (Copia)`,
        code: `${code}-COPY`,
    };
    await addUnit(instituteId, newUnitData as Omit<Unit, 'id' | 'imageUrl'>);
};

export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const allStaff = await getStaffProfiles(instituteId);
    const allPrograms = await getPrograms(instituteId);
    const programMap = new Map(allPrograms.map(p => [p.id, p.name]));
    return allStaff.map(data => {
        return {
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
        } as Teacher;
    });
};

export const getAssignments = async (
  instituteId: string,
  year: string,
  programId: string
): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
  const assignmentDocRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
  const docSnap = await getDoc(assignmentDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as { 'MAR-JUL': Assignment; 'AGO-DIC': Assignment };
  }
  return { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllAssignmentsForYear = async (
    instituteId: string,
    year: string
): Promise<{ 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }> => {
    const assignmentsCol = getSubCollectionRef(instituteId, 'assignments');
    const q = query(assignmentsCol, where('__name__', '>=', `${year}_`), where('__name__', '<', `${year}_\uf8ff`));
    const querySnapshot = await getDocs(q);
    const allAssignments: { 'MAR-JUL': Assignment; 'AGO-DIC': Assignment } = {
        'MAR-JUL': {},
        'AGO-DIC': {},
    };
    querySnapshot.forEach(doc => {
        const data = doc.data() as { 'MAR-JUL'?: Assignment; 'AGO-DIC'?: Assignment };
        if (data['MAR-JUL']) {
            Object.assign(allAssignments['MAR-JUL'], data['MAR-JUL']);
        }
        if (data['AGO-DIC']) {
            Object.assign(allAssignments['AGO-DIC'], data['AGO-DIC']);
        }
    });
    return allAssignments;
};

export const saveAssignments = async (
  instituteId: string,
  year: string,
  programId: string,
  assignments: { 'MAR-JUL': Assignment; 'AGO-DIC': Assignment }
): Promise<void> => {
  const assignmentDocRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
  await setDoc(assignmentDocRef, assignments);
};

export const saveSingleAssignment = async (
  instituteId: string,
  year: string,
  programId: string,
  period: UnitPeriod,
  unitId: string,
  teacherId: string | null
): Promise<void> => {
    const assignmentDocRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    if (teacherId) {
        await setDoc(assignmentDocRef, { 
            [period]: { 
                [unitId]: teacherId 
            }
        }, { merge: true });
    } else {
        await setDoc(assignmentDocRef, {
            [period]: {
                [unitId]: deleteField()
            }
        }, { merge: true });
    }
};

export const getStaffProfiles = async (instituteId: string): Promise<StaffProfile[]> => {
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    const q = query(staffCol, orderBy("displayName"));
    const snapshot = await getDocs(q);
    const programs = await getPrograms(instituteId);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    return snapshot.docs.map(doc => {
        const data = doc.data() as StaffProfile;
        return {
            ...data,
            documentId: doc.id,
            programName: programMap.get(data.programId) || 'N/A'
        } as StaffProfile;
    });
};

export const getStaffProfileByDocumentId = async (instituteId: string, documentId: string): Promise<StaffProfile | null> => {
    const profileRef = doc(getSubCollectionRef(instituteId, 'staffProfiles'), documentId);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
        return docSnap.data() as StaffProfile;
    }
    return null;
}

export const bulkAddStaff = async (instituteId: string, staffList: Omit<StaffProfile, 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    staffList.forEach(staffData => {
        const docRef = doc(staffCol, staffData.documentId);
        batch.set(docRef, { ...staffData, instituteId });
    });
    await batch.commit();
};

export const bulkDeleteStaff = async (instituteId: string, documentIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    documentIds.forEach(id => {
        const docRef = doc(staffCol, id);
        batch.delete(docRef);
    });
    await batch.commit();
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
    const staffRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    await updateDoc(staffRef, data);
    const profileSnap = await getDoc(staffRef);
    const profileData = profileSnap.data();
    if (profileData && profileData.linkedUserUid && data.role) {
        const userRef = doc(db, 'users', profileData.linkedUserUid);
        await updateDoc(userRef, {
            role: data.role,
            displayName: data.displayName 
        });
    }
}

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
    const staffRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    await deleteDoc(staffRef);
}

export const getStudentProfiles = async (instId: string): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instId, 'studentProfiles'), orderBy("lastName")));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getStudentsPaginated = async (options: { 
    instituteId: string;
    programId?: string;
    admissionYear?: string;
    turno?: UnitTurno;
    semester?: number;
    limitCount: number;
    startAfterDoc?: DocumentSnapshot | null;
    excludeEgresados?: boolean;
}): Promise<{ students: StudentProfile[], lastVisible: DocumentSnapshot | null }> => {
    const studentsCol = getSubCollectionRef(options.instituteId, 'studentProfiles');
    const q_parts: any[] = [];
    
    if (options.programId && options.programId !== 'all') {
        q_parts.push(where("programId", "==", options.programId));
    }
    if (options.admissionYear && options.admissionYear !== 'all') {
        q_parts.push(where("admissionYear", "==", options.admissionYear));
    }
    if (options.turno && options.turno !== 'all') {
        q_parts.push(where("turno", "==", options.turno));
    }

    q_parts.push(orderBy("lastName"));

    if (options.startAfterDoc) {
        q_parts.push(startAfter(options.startAfterDoc));
    }
    q_parts.push(limit(options.limitCount * 2)); 

    const q = query(studentsCol, ...q_parts);
    const snapshot = await getDocs(q);
    
    let students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
    
    if (options.excludeEgresados) {
        students = students.filter(s => s.academicStatus !== 'Egresado');
    }
    
    if (options.semester) {
        students = students.filter(p => {
             const calculateCurrentSemester = (admissionYear: string, admissionPeriod: 'MAR-JUL' | 'AGO-DIC'): number => {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth(); 
                const yearsDiff = currentYear - parseInt(admissionYear);
                let semesterCount = yearsDiff * 2;
                if (admissionPeriod === 'MAR-JUL') semesterCount += 1;
                if (currentMonth >= 7) semesterCount += 1;
                else if (admissionPeriod === 'AGO-DIC') semesterCount -= 1;
                return Math.max(1, semesterCount);
            };
            const currentSem = p.currentSemester || calculateCurrentSemester(p.admissionYear, p.admissionPeriod);
            return currentSem === options.semester;
        });
    }

    const finalStudents = students.slice(0, options.limitCount);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { students: finalStudents, lastVisible };
};

export const getStudentProfile = async (instituteId: string, studentId: string): Promise<StudentProfile | null> => {
    const studentRef = doc(getSubCollectionRef(instituteId, 'studentProfiles'), studentId);
    const docSnap = await getDoc(studentRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as StudentProfile;
    }
    return null;
}

export const updateStudentProfile = async (instituteId: string, documentId: string, data: Partial<Omit<StudentProfile, 'id' | 'documentId' | 'photoURL'>>) => {
    const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', documentId);
    const updateData: any = { ...data };
    if (data.firstName && data.lastName) {
        updateData.fullName = `${data.firstName} ${data.lastName}`;
    }
    await updateDoc(studentRef, updateData);
}

export const deleteStudentProfile = async (instituteId: string, studentId: string) => {
    const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    await deleteDoc(studentRef);
}

export const bulkDeleteStudents = async (instituteId: string, documentIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    documentIds.forEach(id => {
        const docRef = doc(studentsCol, id);
        batch.delete(docRef);
    });
    await batch.commit();
}

export const getGraduates = async (instituteId: string, options: { year?: string, programId?: string } = {}): Promise<StudentProfile[]> => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const q_parts = [where("academicStatus", "==", "Egresado")];
    if (options.year && options.year !== 'all') q_parts.push(where("graduationYear", "==", options.year));
    if (options.programId && options.programId !== 'all') q_parts.push(where("programId", "==", options.programId));
    
    let q;
    if (options.year && options.year !== 'all') {
        q = query(studentsCol, ...q_parts, orderBy("graduationYear", "desc"), orderBy("lastName", "asc"));
    } else {
        q = query(studentsCol, ...q_parts, orderBy("lastName", "asc"));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const activitiesCol = getSubCollectionRef(instituteId, 'nonTeachingActivities');
    const snapshot = await getDocs(query(activitiesCol));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const assignmentsCol = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    const q = query(
        assignmentsCol,
        where("teacherId", "==", teacherId),
        where("year", "==", year),
        where("period", "==", period)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const assignmentsCol = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    const q = query(assignmentsCol, where("year", "==", year));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
}

export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    const conceptsCol = getSubCollectionRef(instituteId, 'paymentConcepts');
    let q;
    if (activeOnly) {
        q = query(conceptsCol, where("isActive", "==", true));
    } else {
        q = query(conceptsCol);
    }
    const snapshot = await getDocs(q);
    const concepts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
    return concepts.sort((a,b) => a.name.localeCompare(b.name));
};

export const getStudentPaymentsByStatus = async (instituteId: string, payerId: string, status: PaymentStatus): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(
        paymentsCol,
        where("payerId", "==", payerId),
        where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getPaymentsByStatus = async (
    instituteId: string, 
    status: PaymentStatus,
    options: { lastVisible?: DocumentSnapshot } = {}
): Promise<{ payments: Payment[], newLastVisible: DocumentSnapshot | null }> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q_parts: any[] = [
        where("status", "==", status),
        orderBy("createdAt", "desc"),
        limit(20)
    ];
    if (options.lastVisible) {
        q_parts.push(startAfter(options.lastVisible));
    }
    const q = query(paymentsCol, ...q_parts);
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    const newLastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { payments, newLastVisible };
};

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const catalogCol = getSubCollectionRef(instituteId, 'supplyCatalog');
    const q = query(catalogCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
}

export const getRequestsForUser = async (instituteId: string, requesterAuthUid: string): Promise<SupplyRequest[]> => {
    const requestsCol = getSubCollectionRef(instituteId, 'supplyRequests');
    const q = query(
        requestsCol, 
        where("requesterAuthUid", "==", requesterAuthUid), 
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const requestsCol = getSubCollectionRef(instituteId, 'supplyRequests');
    const q = query(
        requestsCol, 
        where("status", "==", status), 
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

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
    
    // Fallback: If current year not found, check previous year to ensure smooth transitions
    const previousYear = (parseInt(year) - 1).toString();
    const prevSnap = await getDoc(doc(db, 'institutes', instituteId, 'academicYears', previousYear));
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
    const matriculationSnapshot = await getDocs(q);
    if (matriculationSnapshot.empty) return [];
    const unitIds = Array.from(new Set(matriculationSnapshot.docs.map(doc => doc.data().unitId)));
    const [programs, allUnits] = await Promise.all([getPrograms(instituteId), getUnits(instituteId)]);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    const unitMap = new Map(allUnits.map(u => [u.id, u]));
    const enrolledUnits: EnrolledUnit[] = [];
    unitIds.forEach(unitId => {
        const unit = unitMap.get(unitId);
        if (unit) enrolledUnits.push({ ...unit, programName: programMap.get(unit.programId) || 'N/A' });
    });
    return enrolledUnits;
};

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    const matriculations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));
    matriculations.sort((a, b) => b.year.localeCompare(a.year) || b.period.localeCompare(a.period));
    return matriculations;
};

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    const snapshot = await getDocs(query(indicatorsCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
}

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    await addDoc(indicatorsCol, data);
}

export const updateAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string, data: Partial<AchievementIndicator>) => {
    const indicatorRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', indicatorId);
    await updateDoc(indicatorRef, data);
}

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
    const indicatorRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', indicatorId);
    await deleteDoc(indicatorRef);
}

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
  const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
  const q = query(recordsCol, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const recordId = `${unitId}_${studentId}_${year}_${period}`;
    const recordRef = doc(getSubCollectionRef(instituteId, 'academicRecords'), recordId);
    const docSnap = await getDoc(recordRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AcademicRecord : null;
}

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const CHUNK_SIZE = 5; 
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        for (const record of chunk) {
            const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', record.id);
            batch.set(recordRef, record, { merge: true });
            
            if (record.grades) {
                for (const indicatorId in record.grades) {
                    const taskGrades = record.grades[indicatorId].filter(g => g.type === 'task');
                    for (const g of taskGrades) {
                        const subRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', record.unitId, 'weeklyPlanner', `week_${g.weekNumber}`, 'tasks', g.refId, 'submissions', record.studentId);
                        batch.update(subRef, { grade: g.grade });
                    }
                }
            }
        }
        await batch.commit();
    }
}

export const addManualEvaluationToRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, studentIds: string[], newEvaluation: Omit<ManualEvaluation, 'id' | 'createdAt'>) => {
    const batch = writeBatch(db);
    const evaluationId = doc(collection(db, 'idGenerator')).id; 
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
    for (const studentId of studentIds) {
        const recordId = `${unitId}_${studentId}_${year}_${period}`;
        const recordRef = doc(recordsCol, recordId);
        batch.set(recordRef, { id: recordId, studentId, unitId, year, period, evaluations: { [newEvaluation.indicatorId]: arrayUnion({ ...newEvaluation, id: evaluationId, createdAt: Timestamp.now() }) } }, { merge: true });
    }
    await batch.commit();
}

export const deleteManualEvaluationFromRecord = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, indicatorId: string, evaluationId: string) => {
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
    const q = query(recordsCol, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
        const record = docSnap.data() as AcademicRecord;
        if (record.evaluations && record.evaluations[indicatorId]) {
            const updatedEvaluations = { ...record.evaluations, [indicatorId]: record.evaluations[indicatorId].filter(e => e.id !== evaluationId) };
            const updatedGrades = record.grades || {};
            if (updatedGrades[indicatorId]) updatedGrades[indicatorId] = updatedGrades[indicatorId].filter(g => g.refId !== evaluationId);
            batch.update(docSnap.ref, { evaluations: updatedEvaluations, grades: updatedGrades });
        }
    });
    await batch.commit();
}

export const saveAttendance = async (instituteId: string, attendanceData: AttendanceRecord): Promise<void> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', attendanceData.id);
    await setDoc(attendanceRef, attendanceData, { merge: true });
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus): Promise<void> => {
    const syllabusRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus');
    await setDoc(syllabusRef, data, { merge: true });
}

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Content, 'id'>, file?: File) => {
    const weekDocRef = doc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner'), `week_${weekNumber}`);
    const newContentId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    if (data.type === 'file' && file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${newContentId}`);
    }
    const newContent: Content = { ...data, id: newContentId, value: data.type === 'file' ? fileUrl : (data.value || ''), createdAt: Timestamp.now() };
    await setDoc(weekDocRef, { contents: arrayUnion(newContent) }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const weekDocRef = doc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner'), `week_${weekNumber}`);
    const weekSnap = await getDoc(weekDocRef);
    if (!weekSnap.exists() || !weekSnap.data().contents) return;
    const contents = weekSnap.data().contents as Content[];
    const contentIndex = contents.findIndex(c => c.id === contentId);
    if (contentIndex === -1) return;
    const updatedContent = { ...contents[contentIndex], ...data };
    if (data.type === 'file' && file) {
        updatedContent.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${contentId}`);
    }
    contents[contentIndex] = updatedContent;
    await updateDoc(weekDocRef, { contents });
}

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Task, 'id' | 'createdAt' | 'fileUrl'>, file?: File) => {
    const weekDocRef = doc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner'), `week_${weekNumber}`);
    const taskId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    if (file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/reference`);
    }
    
    const newTaskObj: any = {
        id: taskId,
        title: data.title || '',
        description: data.description || '',
        dueDate: data.dueDate,
        createdAt: Timestamp.now()
    };
    
    if (fileUrl) newTaskObj.fileUrl = fileUrl;
    if (data.indicatorId) newTaskObj.indicatorId = data.indicatorId;
    if (data.referenceLink) newTaskObj.referenceLink = data.referenceLink;

    await setDoc(weekDocRef, { tasks: arrayUnion(newTaskObj) }, { merge: true });
};

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
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', roleId), data);
}

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const snapshot = await getDocs(getSubCollectionRef(instituteId, 'schedules'));
    const days = new Set<string>();
    
    // Normalize semester for comparison
    const semStr = String(semester);
    
    snapshot.forEach(doc => {
        const d = doc.data();
        if (String(d.year) === year && String(d.semester) === semStr && d.schedule) {
            Object.values(d.schedule as any).forEach((b: any) => { 
                if (b.unitId === unitId) days.add(b.dayOfWeek); 
            });
        }
    });

    // Fallback logic: If no schedule found for current year, check previous year
    if (days.size === 0) {
        const prevYear = (parseInt(year) - 1).toString();
        snapshot.forEach(doc => {
            const d = doc.data();
            if (String(d.year) === prevYear && String(d.semester) === semStr && d.schedule) {
                Object.values(d.schedule as any).forEach((b: any) => { 
                    if (b.unitId === unitId) days.add(b.dayOfWeek); 
                });
            }
        });
    }

    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(days).sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export const getSchedule = async (instituteId: string, programId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'schedules', `${programId}_${year}_${semester}`));
    return snap.exists() ? snap.data().schedule || {} : {};
}

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'schedules'));
    const all: any = {};
    const semStr = String(semester);
    snap.forEach(doc => { 
        if (String(doc.data().year) === year && String(doc.data().semester) === semStr) {
            Object.assign(all, doc.data().schedule); 
        }
    });
    return all;
}

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, schedule: Record<string, ScheduleBlock>): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'schedules', `${programId}_${year}_${semester}`), { schedule, programId, year, semester, turno }, { merge: true });
}

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const promoteToEgresado = async (instituteId: string, studentId: string, graduationYear: string) => {
    const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) throw new Error("Student not found");
    const studentData = studentSnap.data();

    const batch = writeBatch(db);
    batch.update(studentRef, {
        academicStatus: 'Egresado',
        graduationYear,
        role: 'Graduate',
        roleId: 'graduate'
    });

    if (studentData.linkedUserUid) {
        const userRef = doc(db, 'users', studentData.linkedUserUid);
        batch.update(userRef, {
            role: 'Graduate',
            roleId: 'graduate'
        });
    }
    await batch.commit();
};

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

export const updateJobApplication = async (instituteId: string, applicationId: string, data: Partial<JobApplication>) => {
    const appRef = doc(db, 'institutes', instituteId, 'jobApplications', applicationId);
    await updateDoc(appRef, data);
};
