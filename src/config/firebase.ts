
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, Delivery, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission, AIConfig, StudentEgresoAudit, SocialLinks, CompanyProfile, JobOffer, JobApplication } from '@/types';
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

export const updateUserProfile = async (data: { displayName?: string | null; photoURL?: string | null, documentId?: string | null, bio?: string, socialLinks?: SocialLinks, coverImageUrl?: string }) => {
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
        
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            const userData = userSnap.data() as AppUser;

            await updateDoc(userDocRef, firestoreUpdates);

            if (userData.instituteId && userData.documentId) {
                const profileCollection = userData.role === 'Student' ? 'studentProfiles' : 'staffProfiles';
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

    if (updateData.publicProfile) {
      updateData.publicProfile = { ...updateData.publicProfile };
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

export const getUsersFromInstitute = async (instituteId: string): Promise<AppUser[]> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("instituteId", "==", instituteId), orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
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
    };
    await setDoc(profileRef, profileData);
};

export const getStudentProfiles = async (instituteId: string): Promise<StudentProfile[]> => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const q = query(studentsCol, orderBy("lastName"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
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
    const q_parts: any[] = [
        where('instituteId', '==', options.instituteId),
    ];
    
    if (options.programId && options.programId !== 'all') {
        q_parts.push(where("programId", "==", options.programId));
    }
    if (options.admissionYear) {
        q_parts.push(where("admissionYear", "==", options.admissionYear));
    }
    if (options.turno && options.turno !== 'all') {
        q_parts.push(where("turno", "==", options.turno));
    }

    if (options.excludeEgresados) {
        q_parts.push(where("academicStatus", "!=", "Egresado"));
        q_parts.push(orderBy("academicStatus")); 
    }

    q_parts.push(orderBy("lastName"));

    if (options.startAfterDoc) {
        q_parts.push(startAfter(options.startAfterDoc));
    }
    q_parts.push(limit(options.limitCount));

    const q = query(studentsCol, ...q_parts);
    const snapshot = await getDocs(q);
    let students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
    
    if (options.semester) {
        students = students.filter(p => {
             const currentSem = p.currentSemester || calculateCurrentSemester(p.admissionYear, p.admissionPeriod);
             return currentSem === options.semester;
        });
    }
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { students, lastVisible };
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
    const updateData = {
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
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
    const q = query(studentsCol, ...q_parts, orderBy("graduationYear", "desc"), orderBy("lastName", "asc"));
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

        const companyProfileRef = doc(db, 'institutes', institute.id, 'companyProfiles', searchDocId);
        const companyDoc = await getDoc(companyProfileRef);
        if (companyDoc.exists()) {
            const data = companyDoc.data();
            if (data.contactEmail?.toLowerCase().trim() === searchEmail) {
                foundProfile = { ...data as CompanyProfile, type: 'company' };
                foundInstituteId = institute.id;
                break;
            }
        }
    }

    if (!foundProfile || !foundInstituteId) {
        throw new Error("No matching profile found with the provided Document ID and email.");
    }
    if (foundProfile.linkedUserUid) {
        throw new Error("This profile has already been linked to another account.");
    }
    const userDocRef = doc(db, 'users', uid);
    const userUpdateData: Partial<AppUser> = {
        documentId: foundProfile.documentId,
        instituteId: foundInstituteId,
        displayName: (foundProfile as StaffProfile).displayName || (foundProfile as CompanyProfile).name || `${(foundProfile as StudentProfile).firstName} ${(foundProfile as StudentProfile).lastName}`,
    };
    if (foundProfile.role) {
        userUpdateData.role = foundProfile.role;
    }
     if (foundProfile.roleId) {
        userUpdateData.roleId = foundProfile.roleId;
    }
    if ((foundProfile as StudentProfile).programId) {
        (userUpdateData as any).programId = (foundProfile as StudentProfile).programId;
    }
     if (foundProfile.photoURL) {
        userUpdateData.photoURL = foundProfile.photoURL;
    } else if ((foundProfile as CompanyProfile).logoUrl) {
        userUpdateData.photoURL = (foundProfile as CompanyProfile).logoUrl;
    }

    await updateDoc(userDocRef, userUpdateData);
    const profileCollectionName = foundProfile.type === 'staff' ? 'staffProfiles' : (foundProfile.type === 'company' ? 'companyProfiles' : 'studentProfiles');
    const profileDocRef = doc(db, 'institutes', foundInstituteId, profileCollectionName, searchDocId);
    await updateDoc(profileDocRef, { linkedUserUid: uid });
    const instituteName = institutes.find(i => i.id === foundInstituteId)?.name || 'Unknown Institute';
    return { role: foundProfile.role || 'Student', instituteName };
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>): Promise<void> => {
    const activitiesCol = getSubCollectionRef(instituteId, 'nonTeachingActivities');
    await addDoc(activitiesCol, data);
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const activitiesCol = getSubCollectionRef(instituteId, 'nonTeachingActivities');
    const snapshot = await getDocs(query(activitiesCol));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const updateNonTeachingActivity = async (instituteId: string, activityId: string, data: Partial<NonTeachingActivity>): Promise<void> => {
    const activityRef = doc(db, 'institutes', instituteId, 'nonTeachingActivities', activityId);
    await updateDoc(activityRef, data);
};

export const deleteNonTeachingActivity = async (instituteId: string, activityId: string): Promise<void> => {
    const activityRef = doc(db, 'institutes', instituteId, 'nonTeachingActivities', activityId);
    await deleteDoc(activityRef);
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const assignmentsCol = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    const q = query(
        assignmentsCol,
        where("activityId", "==", activityId),
        where("year", "==", year)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
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

export const updateNonTeachingAssignment = async (instituteId: string, assignmentId: string, data: Partial<NonTeachingAssignment>): Promise<void> => {
    const assignmentRef = doc(db, 'institutes', instituteId, 'nonTeachingAssignments', assignmentId);
    await updateDoc(assignmentRef, data);
};

export const deleteNonTeachingAssignment = async (instituteId: string, assignmentId: string): Promise<void> => {
    const assignmentRef = doc(db, 'institutes', instituteId, 'nonTeachingAssignments', assignmentId);
    await deleteDoc(assignmentRef);
};

export const saveNonTeachingAssignmentsForTeacher = async (
    instituteId: string,
    teacherId: string,
    year: string,
    period: UnitPeriod,
    newAssignments: Omit<NonTeachingAssignment, 'id'>[]
): Promise<void> => {
    const batch = writeBatch(db);
    const assignmentsCol = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    const q = query(
        assignmentsCol,
        where("teacherId", "==", teacherId),
        where("year", "==", year),
        where("period", "==", period)
    );
    const existingSnapshot = await getDocs(q);
    existingSnapshot.forEach(doc => { batch.delete(doc.ref); });
    newAssignments.forEach(assignmentData => {
        if (assignmentData.assignedHours > 0) {
            const newDocRef = doc(assignmentsCol);
            batch.set(newDocRef, assignmentData);
        }
    });
    await batch.commit();
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
    const concepts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
    return concepts.sort((a,b) => a.name.localeCompare(b.name));
};

export const updatePaymentConcept = async (instituteId: string, conceptId: string, data: Partial<PaymentConcept>): Promise<void> => {
    const conceptRef = doc(db, 'institutes', instituteId, 'paymentConcepts', conceptId);
    await updateDoc(conceptRef, data);
};

export const deletePaymentConcept = async (instituteId: string, conceptId: string): Promise<void> => {
    const conceptRef = doc(db, 'institutes', instituteId, 'paymentConcepts', conceptId);
    await deleteDoc(conceptRef);
};

export const registerPayment = async (
    instituteId: string, 
    data: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>, 
    voucherFile?: File,
    options: { autoApprove?: boolean, receiptNumber?: string } = {}
): Promise<string> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const paymentDocRef = doc(paymentsCol);
    let downloadURL = '';
    if (voucherFile) {
        downloadURL = await uploadFileAndGetURL(voucherFile, `institutes/${instituteId}/vouchers/${paymentDocRef.id}`);
    }
    const paymentData: Omit<Payment, 'id'> = {
        ...data,
        voucherUrl: downloadURL,
        status: options.autoApprove ? 'Aprobado' : 'Pendiente',
        receiptNumber: options.autoApprove ? options.receiptNumber : undefined,
        processedAt: options.autoApprove ? Timestamp.now() : undefined,
        createdAt: Timestamp.now()
    };
    await setDoc(paymentDocRef, paymentData);
    return paymentDocRef.id;
}

export const bulkRegisterPayments = async (instituteId: string, payments: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt' | 'processedAt'>[]) => {
    const batch = writeBatch(db);
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    payments.forEach(paymentData => {
        const docRef = doc(paymentsCol);
        batch.set(docRef, {
            ...paymentData,
            status: 'Aprobado',
            voucherUrl: '',
            createdAt: Timestamp.now(),
            processedAt: Timestamp.now(),
        });
    });
    await batch.commit();
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

export const getRecentApprovedPayments = async (instituteId: string, limitCount: number = 6): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(
        paymentsCol,
        where("status", "==", "Aprobado"),
        orderBy("processedAt", "desc"),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, from: Date, to: Date): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(
        paymentsCol,
        where("status", "==", "Aprobado"),
        where("processedAt", ">=", from),
        where("processedAt", "<=", to),
        orderBy("processedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (
    instituteId: string, 
    paymentId: string, 
    status: PaymentStatus,
    extraData: { receiptNumber?: string; rejectionReason?: string; annulmentReason?: string; } = {}
): Promise<void> => {
    const paymentRef = doc(db, 'institutes', instituteId, 'payments', paymentId);
    const updateData: any = {
        status,
        processedAt: Timestamp.now(),
        ...extraData
    };
    await updateDoc(paymentRef, updateData);
};

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const catalogCol = getSubCollectionRef(instituteId, 'supplyCatalog');
    const q = query(catalogCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem));
}

export const addSupplyItem = async (instituteId: string, data: Omit<SupplyItem, 'id' | 'stock'>): Promise<void> => {
    const catalogCol = getSubCollectionRef(instituteId, 'supplyCatalog');
    await addDoc(catalogCol, { ...data, stock: 0 }); 
}

export const updateSupplyItem = async (instituteId: string, itemId: string, data: Partial<Omit<SupplyItem, 'id' | 'stock'>>): Promise<void> => {
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    await updateDoc(itemRef, data);
}

export const deleteSupplyItem = async (instituteId: string, itemId: string): Promise<void> => {
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    await deleteDoc(itemRef);
};

export const updateStock = async (instituteId: string, itemId: string, quantityChange: number, notes?: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado.");
    const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
    const historyCol = collection(itemRef, 'stockHistory');
    await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) throw new Error("El insumo no existe en el catálogo.");
        const currentStock = itemDoc.data().stock || 0;
        const newStock = currentStock + quantityChange;
        if (newStock < 0) throw new Error(`Stock insuficiente.`);
        transaction.update(itemRef, { stock: newStock });
        const historyDocRef = doc(historyCol);
        transaction.set(historyDocRef, {
            timestamp: Timestamp.now(),
            userId: user.uid,
            userName: user.displayName || 'Sistema',
            change: quantityChange,
            newStock: newStock,
            notes: notes || (quantityChange > 0 ? 'Entrada de stock' : 'Salida de stock'),
        });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const historyCol = collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'stockHistory');
    const q = query(historyCol, orderBy("timestamp", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockHistoryLog));
};

export const getNextRequestCode = async (instituteId: string): Promise<string> => {
    const counterRef = doc(db, 'institutes', instituteId, 'counters', 'supplyRequests');
    let newCount = 1;
    await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        newCount = (counterSnap.data()?.count || 0) + 1;
        transaction.set(counterRef, { count: newCount }, { merge: true });
    });
    const year = new Date().getFullYear();
    return `PED-${year}-${String(newCount).padStart(4, '0')}`;
}

