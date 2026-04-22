
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, Delivery, EFSRTAssignment, EFSRTStatus, EFSRTVisit, UnitTurno, TaskSubmission } from '@/types';
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
const firebaseStorage = getStorage(app);

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

// Client-side file upload function
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};


export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: UserRole, instituteId: string | null) => {
  console.log(`Saving additional data for UID: ${user.uid}, Role: ${role}, Institute: ${instituteId}`);
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
    console.log("User data saved to Firestore.");
  } catch (error) {
    console.error("Error saving user data to Firestore:", error);
    throw error;
  }
};

export const updateUserProfile = async (data: { displayName?: string | null; photoURL?: string | null, documentId?: string | null }) => {
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
        
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, firestoreUpdates);
        }
    } catch (error) {
        console.error(`Error updating user profile for ${user.uid}:`, error);
        throw error;
    }
};


// --- Institute Management (for SuperAdmins) ---
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

// --- Login Design Management ---
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

// --- Login Image Management ---
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

// --- User Management ---
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

// --- Institute-Specific Data Management ---

const getSubCollectionRef = (instituteId: string, collectionName: string) => {
    return collection(db, 'institutes', instituteId, collectionName);
}

// Programs
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

// Units
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


// Teachers (derived from StaffProfiles)
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


// Assignments
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



// STAFF PROFILES
export const addStaffProfile = async (instituteId: string, data: Omit<StaffProfile, 'linkedUserUid'>) => {
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    const profileRef = doc(staffCol, data.documentId); 
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
        throw new Error(`Un perfil con el documento ${data.documentId} ya existe.`);
    }

    await setDoc(profileRef, { ...data, linkedUserUid: null });
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
        batch.set(docRef, staffData);
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

// STUDENT PROFILES
export const addStudentProfile = async (instituteId: string, data: Omit<StudentProfile, 'fullName' | 'linkedUserUid' | 'id'>) => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const profileRef = doc(studentsCol, data.documentId);
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
        throw new Error(`Un perfil de estudiante con el documento ${data.documentId} ya existe.`);
    }

    const profileData: Omit<StudentProfile, 'id'> = {
        ...data,
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
            fullName: `${studentData.firstName} ${studentData.lastName}`,
            linkedUserUid: null,
        };
        batch.set(docRef, profileData);
    });
    await batch.commit();
};
    
// --- Profile Linking ---
export const linkUserToProfile = async (uid: string, documentId: string, email: string) => {
    const institutes = await getInstitutes();
    let foundProfile: (StaffProfile | StudentProfile) & { type: 'staff' | 'student' } | null = null;
    let foundInstituteId: string | null = null;

    for (const institute of institutes) {
        const staffProfileRef = doc(db, 'institutes', institute.id, 'staffProfiles', documentId);
        const staffDoc = await getDoc(staffProfileRef);
        if (staffDoc.exists() && staffDoc.data().email === email) {
            foundProfile = { ...staffDoc.data() as StaffProfile, type: 'staff' };
            foundInstituteId = institute.id;
            break;
        }

        const studentProfileRef = doc(db, 'institutes', institute.id, 'studentProfiles', documentId);
        const studentDoc = await getDoc(studentProfileRef);
        if (studentDoc.exists() && studentDoc.data().email === email) {
            foundProfile = { ...studentDoc.data() as StudentProfile, type: 'student' };
            foundInstituteId = institute.id;
            break;
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
        displayName: (foundProfile as StaffProfile).displayName || `${(foundProfile as StudentProfile).firstName} ${(foundProfile as StudentProfile).lastName}`,
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
    }

    await updateDoc(userDocRef, userUpdateData);

    const profileCollectionName = foundProfile.type === 'staff' ? 'staffProfiles' : 'studentProfiles';
    const profileDocRef = doc(db, 'institutes', foundInstituteId, profileCollectionName, documentId);
    await updateDoc(profileDocRef, {
        linkedUserUid: uid
    });

    const instituteName = institutes.find(i => i.id === foundInstituteId)?.name || 'Unknown Institute';

    return { 
        role: foundProfile.role || 'Student', 
        instituteName 
    };
};

// --- NON-TEACHING ACTIVITIES ---
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


// --- NON-TEACHING ASSIGNMENTS ---
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
    existingSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    newAssignments.forEach(assignmentData => {
        if (assignmentData.assignedHours > 0) {
            const newDocRef = doc(assignmentsCol);
            batch.set(newDocRef, assignmentData);
        }
    });

    await batch.commit();
};


// --- PAYMENTS ---
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
): Promise<void> => {
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
}

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

