
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot, increment, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, Delivery, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission, AIConfig, StudentEgresoAudit, SocialLinks, CompanyProfile, JobOffer, JobApplication, Plan, InstituteMetrics, DailyActivity, Project, ProjectTeam, ProjectEvidence } from '@/types';
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

export const uploadNonTeachingEvidence = async (instituteId: string, assignmentId: string, file: File, description: string) => {
    const path = `institutes/${instituteId}/nonTeaching/${assignmentId}/${Date.now()}_${file.name}`;
    const url = await uploadFileAndGetURL(file, path);
    const ref = doc(db, 'institutes', instituteId, 'nonTeachingAssignments', assignmentId);
    await updateDoc(ref, {
        evidenceUrls: arrayUnion(url),
        evidenceDescription: description,
        lastUpdate: Timestamp.now()
    });
};

// --- Fin ABP ---

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

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const imagesCol = collection(db, 'config', 'loginDesign', 'images');
    const q = query(imagesCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const setActiveLoginImage = async (imageUrl: string): Promise<void> => {
    await saveLoginDesignSettings({ imageUrl });
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

export const addStaffProfile = async (instituteId: string, data: Omit<StaffProfile, 'linkedUserUid'>) => {
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    const profileRef = doc(staffCol, data.documentId); 
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
        throw new Error(`Un perfil con el documento ${data.documentId} ya existe.`);
    }
    await setDoc(profileRef, { ...data, instituteId, linkedUserUid: null });
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
}

export const addStudentProfile = async (instituteId: string, data: Omit<StudentProfile, 'fullName' | 'linkedUserUid' | 'id'>) => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const profileRef = doc(studentsCol, data.documentId);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
        throw new Error(`Un perfil de estudiante con el documento ${data.documentId} ya existe.`);
    }
    const profileData: Omit<StudentProfile, 'id'> = {
        ...data,
        instituteId,
        fullName: `${data.firstName} ${data.lastName}`,
        linkedUserUid: null,
        academicStatus: 'Cursando', 
    };
    await setDoc(profileRef, profileData);
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const q = query(studentsCol, orderBy("lastName"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getStudentProfile = async (instituteId: string, studentId: string): Promise<StudentProfile | null> => {
    const studentRef = doc(getSubCollectionRef(instituteId, 'studentProfiles'), studentId);
    const docSnap = await getDoc(studentRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as StudentProfile;
    }
    return null;
}

export const bulkAddStudents = async (instituteId: string, studentList: Omit<StudentProfile, 'id' | 'fullName'| 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    studentList.forEach(studentData => {
        const docRef = doc(studentsCol, studentData.documentId);
        const profileData: Omit<StudentProfile, 'id'> = {
            ...studentData,
            instituteId,
            fullName: `${studentData.firstName} ${studentData.lastName}`,
            linkedUserUid: null,
            academicStatus: 'Cursando',
        };
        batch.set(docRef, profileData);
    });
    await batch.commit();
};

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
    
export const linkUserToProfile = async (uid: string, documentId: string, email: string) => {
    const institutes = await getInstitutes();
    let foundProfile: (StaffProfile | StudentProfile | CompanyProfile) & { type: 'staff' | 'student' | 'company' } | null = null;
    let foundInstituteId: string | null = null;

    const searchDocId = documentId.trim();
    const searchEmail = email.toLowerCase().trim();

    for (const institute of institutes) {
        const staffProfileRef = doc(db, 'institutes', institute.id, 'staffProfiles', searchDocId);
        const staffDoc = await getDoc(staffProfileRef);
        if (staffDoc.exists()) {
            const data = staffDoc.data();
            if (data.email?.toLowerCase().trim() === searchEmail) {
                foundProfile = { ...data as StaffProfile, type: 'staff' };
                foundInstituteId = institute.id;
                break;
            }
        }

        const studentProfileRef = doc(db, 'institutes', institute.id, 'studentProfiles', searchDocId);
        const studentDoc = await getDoc(studentProfileRef);
        if (studentDoc.exists()) {
            const data = studentDoc.data();
            if (data.email?.toLowerCase().trim() === searchEmail) {
                foundProfile = { ...data as StudentProfile, type: 'student' };
                foundInstituteId = institute.id;
                break;
            }
        }
    }

    if (!foundProfile || !foundInstituteId) {
        throw new Error("No matching profile found.");
    }
    
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
        documentId: foundProfile.documentId,
        instituteId: foundInstituteId,
        role: foundProfile.role,
        roleId: foundProfile.roleId || 'student'
    });
    
    return { role: foundProfile.role, instituteName: foundInstituteId };
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const activitiesCol = getSubCollectionRef(instituteId, 'nonTeachingActivities');
    const snapshot = await getDocs(query(activitiesCol));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const addPaymentConcept = async (instituteId: string, data: Omit<PaymentConcept, 'id' | 'createdAt'>): Promise<void> => {
    const conceptsCol = getSubCollectionRef(instituteId, 'paymentConcepts');
    await addDoc(conceptsCol, { ...data, createdAt: Timestamp.now() });
};

export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    const conceptsCol = getSubCollectionRef(instituteId, 'paymentConcepts');
    let q;
    if (activeOnly) {
        q = query(conceptsCol, where("isActive", "==", true));
    } else {
        q = query(conceptsCol);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
};

export const registerPayment = async (
    instituteId: string, 
    data: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>, 
    voucherFile?: File
): Promise<string> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const paymentDocRef = doc(paymentsCol);
    let downloadURL = '';
    if (voucherFile) {
        downloadURL = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/vouchers/${paymentDocRef.id}`);
    }
    await setDoc(paymentDocRef, {
        ...data,
        voucherUrl: downloadURL,
        status: 'Pendiente',
        createdAt: Timestamp.now()
    });
    return paymentDocRef.id;
}

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const catalogCol = getSubCollectionRef(instituteId, 'supplyCatalog');
    const snapshot = await getDocs(query(catalogCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
}

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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));
};

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    const snapshot = await getDocs(query(indicatorsCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
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

export const getWeeksData = async (instituteId: string, unitId: string): Promise<WeekData[]> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    return snapshot.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData));
};

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const snapshot = await getDocs(query(rolesCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'accessPoints'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'buildings'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
};
    
export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), orderBy("name")));
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, buildingId, ...docSnap.data() } as Environment));
};

export const getAssetTypes = async (instituteId: string, options?: { search?: string; limit?: number }): Promise<AssetType[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'assetTypes'), limit(options?.limit || 20)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const requestsCol = getSubCollectionRef(instituteId, 'supplyRequests');
    const q = query(requestsCol, where("status", "==", status), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyRequest));
};

export const getCompanyProfiles = async (instituteId: string): Promise<CompanyProfile[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'companyProfiles'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyProfile));
};

export const getJobOffers = async (instituteId: string, options: { programId?: string, companyId?: string, all?: boolean } = {}): Promise<JobOffer[]> => {
    const col = getSubCollectionRef(instituteId, 'jobOffers');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobOffer));
};