export const createSupplyRequest = async (instituteId: string, requestData: Omit<SupplyRequest, 'id' | 'createdAt' | 'status' | 'code'>): Promise<void> => {
    const requestsCol = getSubCollectionRef(instituteId, 'supplyRequests');
    const code = await getNextRequestCode(instituteId);
    await addDoc(requestsCol, {
        ...requestData,
        code,
        status: 'Pendiente',
        createdAt: Timestamp.now(),
    });
};

export const createDirectApprovedRequest = async (
    instituteId: string, 
    requestData: Omit<SupplyRequest, 'id' | 'createdAt' | 'status' | 'code'>
) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado.");
    const requestsCol = getSubCollectionRef(instituteId, 'supplyRequests');
    const code = await getNextRequestCode(instituteId);
    const newRequest: Omit<SupplyRequest, 'id'> = {
        ...requestData,
        items: requestData.items.map(item => ({
            ...item,
            approvedQuantity: item.requestedQuantity 
        })),
        code,
        status: 'Aprobado', 
        createdAt: Timestamp.now(),
        approvedById: user.uid, 
        approvedByName: user.displayName || 'Sistema',
        processedAt: Timestamp.now(), 
    };
    await addDoc(requestsCol, newRequest);
};

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

export const updateSupplyRequest = async (instituteId: string, requestId: string, data: Partial<SupplyRequest>): Promise<void> => {
    const requestRef = doc(db, 'institutes', instituteId, 'supplyRequests', requestId);
    const updateData = { ...data };
    if (data.status) {
        updateData.processedAt = Timestamp.now();
    }
    await updateDoc(requestRef, updateData);
};