// --- SUPPLIES / ABASTECIMIENTO ---
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
        if (!itemDoc.exists()) {
            throw new Error("El insumo no existe en el catálogo.");
        }

        const currentStock = itemDoc.data().stock || 0;
        const newStock = currentStock + quantityChange;

        if (newStock < 0) {
            throw new Error(`Stock insuficiente para "${itemDoc.data().name}". Stock actual: ${currentStock}, se intentó retirar: ${Math.abs(quantityChange)}.`);
        }

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
            if (!requestDoc.exists()) {
                throw new Error("El pedido no existe.");
            }
            const requestData = requestDoc.data() as SupplyRequest;

            if (requestData.status !== 'Aprobado') {
                throw new Error("Solo se pueden entregar pedidos que han sido aprobados.");
            }
            if (requestData.status === 'Entregado') {
                throw new Error("Este pedido ya ha sido marcado como entregado.");
            }
            
            const supplyItemDocs = new Map<string, DocumentSnapshot>();

            // 1. READ PHASE
            for (const item of requestData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) {
                    throw new Error(`Insumo ${item.name} no encontrado en el catálogo.`);
                }
                supplyItemDocs.set(item.itemId, itemDoc);
            }

            // 2. VALIDATION PHASE
            for (const item of requestData.items) {
                const itemDoc = supplyItemDocs.get(item.itemId)!;
                const currentStock = itemDoc.data()?.stock || 0;
                const quantityToDeliver = item.approvedQuantity ?? item.requestedQuantity;
                if (currentStock < quantityToDeliver) {
                    throw new Error(`Stock insuficiente para "${item.name}". Stock actual: ${currentStock}, se necesita: ${quantityToDeliver}.`);
                }
            }

            // 3. WRITE PHASE
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
                    notes: `Entrega pedido ${requestData.code} a ${requestData.requesterName}`,
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
            if (!requestDoc.exists()) throw new Error("El pedido no existe.");
            
            const requestData = requestDoc.data() as SupplyRequest;
            if (requestData.status !== 'Entregado') throw new Error("Solo se pueden anular pedidos que ya han sido entregados.");

            for (const item of requestData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) throw new Error(`Insumo ${item.name} no encontrado en el catálogo.`);
                
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
                    notes: `Anulación de entrega para pedido ${requestData.code}.`,
                });
            }

            transaction.update(requestRef, {
                status: 'Anulado',
                processedAt: Timestamp.now(),
                annulledById: user.uid,
                annulledByName: user.displayName,
                annulmentReason: extraData.annulmentReason || 'Anulado por administrador.'
            });
        });
    } else { 
        const updateData: any = {
            status: newStatus,
            processedAt: Timestamp.now(),
            ...extraData
        };
        if (newStatus === 'Aprobado') {
            updateData.approvedById = user.uid;
            updateData.approvedByName = user.displayName;
        }
        await updateDoc(requestRef, updateData);
    }
};


// --- ACADEMIC & MATRICULATION TYPES ---

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'academicYears', year);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as AcademicYearSettings;
    }
    return null;
}

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'academicYears', year);
    await setDoc(docRef, data, { merge: true });
}

export const createMatriculations = async (
    instituteId: string,
    studentId: string,
    units: Unit[],
    year: string
) => {
    const batch = writeBatch(db);
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');

    units.forEach(unit => {
        const matriculationDocRef = doc(matriculationsCol);
        const matriculationData: Omit<Matriculation, 'id'> = {
            studentId: studentId,
            unitId: unit.id,
            programId: unit.programId,
            year: year,
            period: unit.period,
            semester: unit.semester,
            moduleId: unit.moduleId,
            status: 'cursando',
            createdAt: Timestamp.now()
        };
        batch.set(matriculationDocRef, matriculationData);
    });

    await batch.commit();
};

export const getEnrolledUnits = async (instituteId: string, studentId: string): Promise<EnrolledUnit[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("studentId", "==", studentId));
    
    const matriculationSnapshot = await getDocs(q);
    if (matriculationSnapshot.empty) {
        return [];
    }

    const unitIds = Array.from(new Set(matriculationSnapshot.docs.map(doc => doc.data().unitId)));
    
    const [programs, allUnits] = await Promise.all([
        getPrograms(instituteId),
        getUnits(instituteId)
    ]);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    const unitMap = new Map(allUnits.map(u => [u.id, u]));

    const enrolledUnits: EnrolledUnit[] = [];
    unitIds.forEach(unitId => {
        const unit = unitMap.get(unitId);
        if (unit) {
            const program = programMap.get(unit.programId);
            enrolledUnits.push({
                ...unit,
                programName: program?.name || 'Programa Desconocido'
            });
        }
    });

    return enrolledUnits;
};

export const getMatriculationsForStudent = async (instituteId: string, studentId: string): Promise<Matriculation[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    const matriculations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));

    matriculations.sort((a, b) => {
        if (a.year !== b.year) {
            return b.year.localeCompare(a.year); 
        }
        return b.period.localeCompare(a.period); 
    });
    
    return matriculations;
};


export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const q = query(matriculationsCol, 
        where("unitId", "==", unitId),
        where("year", "==", year),
        where("period", "==", period)
    );
    
    const matriculationSnapshot = await getDocs(q);
    if (matriculationSnapshot.empty) return [];

    const studentDocIds = matriculationSnapshot.docs.map(doc => doc.data().studentId);
    
    if (studentDocIds.length === 0) return [];
    
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const studentQuery = query(studentsCol, where('documentId', 'in', studentDocIds));
    const studentSnapshot = await getDocs(studentQuery);
    
    return studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
};

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    const q = query(indicatorsCol, orderBy("name"));
    const snapshot = await getDocs(q);
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
  const q = query(recordsCol, 
    where("unitId", "==", unitId),
    where("year", "==", year),
    where("period", "==", period)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordForStudent = async (instituteId: string, unitId: string, studentId: string, year: string, period: UnitPeriod): Promise<AcademicRecord | null> => {
    const recordId = `${unitId}_${studentId}_${year}_${period}`;
    const recordRef = doc(getSubCollectionRef(instituteId, 'academicRecords'), recordId);
    const docSnap = await getDoc(recordRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AcademicRecord;
    }
    return null;
}


export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const batch = writeBatch(db);
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');

    records.forEach(record => {
        const docRef = doc(recordsCol, record.id);
        batch.set(docRef, record, { merge: true });
    });

    await batch.commit();
}

export const updateAcademicRecord = async (instituteId: string, recordId: string, data: Partial<AcademicRecord>) => {
  const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
  await updateDoc(recordRef, data);
};


export const addManualEvaluationToRecord = async (
    instituteId: string,
    unitId: string, 
    year: string, 
    period: UnitPeriod,
    studentIds: string[],
    newEvaluation: Omit<ManualEvaluation, 'id' | 'createdAt'>
) => {
    const batch = writeBatch(db);
    const evaluationId = doc(collection(db, 'idGenerator')).id; 
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');

    for (const studentId of studentIds) {
        const recordId = `${unitId}_${studentId}_${year}_${period}`;
        const recordRef = doc(recordsCol, recordId);
        
        batch.set(recordRef, {
            id: recordId,
            studentId,
            unitId,
            year,
            period,
            grades: {}, // Ensure grades map exists
            evaluations: {
                [newEvaluation.indicatorId]: arrayUnion({
                    ...newEvaluation,
                    id: evaluationId,
                    createdAt: Timestamp.now()
                })
            }
        }, { merge: true });
    }

    await batch.commit();
}