export const updateSupplyRequestStatus = async (
    instituteId: string, 
    requestId: string, 
    newStatus: SupplyRequestStatus, 
    extraData: { rejectionReason?: string; pecosaCode?: string; annulmentReason?: string; } = {}
): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado.");
    const requestRef = doc(db, 'institutes', instituteId, 'supplyRequests', requestId);
    if (newStatus === 'Entregado') {
        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) throw new Error("Pedido no existe.");
            const requestData = requestDoc.data() as SupplyRequest;
            const supplyItemDocs = new Map<string, DocumentSnapshot>();
            for (const item of requestData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) throw new Error(`Insumo ${item.name} no encontrado.`);
                supplyItemDocs.set(item.itemId, itemDoc);
            }
            for (const item of requestData.items) {
                const itemDoc = supplyItemDocs.get(item.itemId)!;
                const currentStock = itemDoc.data()?.stock || 0;
                const quantityToDeliver = item.approvedQuantity ?? item.requestedQuantity;
                if (currentStock < quantityToDeliver) throw new Error(`Stock insuficiente para "${item.name}".`);
            }
            for (const item of requestData.items) {
                const itemDoc = supplyItemDocs.get(item.itemId)!;
                const itemRef = itemDoc.ref;
                const currentStock = itemDoc.data()?.stock || 0;
                const quantityToDeliver = item.approvedQuantity ?? item.requestedQuantity;
                const newStock = currentStock - quantityToDeliver;
                transaction.update(itemRef, { stock: newStock });
                const historyCol = collection(itemRef, 'stockHistory');
                const historyDocRef = doc(historyCol);
                transaction.set(historyDocRef, {
                    timestamp: Timestamp.now(),
                    userId: user.uid,
                    userName: user.displayName || 'Sistema',
                    change: -quantityToDeliver,
                    newStock: newStock,
                    notes: `Entrega pedido ${requestData.code}`,
                });
            }
            transaction.update(requestRef, {
                status: 'Entregado',
                processedAt: Timestamp.now(),
                deliveredById: user.uid,
                deliveredByName: user.displayName,
                pecosaCode: extraData.pecosaCode || null
            });
        });
    } else if (newStatus === 'Anulado') {
        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) throw new Error("Pedido no existe.");
            const requestData = requestDoc.data() as SupplyRequest;
            for (const item of requestData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) throw new Error(`Insumo ${item.name} no encontrado.`);
                const currentStock = itemDoc.data()?.stock || 0;
                const quantityToReturn = item.approvedQuantity ?? item.requestedQuantity;
                const newStock = currentStock + quantityToReturn;
                transaction.update(itemRef, { stock: newStock });
                const historyCol = collection(itemRef, 'stockHistory');
                const historyDocRef = doc(historyCol);
                transaction.set(historyDocRef, {
                    timestamp: Timestamp.now(),
                    userId: user.uid,
                    userName: user.displayName || 'Sistema',
                    change: quantityToReturn, 
                    newStock: newStock,
                    notes: `Anulación de entrega`,
                });
            }
            transaction.update(requestRef, {
                status: 'Anulado',
                processedAt: Timestamp.now(),
                annulledById: user.uid,
                annulledByName: user.displayName,
                annulmentReason: extraData.annulmentReason || 'Anulado.'
            });
        });
    } else { 
        const updateData: any = { status: newStatus, processedAt: Timestamp.now(), ...extraData };
        if (newStatus === 'Aprobado') {
            updateData.approvedById = user.uid;
            updateData.approvedByName = user.displayName;
        }
        await updateDoc(requestRef, updateData);
    }
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
    return null;
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

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("unitId", "==", unitId), where("year", "==", year), where("period", "==", period));
    const mSnap = await getDocs(q);
    if (mSnap.empty) return [];
    const studentDocIds = mSnap.docs.map(doc => doc.data().studentId);
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const studentQuery = query(studentsCol, where('documentId', 'in', studentDocIds));
    const studentSnapshot = await getDocs(studentQuery);
    return studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
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
    // Firestore rules limit get() and exists() calls to 10 per request.
    // To avoid "Missing or Insufficient Permissions" due to rule complexity,
    // we process updates in chunks.
    const CHUNK_SIZE = 8;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
        chunk.forEach(record => {
            const docRef = doc(recordsCol, record.id);
            batch.set(docRef, record, { merge: true });
        });
        await batch.commit();
    }
}

export const updateAcademicRecord = async (instituteId: string, recordId: string, data: Partial<AcademicRecord>) => {
  const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
  await updateDoc(recordRef, data);
};

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

export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', `${unitId}_${year}_${period}`);
    const docSnap = await getDoc(attendanceRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, attendanceData: AttendanceRecord): Promise<void> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', attendanceData.id);
    await setDoc(attendanceRef, attendanceData, { merge: true });
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus): Promise<void> => {
    const syllabusRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus');
    await setDoc(syllabusRef, data, { merge: true });
}

export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const syllabusRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus');
    const docSnap = await getDoc(syllabusRef);
    return docSnap.exists() ? docSnap.data() as Syllabus : null;
}

const getWeekDocRef = (instituteId: string, unitId: string, weekNumber: number) => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    return doc(plannerCol, `week_${weekNumber}`);
};

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const docSnap = await getDoc(weekDocRef);
    return docSnap.exists() ? docSnap.data() as WeekData : null;
};

export const getWeeksData = async (instituteId: string, unitId: string): Promise<WeekData[]> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    return snapshot.docs.map(doc => ({ weekNumber: parseInt(doc.id.replace('week_', '')), ...doc.data() } as WeekData));
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Content, 'id'>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const newContentId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    if (data.type === 'file' && file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${newContentId}`);
    }
    const newContent: Content = { ...data, id: newContentId, value: data.type === 'file' ? fileUrl : (data.value || ''), createdAt: Timestamp.now() };
    await setDoc(weekDocRef, { contents: arrayUnion(newContent) }, { merge: true });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.contents) return;
    const contentIndex = weekData.contents.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");
    const updatedContent = { ...weekData.contents[contentIndex], ...data };
    if (data.type === 'file' && file) {
        updatedContent.value = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${contentId}`);
    }
    weekData.contents[contentIndex] = updatedContent;
    await updateDoc(weekDocRef, { contents: weekData.contents });
}

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    if (content.type === 'file') {
        try { await deleteObject(ref(firebaseStorage, content.value)); } catch (e) {}
    }
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.contents) return;
    const item = weekData.contents.find(c => c.id === content.id);
    if (item) await updateDoc(weekDocRef, { contents: arrayRemove(item) });
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Task, 'id' | 'createdAt' | 'fileUrl'>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const taskId = doc(collection(db, 'idGenerator')).id;
    let fileUrl = '';
    if (file) {
        fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/reference`);
    }
    
    // Create a clean object without undefined properties to prevent arrayUnion errors
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

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, data: Partial<Task>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.tasks) return;
    const index = weekData.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        let fileUrl = data.fileUrl || weekData.tasks[index].fileUrl;
        if (file) {
            fileUrl = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/reference`);
        }
        
        // Merge and clean object
        const updatedTask = { ...weekData.tasks[index], ...data, fileUrl };
        const cleanedTask = Object.fromEntries(
            Object.entries(updatedTask).filter(([_, v]) => v !== undefined)
        );

        weekData.tasks[index] = cleanedTask as Task;
        await updateDoc(weekDocRef, { tasks: weekData.tasks });
    }
}

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.tasks) return;
    const item = weekData.tasks.find(t => t.id === taskId);
    if (item) await updateDoc(weekDocRef, { tasks: arrayRemove(item) });
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    await setDoc(weekDocRef, { isVisible, weekNumber }, { merge: true });
};

export const getWeeksVisibility = async (instituteId: string, unitId: string): Promise<Record<string, boolean>> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    const visibilityMap: Record<string, boolean> = {};
    snapshot.forEach(doc => { visibilityMap[doc.id] = doc.data().isVisible || false; });
    return visibilityMap;
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: Partial<WeekData>) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const safeData = { ...data, weekNumber, capacityElement: data.capacityElement || '', learningActivities: data.learningActivities || '', basicContents: data.basicContents || '' };
    setDoc(weekDocRef, safeData, { merge: true }).catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: weekDocRef.path, operation: 'write', requestResourceData: safeData }));
    });
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

export const deleteRole = async (instituteId: string, roleId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'student') return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true, 'student:jobs:view': true, 'student:jobs:apply': true } as any;
    if (roleId === 'teacher') return { 'teacher:unit:view': true, 'teacher:efsrt:supervise': true } as any;
    if (roleId === 'company') return { 'company:jobs:manage': true, 'company:applicants:view': true } as any;
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
    if (docSnap.exists()) {
        const permissions = docSnap.data().permissions;
        if (Array.isArray(permissions)) {
            const map: any = {};
            permissions.forEach((p: any) => { map[p] = true; });
            return map;
        }
        return permissions;
    }
    return null;
}

export const addAccessPoint = async (instituteId: string, data: Omit<AccessPoint, 'id'>): Promise<void> => {
    await addDoc(getSubCollectionRef(instituteId, 'accessPoints'), data);
};

export const getAccessPoint = async (instituteId: string, accessPointId: string): Promise<AccessPoint | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'accessPoints', accessPointId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AccessPoint : null;
}

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'accessPoints'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const updateAccessPoint = async (instituteId: string, docId: string, data: Partial<AccessPoint>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'accessPoints', docId), data);
};

export const deleteAccessPoint = async (instituteId: string, docId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'accessPoints', docId));
};

export const listenToAllAccessLogs = (instituteId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog))); });
};