export const deleteManualEvaluationFromRecord = async (
    instituteId: string,
    unitId: string, 
    year: string, 
    period: UnitPeriod,
    indicatorId: string,
    evaluationId: string
) => {
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
    const q = query(recordsCol,
        where("unitId", "==", unitId),
        where("year", "==", year),
        where("period", "==", period)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
        const record = docSnap.data() as AcademicRecord;
        if (record.evaluations && record.evaluations[indicatorId]) {
            const updatedEvalsForIndicator = record.evaluations[indicatorId].filter(e => e.id !== evaluationId);
            const updatedEvaluations = {
                ...record.evaluations,
                [indicatorId]: updatedEvalsForIndicator
            };

            const updatedGrades = record.grades || {};
            if (updatedGrades[indicatorId]) {
                const updatedGradesForIndicator = updatedGrades[indicatorId].filter(g => g.refId !== evaluationId);
                 updatedGrades[indicatorId] = updatedGradesForIndicator;
            }
            
            batch.update(docSnap.ref, { evaluations: updatedEvaluations, grades: updatedGrades });
        }
    });

    await batch.commit();
}

// --- ATTENDANCE ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', `${unitId}_${year}_${period}`);
    const docSnap = await getDoc(attendanceRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
    }
    return null;
};

export const saveAttendance = async (instituteId: string, attendanceData: AttendanceRecord): Promise<void> => {
    const attendanceRef = doc(db, 'institutes', instituteId, 'attendance', attendanceData.id);
    await setDoc(attendanceRef, attendanceData, { merge: true });
};

// --- SYLLABUS ---
export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus): Promise<void> => {
    const syllabusRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus');
    await setDoc(syllabusRef, data, { merge: true });
}

export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const syllabusRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'data', 'syllabus');
    const docSnap = await getDoc(syllabusRef);
    if (docSnap.exists()) {
        return docSnap.data() as Syllabus;
    }
    return null;
}


// --- PLANNING: REFACTORED ---
const getWeekDocRef = (instituteId: string, unitId: string, weekNumber: number) => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    return doc(plannerCol, `week_${weekNumber}`);
};

export const getWeekData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const docSnap = await getDoc(weekDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as WeekData;
    }
    return null;
};

export const getWeeksData = async (instituteId: string, unitId: string): Promise<WeekData[]> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const weekNumber = data.weekNumber || parseInt(doc.id.replace('week_', ''));
        return { ...data, weekNumber } as WeekData;
    });
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Content, 'id'>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const newContentId = doc(collection(db, 'idGenerator')).id;

    let fileUrl = '';
    if (data.type === 'file' && file) {
        const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${newContentId}`;
        fileUrl = await uploadFileAndGetURL(file, storagePath);
    }
    
    const newContent: Content = {
        ...data,
        id: newContentId,
        value: data.type === 'file' ? fileUrl : (data.value || ''),
        createdAt: Timestamp.now(),
    };
    
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
        const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${contentId}`;
        updatedContent.value = await uploadFileAndGetURL(file, storagePath);
    }

    weekData.contents[contentIndex] = updatedContent;
    await updateDoc(weekDocRef, { contents: weekData.contents });
}


export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    
    if (content.type === 'file') {
        try {
            const fileRef = ref(firebaseStorage, content.value);
            await deleteObject(fileRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting file from storage, but proceeding to delete from Firestore:", error);
            }
        }
    }
    
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.contents) return;
    const contentToDelete = weekData.contents.find(c => c.id === content.id);
    if (!contentToDelete) return;

    await updateDoc(weekDocRef, {
        contents: arrayRemove(contentToDelete)
    });
};

export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Task, 'id' | 'createdAt'>) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    
    const newTask: Task = {
        ...data,
        id: doc(collection(db, 'idGenerator')).id,
        createdAt: Timestamp.now(),
    };
    
    await setDoc(weekDocRef, {
        tasks: arrayUnion(newTask)
    }, { merge: true });
};

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, data: Partial<Task>) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.tasks) return;

    const taskIndex = weekData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");

    const updatedTask = { ...weekData.tasks[taskIndex], ...data };
    weekData.tasks[taskIndex] = updatedTask;

    await updateDoc(weekDocRef, { tasks: weekData.tasks });
}


export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.tasks) return;
    
    const taskToDelete = weekData.tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    await updateDoc(weekDocRef, {
        tasks: arrayRemove(taskToDelete)
    });
};

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    await setDoc(weekDocRef, { isVisible, weekNumber }, { merge: true });
};

export const getWeeksVisibility = async (instituteId: string, unitId: string): Promise<Record<string, boolean>> => {
    const plannerCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner');
    const snapshot = await getDocs(plannerCol);
    const visibilityMap: Record<string, boolean> = {};
    snapshot.forEach(doc => {
        visibilityMap[doc.id] = doc.data().isVisible || false;
    });
    return visibilityMap;
};

export const saveWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number, data: Partial<WeekData>) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    // Ensure all undefined values are replaced with empty strings for Firebase compatibility
    const safeData = {
        ...data,
        weekNumber,
        capacityElement: data.capacityElement || '',
        learningActivities: data.learningActivities || '',
        basicContents: data.basicContents || ''
    };
    
    setDoc(weekDocRef, safeData, { merge: true })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: weekDocRef.path,
                operation: 'write',
                requestResourceData: safeData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
};