export const getAccessLogsPaginated = async (options: {
    instituteId: string;
    accessPointId?: string;
    userDocumentId?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount: number;
    startAfterDoc?: DocumentSnapshot | null;
}): Promise<{ logs: AccessLog[], lastVisible: DocumentSnapshot | null }> => {
    const q_parts: any[] = [
        where('instituteId', '==', options.instituteId),
    ];

    if (options.accessPointId && options.pointId !== 'all') {
        q_parts.push(where('accessPointId', '==', options.accessPointId));
    }

    if (options.userDocumentId) {
        q_parts.push(where('userDocumentId', '==', options.userDocumentId));
    }

    if (options.startDate) {
        q_parts.push(where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
    }
    if (options.endDate) {
        q_parts.push(where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
    }

    q_parts.push(orderBy('timestamp', 'desc'));

    if (options.startAfterDoc) {
        q_parts.push(startAfter(options.startAfterDoc));
    }

    q_parts.push(limit(options.limitCount));

    const q = query(collectionGroup(db, 'accessLogs'), ...q_parts);
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { logs, lastVisible };
};

export const listenToAccessLogsForPoint = (instituteId: string, accessPointDocId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog))); });
};

export const listenToAccessLogsForUser = (instituteId: string, userDocumentId: string, callback: (logs: AccessLog[]) => void): Unsubscribe => {
    const q = query(collectionGroup(db, 'accessLogs'), where('instituteId', '==', instituteId), where('userDocumentId', '==', userDocumentId), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog))); });
};

export const getMonthlyAccessLogs = async (instituteId: string, year: number, month: number, accessPointId?: string): Promise<AccessLog[]> => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    
    const q_parts: any[] = [
        where('instituteId', '==', instituteId),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end)),
        orderBy('timestamp', 'asc')
    ];

    if (accessPointId && accessPointId !== 'all') {
        q_parts.push(where('accessPointId', '==', accessPointId));
    }

    const q = query(collectionGroup(db, 'accessLogs'), ...q_parts);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
}

export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData | null> => {
    const [allPrograms, allUnits, allStaff] = await Promise.all([getPrograms(instituteId), getUnits(instituteId), getStaffProfiles(instituteId)]);
    const program = allPrograms.find(p => p.id === programId);
    if (!program) return null;
    const teacherMap = new Map(allStaff.map(s => [s.documentId, s.displayName]));
    const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
    const assignments = await getAssignments(instituteId, year, programId);
    const reportUnits = await Promise.all(unitsForSemester.map(async (unit) => {
        const teacherId = assignments[unit.period]?.[unit.id];
        const matriculationQuery = query(getSubCollectionRef(instituteId, 'matriculations'), where("unitId", "==", unit.id), where("year", "==", year));
        const mSnap = await getDocs(matriculationQuery);
        const studentIds = mSnap.docs.map(d => d.data().studentId);
        let students: StudentProfile[] = [];
        if (studentIds.length > 0) {
            const studentSnapshot = await getDocs(query(getSubCollectionRef(instituteId, 'studentProfiles'), where('documentId', 'in', studentIds)));
            students = studentSnapshot.docs.map(d => d.data() as StudentProfile).sort((a,b) => a.lastName.localeCompare(b.lastName));
        }
        return { unit, teacherName: teacherId ? teacherMap.get(teacherId) || null : null, students };
    }));
    return { program, units: reportUnits };
};

export const addBuilding = async (instituteId: string, data: Omit<Building, 'id'>): Promise<void> => {
    await addDoc(getSubCollectionRef(instituteId, 'buildings'), data);
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'buildings'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
};

export const updateBuilding = async (instituteId: string, buildingId: string, data: Partial<Building>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId), data);
};

export const deleteBuilding = async (instituteId: string, buildingId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId));
};
    
export const addEnvironment = async (instituteId: string, buildingId: string, data: Omit<Environment, 'id'>): Promise<void> => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), { ...data, buildingId });
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), orderBy("name")));
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, buildingId, ...docSnap.data() } as Environment));
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const buildings = await getBuildings(instituteId);
    let all: Environment[] = [];
    for (const b of buildings) { all = all.concat(await getEnvironmentsForBuilding(instituteId, b.id)); }
    return all;
};

export const updateEnvironment = async (instituteId: string, buildingId: string, envId: string, data: Partial<Environment>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId), data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, envId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId));
};

export const getAssetTypes = async (instituteId: string, options?: { search?: string; limit?: number }): Promise<AssetType[]> => {
    const q_parts: any[] = [];
    if (options?.search) {
        const s = options.search.toUpperCase(); 
        q_parts.push(where('name', '>=', s), where('name', '<=', s + '\uf8ff'));
    }
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'assetTypes'), ...q_parts, orderBy("name"), limit(options?.limit || 20)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
};

export const getAssetTypeById = async (instituteId: string, assetTypeId: string): Promise<AssetType | null> => {
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AssetType : null;
};

export const addAssetType = async (instituteId: string, data: Omit<AssetType, 'id' | 'lastAssignedNumber'>): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'assetTypes', data.patrimonialCode), { ...data, lastAssignedNumber: 0 }, { merge: true });
};

export const bulkAddAssetTypes = async (instituteId: string, assetTypes: Omit<AssetType, 'id' | 'lastAssignedNumber'>[]) => {
    const batch = writeBatch(db);
    assetTypes.forEach(t => { batch.set(doc(db, 'institutes', instituteId, 'assetTypes', t.patrimonialCode), { ...t, lastAssignedNumber: 0 }, { merge: true }); });
    await batch.commit();
};

export const updateAssetType = async (instituteId: string, assetTypeId: string, data: Partial<AssetType>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId), data);
};

export const deleteAssetType = async (instituteId: string, assetTypeId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId));
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

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, assetTypeId: string, data: Partial<Omit<Asset, 'id' | 'assetTypeId' | 'name' | 'codeOrSerial' | 'type'>>) => {
    const user = auth.currentUser;
    const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    let newCode = '';
    await runTransaction(db, async (transaction) => {
        const typeDoc = await transaction.get(typeRef);
        if (!typeDoc.exists()) throw new Error("Tipo no existe.");
        const typeData = typeDoc.data() as AssetType;
        const newNum = (typeData.lastAssignedNumber || 0) + 1;
        newCode = `${typeData.patrimonialCode}-${String(newNum).padStart(4, '0')}`;
        transaction.update(typeRef, { lastAssignedNumber: newNum });
        const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
        const assetData: Omit<Asset, 'id'> = { ...data, assetTypeId, name: typeData.name, type: typeData.class, codeOrSerial: newCode, instituteId, buildingId, environmentId } as any;
        transaction.set(assetRef, assetData);
        if (user) {
            transaction.set(doc(collection(assetRef, 'history')), { action: 'create', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Creado.` });
        }
    });
    return newCode;
};

export const updateAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string, data: Partial<Asset>): Promise<void> => {
    const user = auth.currentUser;
    const assetRef = doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', assetId);
    if(user) {
        const oldSnap = await getDoc(assetRef);
        if (oldSnap.exists()) {
             await addDoc(collection(assetRef, 'history'), { action: 'update', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Actualizado.` });
        }
    }
    await updateDoc(assetRef, data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', assetId));
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], newStatus: string): Promise<void> => {
    const user = auth.currentUser;
    const batch = writeBatch(db);
    assets.forEach(asset => {
        const assetRef = doc(db, 'institutes', instituteId, 'buildings', asset.buildingId, 'environments', asset.environmentId, 'assets', asset.id);
        batch.update(assetRef, { status: newStatus });
        if (user) batch.set(doc(collection(assetRef, 'history')), { action: 'status_change', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Estado a ${newStatus}.` });
    });
    await batch.commit();
}

export const moveAssets = async (instituteId: string, assetsToMove: Asset[], targetEnvironment: Environment): Promise<void> => {
  const user = auth.currentUser;
  const batch = writeBatch(db);
  assetsToMove.forEach(asset => {
    batch.delete(doc(db, 'institutes', instituteId, 'buildings', asset.buildingId, 'environments', asset.environmentId, 'assets', asset.id));
    const newRef = doc(collection(db, 'institutes', instituteId, 'buildings', targetEnvironment.buildingId, 'environments', targetEnvironment.id, 'assets'));
    const { id, buildingId, environmentId, buildingName, environmentName, ...rest } = asset;
    batch.set(newRef, { ...rest, instituteId, buildingId: targetEnvironment.buildingId, environmentId: targetEnvironment.id });
    if (user) batch.set(doc(collection(newRef, 'history')), { action: 'move', userId: user.uid, userName: user.displayName || 'Sistema', timestamp: Timestamp.now(), details: `Movido a ${targetEnvironment.name}.` });
  });
  await batch.commit();
};

export const getAssetHistory = async (instituteId: string, buildingId: string, environmentId: string, assetId: string): Promise<AssetHistoryLog[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId, 'history'), orderBy("timestamp", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetHistoryLog));
}

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'scheduleTemplates'), orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
};

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const q = query(getSubCollectionRef(instituteId, 'scheduleTemplates'), where("isDefault", "==", true), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
        const any = await getDocs(query(getSubCollectionRef(instituteId, 'scheduleTemplates'), limit(1)));
        return any.empty ? null : { id: any.docs[0].id, ...any.docs[0].data() } as ScheduleTemplate;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const addScheduleTemplate = async (instituteId: string, data: Omit<ScheduleTemplate, 'id'>): Promise<string> => {
    const docRef = await addDoc(getSubCollectionRef(instituteId, 'scheduleTemplates'), data);
    return docRef.id;
};

export const updateScheduleTemplate = async (instituteId: string, templateId: string, data: Partial<ScheduleTemplate>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', templateId), data);
};

export const deleteScheduleTemplate = async (instituteId: string, templateId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', templateId));
};

export const setDefaultScheduleTemplate = async (instituteId: string, templateId: string): Promise<void> => {
    const col = getSubCollectionRef(instituteId, 'scheduleTemplates');
    const batch = writeBatch(db);
    (await getDocs(query(col, where("isDefault", "==", true)))).forEach(doc => { batch.update(doc.ref, { isDefault: false }); });
    batch.update(doc(col, templateId), { isDefault: true });
    await batch.commit();
}

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

export const getSchedule = async (instituteId: string, programId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'schedules', `${programId}_${year}_${semester}`));
    return snap.exists() ? snap.data().schedule || {} : {};
}

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'schedules'));
    const all: any = {};
    snap.forEach(doc => { if (doc.data().year === year && doc.data().semester === semester) Object.assign(all, doc.data().schedule); });
    return all;
}

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const snap = await getDocs(query(getSubCollectionRef(instituteId, 'schedules'), where("year", "==", year)));
    const all: ScheduleBlock[] = [];
    snap.forEach(doc => { if (doc.data().schedule) Object.values(doc.data().schedule as any).forEach((b: any) => all.push(b)); });
    return all;
}

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, schedule: Record<string, ScheduleBlock>): Promise<void> => {
    await setDoc(doc(db, 'institutes', instituteId, 'schedules', `${programId}_${year}_${semester}`), { schedule, programId, year, semester, turno }, { merge: true });
}

export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'news'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};

export const addNews = async (instituteId: string, data: Omit<News, 'id' | 'createdAt'>, imageFile?: File): Promise<string> => {
    const col = getSubCollectionRef(instituteId, 'news');
    const newRef = doc(col);
    let url = '';
    if (imageFile) url = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${newRef.id}`);
    await setDoc(newRef, { ...data, imageUrl: url, createdAt: Timestamp.now() });
    return newRef.id;
};

export const updateNews = async (instituteId: string, newsId: string, data: Partial<News>, imageFile?: File): Promise<void> => {
    const update: any = { ...data };
    if (imageFile) update.imageUrl = await uploadFileAndGetURL(imageFile, `institutes/${instituteId}/news/${newsId}`);
    await updateDoc(doc(db, 'institutes', instituteId, 'news', newsId), update);
};

export const deleteNews = async (instituteId: string, newsItem: News): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'news', newsItem.id));
    if (newsItem.imageUrl) try { await deleteObject(ref(firebaseStorage, newsItem.imageUrl)); } catch (e) {}
};

export const addAlbum = async (instituteId: string, data: Omit<Album, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(getSubCollectionRef(instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
    return docRef.id;
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snapshot = await getDocs(query(getSubCollectionRef(instituteId, 'albums'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
};

export const getAlbum = async (instituteId: string, albumId: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', albumId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const updateAlbum = async (instituteId: string, albumId: string, data: Partial<Album>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', albumId), data);
};

export const deleteAlbum = async (instituteId: string, albumId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId));
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const snapshot = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]): Promise<void> => {
    const batch = writeBatch(db);
    const col = collection(db, 'institutes', instituteId, 'albums', albumId, 'photos');
    let first = '';
    for (const f of files) {
        const pRef = doc(col);
        const url = await uploadFileAndGetURL(f, `institutes/${instituteId}/albums/${albumId}/${pRef.id}`);
        if (!first) first = url;
        batch.set(pRef, { albumId, url, createdAt: Timestamp.now() });
    }
    if (first) {
        const aSnap = await getDoc(doc(db, 'institutes', instituteId, 'albums', albumId));
        if (aSnap.exists() && !aSnap.data().coverImageUrl) batch.update(aSnap.ref, { coverImageUrl: first });
    }
    await batch.commit();
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
    try { await deleteObject(ref(firebaseStorage, photo.url)); } catch (e) {}
};

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supervisorId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() });
};