// --- ROLES & PERMISSIONS ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const q = query(rolesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, roleData: Omit<Role, 'id'>): Promise<string> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const roleId = roleData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const roleRef = doc(rolesCol, roleId);
    
    const docSnap = await getDoc(roleRef);
    if (docSnap.exists()) {
        throw new Error(`Un rol con el nombre "${roleData.name}" ya existe.`);
    }

    await setDoc(roleRef, roleData);
    return roleId;
}


export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>): Promise<void> => {
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    await updateDoc(roleRef, data);
}

export const deleteRole = async (instituteId: string, roleId: string): Promise<void> => {
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    await deleteDoc(roleRef);
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'student') {
        const permissions: Partial<Record<Permission, boolean>> = {
            'student:unit:view': true,
            'student:grades:view': true,
            'student:payments:manage': true,
            'student:efsrt:view': true, 
        };
        return permissions as Record<Permission, boolean>;
    }
    if (roleId === 'teacher') {
         const permissions: Partial<Record<Permission, boolean>> = {
            'teacher:unit:view': true
        };
        return permissions as Record<Permission, boolean>;
    }
    
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    const docSnap = await getDoc(roleRef);
    if (docSnap.exists()) {
        const roleData = docSnap.data() as Role;
        const permissions = roleData.permissions;

        if (Array.isArray(permissions)) {
            const permissionsMap: Record<Permission, boolean> = {};
            (permissions as Permission[]).forEach(p => {
                permissionsMap[p] = true;
            });
            return permissionsMap;
        }
        return permissions;
    }
    return null;
}

// --- ACCESS CONTROL ---
export const addAccessPoint = async (instituteId: string, data: Omit<AccessPoint, 'id'>): Promise<void> => {
    const accessPointsCol = getSubCollectionRef(instituteId, 'accessPoints');
    await addDoc(accessPointsCol, data);
};

export const getAccessPoint = async (instituteId: string, accessPointId: string): Promise<AccessPoint | null> => {
    const docRef = doc(db, 'institutes', instituteId, 'accessPoints', accessPointId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AccessPoint;
    }
    return null;
}

export const getAccessPoints = async (instituteId: string): Promise<AccessPoint[]> => {
    const accessPointsCol = getSubCollectionRef(instituteId, 'accessPoints');
    const q = query(accessPointsCol, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessPoint));
};

export const updateAccessPoint = async (instituteId: string, docId: string, data: Partial<AccessPoint>): Promise<void> => {
    const accessPointRef = doc(db, 'institutes', instituteId, 'accessPoints', docId);
    await updateDoc(accessPointRef, data);
};

export const deleteAccessPoint = async (instituteId: string, docId: string): Promise<void> => {
    const accessPointRef = doc(db, 'institutes', instituteId, 'accessPoints', docId);
    await deleteDoc(accessPointRef);
};

export const listenToAllAccessLogs = (
    instituteId: string,
    callback: (logs: AccessLog[]) => void
): Unsubscribe => {
    const logsCollection = collectionGroup(db, 'accessLogs');
    const q = query(logsCollection, where('instituteId', '==', instituteId), orderBy('timestamp', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
        callback(logs);
    }, (error) => {
        console.error("Error listening to all access logs:", error);
    });
};

export const listenToAccessLogsForPoint = (
    instituteId: string,
    accessPointDocId: string,
    callback: (logs: AccessLog[]) => void
): Unsubscribe => {
    const logsCollection = collection(db, 'institutes', instituteId, 'accessPoints', accessPointDocId, 'accessLogs');
    const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
        callback(logs);
    }, (error) => {
        console.error(`Error listening to logs for access point ${accessPointDocId}:`, error);
    });
};

export const listenToAccessLogsForUser = (
    instituteId: string,
    userDocumentId: string,
    callback: (logs: AccessLog[]) => void
): Unsubscribe => {
    const logsCollection = collectionGroup(db, 'accessLogs');
    const q = query(
        logsCollection,
        where('instituteId', '==', instituteId),
        where('userDocumentId', '==', userDocumentId),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
        callback(logs);
    }, (error) => {
        console.error(`Error listening to logs for user ${userDocumentId}:`, error);
    });
};

// --- REPORTS ---
export const getMatriculationReportData = async (
  instituteId: string,
  programId: string,
  year: string,
  semester: number
): Promise<MatriculationReportData | null> => {
    
    const [allPrograms, allUnits, allStaff] = await Promise.all([
        getPrograms(instituteId),
        getUnits(instituteId),
        getStaffProfiles(instituteId)
    ]);
    
    const program = allPrograms.find(p => p.id === programId);
    if (!program) return null;
    
    const teacherMap = new Map(allStaff.map(s => [s.documentId, s.displayName]));
    
    const unitsForSemester = allUnits.filter(u => u.programId === programId && u.semester === semester);
    
    const assignments = await getAssignments(instituteId, year, programId);

    const reportUnits = await Promise.all(unitsForSemester.map(async (unit) => {
        const teacherId = assignments[unit.period]?.[unit.id];
        const teacherName = teacherId ? teacherMap.get(teacherId) || null : null;
        
        const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
        const matriculationQuery = query(matriculationsCol, 
            where("unitId", "==", unit.id),
            where("year", "==", year)
        );
        const matriculationSnap = await getDocs(matriculationQuery);
        const studentIds = matriculationSnap.docs.map(d => d.data().studentId);
        
        let students: StudentProfile[] = [];
        if (studentIds.length > 0) {
            const studentProfilesCol = getSubCollectionRef(instituteId, 'studentProfiles');
            const studentQuery = query(studentProfilesCol, where('documentId', 'in', studentIds));
            const studentSnap = await getDocs(studentQuery);
            students = studentSnap.docs.map(d => d.data() as StudentProfile).sort((a,b) => a.lastName.localeCompare(b.lastName));
        }

        return {
            unit,
            teacherName,
            students
        };
    }));

    return {
        program,
        units: reportUnits,
    };
};

// --- INFRASTRUCTURE ---

const addAssetHistoryLog = async (instituteId: string, buildingId: string, environmentId: string, assetId: string, logData: Omit<AssetHistoryLog, 'id'>) => {
    const historyCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId, 'history');
    await addDoc(historyCol, logData);
};

export const addBuilding = async (instituteId: string, data: Omit<Building, 'id'>): Promise<void> => {
    const buildingsCol = getSubCollectionRef(instituteId, 'buildings');
    await addDoc(buildingsCol, data);
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const buildingsCol = getSubCollectionRef(instituteId, 'buildings');
    const q = query(buildingsCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
};

export const updateBuilding = async (instituteId: string, buildingId: string, data: Partial<Building>): Promise<void> => {
    const buildingRef = doc(db, 'institutes', instituteId, 'buildings', buildingId);
    await updateDoc(buildingRef, data);
};

export const deleteBuilding = async (instituteId: string, buildingId: string): Promise<void> => {
    const buildingRef = doc(db, 'institutes', instituteId, 'buildings', buildingId);
    await deleteDoc(buildingRef);
};
    
export const addEnvironment = async (instituteId: string, buildingId: string, data: Omit<Environment, 'id'>): Promise<void> => {
    const envCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments');
    await addDoc(envCol, { ...data, buildingId });
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const envCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments');
    const q = query(envCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, buildingId, ...docSnap.data() } as Environment));
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const buildings = await getBuildings(instituteId);
    let allEnvironments: Environment[] = [];

    for (const building of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, building.id);
        allEnvironments = allEnvironments.concat(envs);
    }
    return allEnvironments;
};

export const updateEnvironment = async (instituteId: string, buildingId: string, envId: string, data: Partial<Environment>): Promise<void> => {
    const envRef = doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId);
    await updateDoc(envRef, data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, envId: string): Promise<void> => {
    const envRef = doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId);
    await deleteDoc(envRef);
};

export const getAssetTypes = async (instituteId: string, options?: { search?: string; limit?: number }): Promise<AssetType[]> => {
    const assetTypesCol = getSubCollectionRef(instituteId, 'assetTypes');
    const pageSize = options?.limit || 20;
    const q_parts: any[] = [];
    if (options?.search) {
        const searchQuery = options.search.toUpperCase(); 
        q_parts.push(where('name', '>=', searchQuery));
        q_parts.push(where('name', '<=', searchQuery + '\uf8ff'));
    }
    const q = query(assetTypesCol, ...q_parts, orderBy("name"), limit(pageSize));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetType));
};

export const getAssetTypeById = async (instituteId: string, assetTypeId: string): Promise<AssetType | null> => {
    const assetTypeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    const docSnap = await getDoc(assetTypeRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AssetType : null;
};

export const addAssetType = async (instituteId: string, data: Omit<AssetType, 'id' | 'lastAssignedNumber'>): Promise<void> => {
    const assetTypesCol = getSubCollectionRef(instituteId, 'assetTypes');
    const docRef = doc(assetTypesCol, data.patrimonialCode); 
    await setDoc(docRef, { ...data, lastAssignedNumber: 0 }, { merge: true });
};

export const bulkAddAssetTypes = async (instituteId: string, assetTypes: Omit<AssetType, 'id' | 'lastAssignedNumber'>[]) => {
    const batch = writeBatch(db);
    const assetTypesCol = getSubCollectionRef(instituteId, 'assetTypes');
    assetTypes.forEach(assetTypeData => {
        const docRef = doc(assetTypesCol, assetTypeData.patrimonialCode); 
        batch.set(docRef, { ...assetTypeData, lastAssignedNumber: 0 }, { merge: true }); 
    });
    await batch.commit();
};

export const updateAssetType = async (instituteId: string, assetTypeId: string, data: Partial<AssetType>): Promise<void> => {
    const assetTypeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    await updateDoc(assetTypeRef, data);
};

export const deleteAssetType = async (instituteId: string, assetTypeId: string): Promise<void> => {
    const assetTypeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    await deleteDoc(assetTypeRef);
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const buildings = await getBuildings(instituteId);
    let allAssets: Asset[] = [];

    for (const building of buildings) {
        const environments = await getEnvironmentsForBuilding(instituteId, building.id);
        for (const environment of environments) {
            const assets = await getAssetsForEnvironment(instituteId, building.id, environment.id);
            allAssets = allAssets.concat(assets.map(asset => ({
                ...asset,
                buildingName: building.name,
                environmentName: environment.name,
            })));
        }
    }
    return allAssets;
};


export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const assetsCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets');
    const q = query(assetsCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, assetTypeId: string, data: Partial<Omit<Asset, 'id' | 'assetTypeId' | 'name' | 'codeOrSerial' | 'type'>>) => {
    const user = auth.currentUser;
    const assetTypeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    
    let newAssetCode = '';

    await runTransaction(db, async (transaction) => {
        const assetTypeDoc = await transaction.get(assetTypeRef);
        if (!assetTypeDoc.exists()) {
            throw new Error("AssetType not found");
        }
        const assetTypeData = assetTypeDoc.data() as AssetType;

        const newNumber = (assetTypeData.lastAssignedNumber || 0) + 1;
        newAssetCode = `${assetTypeData.patrimonialCode}-${String(newNumber).padStart(4, '0')}`;
        
        transaction.update(assetTypeRef, { lastAssignedNumber: newNumber });

        const assetsCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets');
        const newAssetRef = doc(assetsCol);
        
        const newAssetData: Omit<Asset, 'id'> = {
            ...data,
            assetTypeId,
            name: assetTypeData.name,
            type: assetTypeData.class,
            codeOrSerial: newAssetCode,
            instituteId,
            buildingId,
            environmentId,
        } as Omit<Asset, 'id'>;
        transaction.set(newAssetRef, newAssetData);
        
        if (user) {
            const historyColRef = collection(newAssetRef, 'history');
            const logDocRef = doc(historyColRef);
            transaction.set(logDocRef, {
                action: 'create',
                userId: user.uid,
                userName: user.displayName || 'Sistema',
                timestamp: Timestamp.now(),
                details: `Activo "${newAssetData.name}" (${newAssetCode}) creado.`,
            });
        }
    });
    
    return newAssetCode;
};


export const updateAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string, data: Partial<Asset>): Promise<void> => {
    const user = auth.currentUser;
    const assetRef = doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId);
    
    if(user) {
        const oldDataSnap = await getDoc(assetRef);
        if (oldDataSnap.exists()) {
             const oldData = oldDataSnap.data() as Asset;
             const changes: string[] = [];
             Object.keys(data).forEach(key => {
                 if (oldData[key as keyof Asset] !== data[key as keyof Asset]) {
                     changes.push(`${key}: de '${oldData[key as keyof Asset]}' a '${data[key as keyof Asset]}'`);
                 }
             });
             if (changes.length > 0) {
                 await addAssetHistoryLog(instituteId, buildingId, environmentId, assetId, {
                    action: 'update',
                    userId: user.uid,
                    userName: user.displayName || 'Sistema',
                    timestamp: Timestamp.now(),
                    details: `Se actualizaron los campos: ${changes.join(', ')}.`,
                });
             }
        }
    }
    await updateDoc(assetRef, data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string): Promise<void> => {
    const assetRef = doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId);
    await deleteDoc(assetRef);
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], newStatus: string): Promise<void> => {
    const user = auth.currentUser;
    const batch = writeBatch(db);
    assets.forEach(asset => {
        const assetRef = doc(db, 'institutes', instituteId, 'buildings', asset.buildingId, 'environments', asset.environmentId, 'assets', asset.id);
        batch.update(assetRef, { status: newStatus });
        
        if (user) {
            const historyColRef = collection(assetRef, 'history');
            const logDocRef = doc(historyColRef);
            batch.set(logDocRef, {
                action: 'status_change',
                userId: user.uid,
                userName: user.displayName || 'Sistema',
                timestamp: Timestamp.now(),
                details: `Estado cambiado a "${newStatus}" (actualización masiva).`,
            });
        }
    });
    await batch.commit();
}