export const updateEFSRTAssignment = async (instituteId: string, assignmentId: string, data: Partial<EFSRTAssignment>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), data);
};

export const deleteEFSRTAssignment = async (instituteId: string, assignmentId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId));
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { visits: arrayUnion({ ...visit, id: Math.random().toString(36).substring(7) }) });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { grade, observations, status: grade >= 13 ? 'Aprobado' : 'Desaprobado' });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl']: url });
};

export const saveEFSRTReportUrl = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', url: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl']: url });
};

export const checkEgresoEligibility = async (instituteId: string, studentId: string): Promise<StudentEgresoAudit> => {
    const [history, assignments, s] = await Promise.all([getMatriculationsForStudent(instituteId, studentId), getEFSRTAssignmentsForStudent(instituteId, studentId), getStudentProfile(instituteId, studentId)]);
    if (!s) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };
    const prog = (await getPrograms(instituteId)).find(p => p.id === s.programId);
    const units = (await getUnits(instituteId)).filter(u => u.programId === s.programId);
    const pendingUnits = units.filter(u => !history.some(m => m.unitId === u.id && m.status === 'aprobado')).map(u => u.name);
    const pendingEFSRT = (prog?.modules.map(m => m.code) || []).filter(m => !assignments.some(a => a.moduleId === m && a.status === 'Aprobado')).map(m => prog?.modules.find(x => x.code === m)?.name || m);
    return { eligible: pendingUnits.length === 0 && pendingEFSRT.length === 0, pendingUnits, pendingEFSRT };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, graduationYear: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', studentId), { academicStatus: 'Egresado', graduationYear });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
};

export const submitTask = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, s: StudentProfile, file?: File, link?: string) => {
    let url = '';
    if (file) url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/submissions/${s.documentId}`);
    const data: any = { studentName: s.fullName, submittedAt: Timestamp.now() };
    if (url) data.fileUrl = url;
    if (link) data.link = link;
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', s.documentId), data, { merge: true });
};

export const gradeTaskSubmission = async (instituteId: string, unitId: string, period: UnitPeriod, week: number, tId: string, tTitle: string, sId: string, studentName: string, grade: number, feedback: string) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${week}`, 'tasks', tId, 'submissions', sId), { 
        grade, 
        feedback,
        studentName,
    }, { merge: true });
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${sId}_${new Date().getFullYear()}_${period}`);
    const ind = (await getAchievementIndicators(instituteId, unitId)).find(i => week >= i.startWeek && week <= i.endWeek);
    if (ind) {
        const grades = (await getDoc(recordRef)).data()?.grades || {};
        if (!grades[ind.id]) grades[ind.id] = [];
        const idx = grades[ind.id].findIndex((g: any) => g.refId === tId);
        if (idx !== -1) grades[ind.id][idx] = { type: 'task', refId: tId, label: tTitle, grade, weekNumber: week };
        else grades[ind.id].push({ type: 'task', refId: tId, label: tTitle, grade, weekNumber: week });
        await setDoc(recordRef, { grades }, { merge: true });
    }
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]) => {
    // Optimization: Fetch all relevant matriculations first
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("unitId", "==", unitId), where("year", "==", year));
    const mSnap = await getDocs(q);
    
    // Map matriculations to students for quick lookup
    const mIdsByStudent = new Map<string, string[]>();
    mSnap.forEach(d => {
        const sId = d.data().studentId;
        if (!mIdsByStudent.has(sId)) mIdsByStudent.set(sId, []);
        mIdsByStudent.get(sId)!.push(d.id);
    });

    // Process closing in chunks of 5 students (each student updates 1 record + matriculations)
    const CHUNK_SIZE = 5;
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
        const chunk = results.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        chunk.forEach(r => {
            // Update Academic Record
            const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${r.studentId}_${year}_${period}`);
            batch.update(recordRef, { finalGrade: r.finalGrade, status: r.status });
            
            // Update associated Matriculations
            const mIds = mIdsByStudent.get(r.studentId) || [];
            mIds.forEach(mId => {
                batch.update(doc(matriculationsCol, mId), { status: r.status });
            });
        });
        
        await batch.commit();
    }
};