export const moveAssets = async (instituteId: string, assetsToMove: Asset[], targetEnvironment: Environment): Promise<void> => {
  const user = auth.currentUser;
  const batch = writeBatch(db);

  assetsToMove.forEach(asset => {
    const originalAssetRef = doc(db, 'institutes', instituteId, 'buildings', asset.buildingId, 'environments', asset.environmentId, 'assets', asset.id);
    batch.delete(originalAssetRef);

    const newAssetRef = doc(collection(db, 'institutes', instituteId, 'buildings', targetEnvironment.buildingId, 'environments', targetEnvironment.id, 'assets'));
    const { id, buildingId, environmentId, buildingName, environmentName, ...assetData } = asset;
    const newAssetData = {
        ...assetData,
        instituteId,
        buildingId: targetEnvironment.buildingId,
        environmentId: targetEnvironment.id,
    };
    batch.set(newAssetRef, newAssetData);
    
     if (user) {
        const historyColRef = collection(newAssetRef, 'history');
        const logDocRef = doc(historyColRef);
        batch.set(logDocRef, {
            action: 'move',
            userId: user.uid,
            userName: user.displayName || 'Sistema',
            timestamp: Timestamp.now(),
            details: `Movido desde ${asset.buildingName} / ${asset.environmentName} a ${targetEnvironment.name}.`,
        });
    }
  });

  await batch.commit();
};

export const getAssetHistory = async (instituteId: string, buildingId: string, environmentId: string, assetId: string): Promise<AssetHistoryLog[]> => {
    const historyCol = collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId, 'history');
    const q = query(historyCol, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetHistoryLog));
}


// --- SCHEDULE TEMPLATES ---
export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const templatesCol = getSubCollectionRef(instituteId, 'scheduleTemplates');
    const q = query(templatesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
};

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const templatesCol = getSubCollectionRef(instituteId, 'scheduleTemplates');
    const q = query(templatesCol, where("isDefault", "==", true), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const anyTemplateQuery = query(templatesCol, limit(1));
        const anySnapshot = await getDocs(anyTemplateQuery);
        if (anySnapshot.empty) {
            return null;
        }
        return { id: anySnapshot.docs[0].id, ...anySnapshot.docs[0].data() } as ScheduleTemplate;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ScheduleTemplate;
};


export const addScheduleTemplate = async (instituteId: string, data: Omit<ScheduleTemplate, 'id'>): Promise<string> => {
    const templatesCol = getSubCollectionRef(instituteId, 'scheduleTemplates');
    const docRef = await addDoc(templatesCol, data);
    return docRef.id;
};

export const updateScheduleTemplate = async (instituteId: string, templateId: string, data: Partial<ScheduleTemplate>): Promise<void> => {
    const templateRef = doc(db, 'institutes', instituteId, 'scheduleTemplates', templateId);
    await updateDoc(templateRef, data);
};

export const deleteScheduleTemplate = async (instituteId: string, templateId: string): Promise<void> => {
    const templateRef = doc(db, 'institutes', instituteId, 'scheduleTemplates', templateId);
    await deleteDoc(templateRef);
};

export const setDefaultScheduleTemplate = async (instituteId: string, templateId: string): Promise<void> => {
    const templatesCol = getSubCollectionRef(instituteId, 'scheduleTemplates');
    const batch = writeBatch(db);

    const q = query(templatesCol, where("isDefault", "==", true));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
    });

    const newDefaultRef = doc(templatesCol, templateId);
    batch.update(newDefaultRef, { isDefault: true });

    await batch.commit();
}