export const deleteMatriculation = async (instituteId: string, studentId: string, mId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'matriculations', mId));
}

export const bulkCreateMatriculations = async (instituteId: string, studentIds: string[], units: Unit[], year: string, semester: number) => {
    const batch = writeBatch(db);
    for (const sId of studentIds) {
        units.forEach(u => { batch.set(doc(getSubCollectionRef(instituteId, 'matriculations')), { studentId: sId, unitId: u.id, programId: u.programId, year, period: u.period, semester: u.semester, moduleId: u.moduleId, status: 'cursando', createdAt: Timestamp.now() }); });
        batch.update(doc(getSubCollectionRef(instituteId, 'studentProfiles'), sId), { currentSemester: semester });
    }
    await batch.commit();
};

export const registerHistoricalMatriculation = async (instituteId: string, sId: string, u: Unit, data: { year: string, period: UnitPeriod, grade: number }) => {
    const batch = writeBatch(db);
    batch.set(doc(getSubCollectionRef(instituteId, 'matriculations')), { studentId: sId, unitId: u.id, programId: u.programId, year: data.year, period: data.period, semester: u.semester, moduleId: u.moduleId, status: 'aprobado', createdAt: Timestamp.now() });
    batch.set(doc(db, 'institutes', instituteId, 'academicRecords', `${u.id}_${sId}_${data.year}_${data.period}`), { id: `${u.id}_${sId}_${data.year}_${data.period}`, studentId: sId, unitId: u.id, programId: u.programId, year: data.year, period: data.period, finalGrade: data.grade, status: 'aprobado', grades: {}, evaluations: {} }, { merge: true });
    await batch.commit();
};

export const registerHistoricalEFSRT = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Aprobado', visits: [], createdAt: Timestamp.now() });
};

export const setVirtualClassroomStatus = async (instituteId: string, unitId: string, status: boolean) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, { isVirtualClassroomActive: status });
};

export const saveAttendanceLimitWeek = async (instituteId: string, unitId: string, limitWeek: number) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, { attendanceLimitWeek: limitWeek });
};

// --- Bolsa Laboral Functions ---

export const getCompanyProfiles = async (instituteId: string): Promise<CompanyProfile[]> => {
    const snap = await getDocs(getSubCollectionRef(instituteId, 'companyProfiles'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyProfile));
};

export const addCompanyProfile = async (instituteId: string, data: Omit<CompanyProfile, 'linkedUserUid' | 'logoUrl'>, logoFile?: File) => {
    const profileRef = doc(db, 'institutes', instituteId, 'companyProfiles', data.documentId);
    let logoUrl = '';
    if (logoFile) {
        logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/companies/${data.documentId}/logo`);
    }
    await setDoc(profileRef, { ...data, logoUrl, instituteId, linkedUserUid: null });
};

export const updateCompanyProfile = async (instituteId: string, ruc: string, data: Partial<CompanyProfile>, logoFile?: File) => {
    const profileRef = doc(db, 'institutes', instituteId, 'companyProfiles', ruc);
    const updateData: any = { ...data };
    if (logoFile) {
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${instituteId}/companies/${ruc}/logo`);
    }
    await updateDoc(profileRef, updateData);
};

export const deleteCompanyProfile = async (instituteId: string, ruc: string) => {
    const profileRef = doc(db, 'institutes', instituteId, 'companyProfiles', ruc);
    await deleteDoc(profileRef);
};

export const addJobOffer = async (instituteId: string, data: Omit<JobOffer, 'id' | 'createdAt' | 'status'>) => {
    const col = getSubCollectionRef(instituteId, 'jobOffers');
    await addDoc(col, { ...data, status: 'Abierta', createdAt: Timestamp.now() });
};

export const updateJobOffer = async (instituteId: string, offerId: string, data: Partial<JobOffer>) => {
    const offerRef = doc(db, 'institutes', instituteId, 'jobOffers', offerId);
    await updateDoc(offerRef, data);
};

export const deleteJobOffer = async (instituteId: string, offerId: string) => {
    const offerRef = doc(db, 'institutes', instituteId, 'jobOffers', offerId);
    await deleteDoc(offerRef);
};

export const getJobOffers = async (instituteId: string, options: { programId?: string, companyId?: string } = {}): Promise<JobOffer[]> => {
    const col = getSubCollectionRef(instituteId, 'jobOffers');
    const q_parts = [orderBy('createdAt', 'desc')];
    
    if (options.companyId) q_parts.unshift(where('companyId', '==', options.companyId));
    else q_parts.unshift(where('status', '==', 'Abierta')); // Students only see open offers
    
    const snap = await getDocs(query(col, ...q_parts));
    let offers = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobOffer));
    
    if (options.programId) {
        offers = offers.filter(o => o.programIds.includes(options.programId!) || o.programIds.length === 0);
    }
    
    return offers;
};

export const applyToJob = async (instituteId: string, application: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>) => {
    const col = getSubCollectionRef(instituteId, 'jobApplications');
    const q = query(col, where('jobId', '==', application.jobId), where('studentId', '==', application.studentId));
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error("Ya has postulado a esta oferta.");
    
    await addDoc(col, { ...application, status: 'Pendiente', appliedAt: Timestamp.now() });
};

export const getJobApplications = async (instituteId: string, jobId: string): Promise<JobApplication[]> => {
    const col = getSubCollectionRef(instituteId, 'jobApplications');
    const snap = await getDocs(query(col, where('jobId', '==', jobId), orderBy('appliedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
};

export const getApplicationsForStudent = async (instituteId: string, studentId: string): Promise<JobApplication[]> => {
    const col = getSubCollectionRef(instituteId, 'jobApplications');
    const snap = await getDocs(query(col, where('studentId', '==', studentId), orderBy('appliedAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
};