// --- SCHEDULE DATA ---
const getScheduleDocRef = (instituteId: string, programId: string, year: string, semester: number) => {
    const scheduleId = `${programId}_${year}_${semester}`;
    return doc(db, 'institutes', instituteId, 'schedules', scheduleId);
}

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const schedulesCol = getSubCollectionRef(instituteId, 'schedules');
    const snapshot = await getDocs(schedulesCol);
    const scheduledDays = new Set<string>();

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.year === year && data.semester === semester) {
            const scheduleData = data.schedule as Record<string, ScheduleBlock>;
            for (const key in scheduleData) {
                const block = scheduleData[key];
                if (block.unitId === unitId) {
                    scheduledDays.add(block.dayOfWeek);
                }
            }
        }
    });
    
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(scheduledDays).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};


export const getSchedule = async (instituteId: string, programId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const scheduleRef = getScheduleDocRef(instituteId, programId, year, semester);
    const docSnap = await getDoc(scheduleRef);
    if (docSnap.exists()) {
        return docSnap.data().schedule || {};
    }
    return {};
}

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const schedulesCol = getSubCollectionRef(instituteId, 'schedules');
    const snapshot = await getDocs(schedulesCol);
    const allBlocks: Record<string, ScheduleBlock> = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.year === year && data.semester === semester) {
            Object.assign(allBlocks, data.schedule);
        }
    });

    return allBlocks;
}

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const schedulesCol = getSubCollectionRef(instituteId, 'schedules');
    const q = query(schedulesCol, where("year", "==", year));
    const snapshot = await getDocs(q);
    const allBlocks: ScheduleBlock[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.schedule) {
            Object.values(data.schedule as Record<string, ScheduleBlock>).forEach(block => {
                allBlocks.push(block);
            });
        }
    });
    return allBlocks;
}

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, schedule: Record<string, ScheduleBlock>): Promise<void> => {
    const scheduleRef = getScheduleDocRef(instituteId, programId, year, semester);
    await setDoc(scheduleRef, { schedule, programId, year, semester, turno }, { merge: true });
}

// --- NEWS ---
export const getNewsList = async (instituteId: string): Promise<News[]> => {
    const newsCol = getSubCollectionRef(instituteId, 'news');
    const q = query(newsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};

export const addNews = async (instituteId: string, data: Omit<News, 'id' | 'createdAt'>, imageFile?: File): Promise<string> => {
    const newsCol = getSubCollectionRef(instituteId, 'news');
    const newDocRef = doc(newsCol);
    
    let imageUrl = '';
    if (imageFile) {
        const storagePath = `institutes/${instituteId}/news/${newDocRef.id}`;
        imageUrl = await uploadFileAndGetURL(imageFile, storagePath);
    }

    const newsData: Omit<News, 'id'> = {
        ...data,
        imageUrl,
        createdAt: Timestamp.now(),
    };
    await setDoc(newDocRef, newsData);
    return newDocRef.id;
};

export const updateNews = async (instituteId: string, newsId: string, data: Partial<News>, imageFile?: File): Promise<void> => {
    const newsRef = doc(db, 'institutes', instituteId, 'news', newsId);
    
    const updateData = { ...data };
    if (imageFile) {
        const storagePath = `institutes/${instituteId}/news/${newsId}`;
        updateData.imageUrl = await uploadFileAndGetURL(imageFile, storagePath);
    }

    await updateDoc(newsRef, updateData);
};

export const deleteNews = async (instituteId: string, newsItem: News): Promise<void> => {
    const newsRef = doc(db, 'institutes', instituteId, 'news', newsItem.id);
    await deleteDoc(newsRef);

    if (newsItem.imageUrl) {
        try {
            const storageRef = ref(firebaseStorage, newsItem.imageUrl);
            await deleteObject(storageRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting news image from storage:", error);
            }
        }
    }
};

// --- GALLERY ---

export const addAlbum = async (instituteId: string, data: Omit<Album, 'id' | 'createdAt'>): Promise<string> => {
    const albumsCol = getSubCollectionRef(instituteId, 'albums');
    const albumData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(albumsCol, albumData);
    return docRef.id;
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const albumsCol = getSubCollectionRef(instituteId, 'albums');
    const q = query(albumsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
};

export const getAlbum = async (instituteId: string, albumId: string): Promise<Album | null> => {
    const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
    const docSnap = await getDoc(albumRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Album : null;
};

export const updateAlbum = async (instituteId: string, albumId: string, data: Partial<Album>): Promise<void> => {
    const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
    await updateDoc(albumRef, data);
};

export const deleteAlbum = async (instituteId: string, albumId: string): Promise<void> => {
    const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
    await deleteDoc(albumRef);
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const photosCol = collection(db, 'institutes', instituteId, 'albums', albumId, 'photos');
    const q = query(photosCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]): Promise<void> => {
    const batch = writeBatch(db);
    const photosCol = collection(db, 'institutes', instituteId, 'albums', albumId, 'photos');
    let firstPhotoUrl: string | null = null;

    for (const file of files) {
        const photoDocRef = doc(photosCol);
        const storagePath = `institutes/${instituteId}/albums/${albumId}/${photoDocRef.id}`;
        const downloadURL = await uploadFileAndGetURL(file, storagePath);
        
        if (!firstPhotoUrl) {
            firstPhotoUrl = downloadURL;
        }

        const photoData: Omit<Photo, 'id'> = {
            albumId,
            url: downloadURL,
            createdAt: Timestamp.now(),
        };
        batch.set(photoDocRef, photoData);
    }
    
    if (firstPhotoUrl) {
        const albumRef = doc(db, 'institutes', instituteId, 'albums', albumId);
        const albumSnap = await getDoc(albumRef);
        if (albumSnap.exists() && !albumSnap.data().coverImageUrl) {
            batch.update(albumRef, { coverImageUrl: firstPhotoUrl });
        }
    }

    await batch.commit();
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo): Promise<void> => {
    const photoRef = doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id);
    await deleteDoc(photoRef);
    
    try {
        const storageRef = ref(firebaseStorage, photo.url);
        await deleteObject(storageRef);
    } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting photo from storage:", error);
        }
    }
};

// --- EFSRT (PRACTICAS) ---
export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supervisorId), orderBy('createdAt', 'desc'));
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

export const updateEFSRTAssignment = async (instituteId: string, assignmentId: string, data: Partial<EFSRTAssignment>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), data);
};

export const deleteEFSRTAssignment = async (instituteId: string, assignmentId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId));
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: any) => {
    const id = Math.random().toString(36).substring(7);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { visits: arrayUnion({ ...visit, id }) });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string) => {
    const status: EFSRTStatus = grade >= 13 ? 'Aprobado' : 'Desaprobado';
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { grade, observations, status });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl']: url });
};

export const saveEFSRTReportUrl = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', url: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl']: url });
};

export const checkEgresoEligibility = async (instituteId: string, studentId: string): Promise<{ eligible: boolean; pendingUnits: string[]; pendingEFSRT: string[] }> => {
    const [matriculations, assignments, studentData] = await Promise.all([
        getMatriculationsForStudent(instituteId, studentId),
        getEFSRTAssignmentsForStudent(instituteId, studentId),
        getStudentProfile(instituteId, studentId)
    ]);

    if (!studentData) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };

    const programs = await getPrograms(instituteId);
    const program = programs.find(p => p.id === studentData.programId);
    const allUnits = await getUnits(instituteId);
    const programUnits = allUnits.filter(u => u.programId === studentData.programId);

    const pendingUnits = programUnits
        .filter(u => !matriculations.some(m => m.unitId === u.id && m.status === 'aprobado'))
        .map(u => u.name);

    const requiredModules = program?.modules.map(m => m.code) || [];
    const pendingEFSRT = requiredModules
        .filter(mCode => !assignments.some(a => a.moduleId === mCode && a.status === 'Aprobado'))
        .map(mCode => program?.modules.find(m => m.code === mCode)?.name || mCode);

    return {
        eligible: pendingUnits.length === 0 && pendingEFSRT.length === 0,
        pendingUnits,
        pendingEFSRT
    };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, graduationYear: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'studentProfiles', studentId), {
        academicStatus: 'Egresado',
        graduationYear
    });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const snap = await getDocs(submissionsCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
};

export const submitTask = async (
    instituteId: string, 
    unitId: string, 
    weekNumber: number, 
    taskId: string, 
    studentProfile: StudentProfile, 
    file?: File,
    link?: string
) => {
    let fileUrl = '';
    if (file) {
        const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/submissions/${studentProfile.documentId}`;
        fileUrl = await uploadFileAndGetURL(file, storagePath);
    }
    
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentProfile.documentId);
    
    const submissionData: any = {
        studentName: studentProfile.fullName,
        submittedAt: Timestamp.now()
    };
    if (fileUrl) submissionData.fileUrl = fileUrl;
    if (link) submissionData.link = link;
    
    await setDoc(submissionRef, submissionData, { merge: true });
};

export const gradeTaskSubmission = async (
    instituteId: string, 
    unitId: string, 
    period: UnitPeriod,
    weekNumber: number, 
    taskId: string, 
    taskTitle: string,
    studentId: string, 
    grade: number, 
    feedback: string
) => {
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentId);
    await updateDoc(submissionRef, { grade, feedback });

    const currentYear = new Date().getFullYear().toString();
    const recordId = `${unitId}_${studentId}_${currentYear}_${period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    
    const recordSnap = await getDoc(recordRef);
    const indicators = await getAchievementIndicators(instituteId, unitId);
    const indicator = indicators.find(ind => weekNumber >= ind.startWeek && weekNumber <= ind.endWeek);

    if (indicator) {
        const gradeEntry = { type: 'task', refId: taskId, label: taskTitle, grade, weekNumber };
        const recordData = recordSnap.exists() ? recordSnap.data() as AcademicRecord : null;
        const grades = recordData?.grades || {};
        if (!grades[indicator.id]) grades[indicator.id] = [];
        const index = grades[indicator.id].findIndex(g => g.refId === taskId);
        if (index !== -1) grades[indicator.id][index] = gradeEntry;
        else grades[indicator.id].push(gradeEntry);

        await setDoc(recordRef, { 
            id: recordId,
            studentId,
            unitId,
            year: currentYear,
            period,
            grades 
        }, { merge: true });
    }
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]) => {
    const batch = writeBatch(db);
    
    for (const res of results) {
        const recordId = `${unitId}_${res.studentId}_${year}_${period}`;
        const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
        batch.update(recordRef, { finalGrade: res.finalGrade, status: res.status });

        const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
        const q = query(matriculationsCol, where("studentId", "==", res.studentId), where("unitId", "==", unitId), where("year", "==", year));
        const mSnap = await getDocs(q);
        mSnap.forEach(mDoc => {
            batch.update(mDoc.ref, { status: res.status });
        });
    }
    
    await batch.commit();
};

export const deleteMatriculation = async (instituteId: string, studentId: string, mId: string) => {
    const mRef = doc(db, 'institutes', instituteId, 'matriculations', mId);
    await deleteDoc(mRef);
}

export const bulkCreateMatriculations = async (
    instituteId: string,
    studentIds: string[],
    units: Unit[],
    year: string,
    semester: number
) => {
    const batch = writeBatch(db);
    const matriculationsCol = getSubCollectionRef(instituteId, 'matriculations');
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');

    for (const sId of studentIds) {
        units.forEach(unit => {
            const mRef = doc(matriculationsCol);
            batch.set(mRef, {
                studentId: sId,
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
        
        const sRef = doc(studentsCol, sId);
        batch.update(sRef, { currentSemester: semester });
    }

    await batch.commit();
};
