

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, DailyStats, HourlyStats, OverallStats, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock } from '@/types';

const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.appspot.com",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8"
};

let app;
if (!getApps().length) {
  app = initializeApp({
    ...firebaseConfig,
    storageBucket: 'stem-v2-4y6a0.appspot.com'
  });
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const firebaseStorage = getStorage(app);

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

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
      documentId: '', // Use empty string instead of null
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
export const addInstitute = async (instituteId: string, data: Omit<Institute, 'id'>): Promise<void> => {
    const instituteRef = doc(db, 'institutes', instituteId);
    const docSnap = await getDoc(instituteRef);
    if (docSnap.exists()) {
        throw new Error(`Institute with ID "${instituteId}" already exists.`);
    }
    await setDoc(instituteRef, data);
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

export const updateInstitute = async (instituteId: string, data: Partial<Omit<Institute, 'id'>>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId), data);
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
    const imageDocRef = doc(collection(db, 'config', 'loginDesign', 'images'));
    const storageRef = ref(firebaseStorage, `loginImages/${imageDocRef.id}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await setDoc(imageDocRef, { name, url, createdAt: Timestamp.now() });
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
    const imageDocRef = doc(db, 'config', 'loginDesign', 'images', image.id);
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
export const getAllUsersFromAllInstitutes = async (): Promise<AppUser[]> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
};

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
        modules: data.modules.map(module => ({ ...module })) // Ensure it's a plain object
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
    const downloadURL = await uploadFileViaApi(file, path);
    await updateUnitImage(instituteId, unitId, downloadURL);
};


export const deleteUnit = async (instituteId: string, unitId: string) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await deleteDoc(unitRef);
}

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    
    // Use a for...of loop to handle async operations correctly
    for (const unitData of units) {
        const docRef = doc(unitsCol); 
        const dataWithHours = {
            ...unitData,
            totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0),
        };
        await setDoc(docRef, dataWithHours);
    }
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
    await addUnit(instituteId, newUnitData);
};


// Teachers (derived from StaffProfiles)
export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const allStaff = await getStaffProfiles(instituteId);
    const allPrograms = await getPrograms(instituteId);
    const programMap = new Map(allPrograms.map(p => [p.id, p.name]));
    
    // We are returning all staff profiles as potential teachers,
    // as assignments can cross programs. Filtering will happen in the component.
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


// STAFF PROFILES
export const addStaffProfile = async (instituteId: string, data: Omit<StaffProfile, 'linkedUserUid'>) => {
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    const profileRef = doc(staffCol, data.documentId); // Use Document ID as the document ID
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
        // In Firestore, the document ID will be the Document ID
        const docRef = doc(staffCol, staffData.documentId);
        batch.set(docRef, staffData);
    });
    await batch.commit();
};

export const updateStaffProfile = async (instituteId: string, documentId: string, data: Partial<StaffProfile>) => {
    const staffRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    await updateDoc(staffRef, data);
    
    // After updating the profile, check if there's a linked user and update their role too.
    const profileSnap = await getDoc(staffRef);
    const profileData = profileSnap.data();

    if (profileData && profileData.linkedUserUid && data.role) {
        const userRef = doc(db, 'users', profileData.linkedUserUid);
        await updateDoc(userRef, {
            role: data.role,
            displayName: data.displayName // Also update name for consistency
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
    const snapshot = await getDocs(activitiesCol);
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
export const addNonTeachingAssignment = async (instituteId: string, data: Omit<NonTeachingAssignment, 'id'>): Promise<void> => {
    const assignmentsCol = getSubCollectionRef(instituteId, 'nonTeachingAssignments');
    await addDoc(assignmentsCol, data);
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
    data: Omit<Payment, 'id' | 'voucherUrl' | 'status' | 'createdAt'>, 
    voucherFile: File
): Promise<void> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const paymentDocRef = doc(paymentsCol);

    const formData = new FormData();
    formData.append('file', voucherFile);
    formData.append('path', `institutes/${instituteId}/vouchers`);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server-side upload failed.');
    }
    
    const { downloadURL } = await response.json();
    
    const paymentData: Omit<Payment, 'id'> = {
        ...data,
        voucherUrl: downloadURL,
        status: 'Pendiente',
        createdAt: Timestamp.now()
    };
    await setDoc(paymentDocRef, paymentData);
}

export const getStudentPaymentsByStatus = async (instituteId: string, studentId: string, status: PaymentStatus): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(
        paymentsCol,
        where("studentId", "==", studentId),
        where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(
        paymentsCol,
        where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (
    instituteId: string, 
    paymentId: string, 
    status: PaymentStatus,
    extraData: { receiptNumber?: string; rejectionReason?: string } = {}
): Promise<void> => {
    const paymentRef = doc(db, 'institutes', instituteId, 'payments', paymentId);
    const updateData: any = {
        status,
        processedAt: Timestamp.now(),
        ...extraData
    };
    await updateDoc(paymentRef, updateData);
};


// --- ACADEMIC & MATRICULATION TYPES ---

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

    const unitIds = matriculationSnapshot.docs.map(doc => doc.data().unitId);
    
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
    newEvaluation: Omit<ManualEvaluation, 'id' | 'createdAt'>
) => {
    const recordsCol = getSubCollectionRef(instituteId, 'academicRecords');
    const q = query(recordsCol,
        where("unitId", "==", unitId),
        where("year", "==", year),
        where("period", "==", period)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        console.warn("No academic records found for this unit/period to add manual evaluation to.");
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
        const record = docSnap.data() as AcademicRecord;
        const evaluations = record.evaluations || {};
        if (!evaluations[newEvaluation.indicatorId]) {
            evaluations[newEvaluation.indicatorId] = [];
        }
        
        const evaluationId = doc(collection(db, 'idGenerator')).id; // Generate a unique ID
        const finalEvaluation: ManualEvaluation = { 
            ...newEvaluation, 
            id: evaluationId,
            createdAt: Timestamp.now()
        };

        evaluations[newEvaluation.indicatorId].push(finalEvaluation);
        batch.update(docSnap.ref, { evaluations });
    });

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
        console.warn("No academic records found for this unit/period to delete manual evaluation from.");
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

const uploadFileViaApi = async (file: File, path: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server-side upload failed.');
    }
    
    const { downloadURL } = await response.json();
    return downloadURL;
};

export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Content, 'id'>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const newContentId = doc(collection(db, 'idGenerator')).id;

    let fileUrl = '';
    if (data.type === 'file' && file) {
        const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}`;
        fileUrl = await uploadFileViaApi(file, storagePath);
    }
    
    const newContent: Content = {
        ...data,
        id: newContentId,
        value: data.type === 'file' ? fileUrl : (data.value || ''),
        createdAt: Timestamp.now(),
    };
    
    await updateDoc(weekDocRef, { contents: arrayUnion(newContent) });
};

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>, file?: File) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    const weekData = await getWeekData(instituteId, unitId, weekNumber);
    if (!weekData || !weekData.contents) return;

    const contentIndex = weekData.contents.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");

    const updatedContent = { ...weekData.contents[contentIndex], ...data };

    if (data.type === 'file' && file) {
        const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}`;
        updatedContent.value = await uploadFileViaApi(file, storagePath);
    }

    weekData.contents[contentIndex] = updatedContent;
    await updateDoc(weekDocRef, { contents: weekData.contents });
}


export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    const weekDocRef = getWeekDocRef(instituteId, unitId, weekNumber);
    
    if (content.type === 'file') {
        try {
            const fileRef = ref(storage, content.value);
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
    
    await updateDoc(weekDocRef, {
        tasks: arrayUnion(newTask)
    });
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
    await setDoc(weekDocRef, data, { merge: true });
};


// --- ROLES & PERMISSIONS ---

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const rolesCol = getSubCollectionRef(instituteId, 'roles');
    const q = query(rolesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        // Here you could seed default roles if they don't exist
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

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Permission[] | null> => {
    if (roleId === 'student') {
        return ['student:unit:view', 'student:grades:view', 'student:payments:manage'];
    }
    if (roleId === 'teacher') {
        return ['teacher:unit:view'];
    }
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    const docSnap = await getDoc(roleRef);
    if (docSnap.exists()) {
        return (docSnap.data() as Role).permissions;
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

export const getAccessPointStats = async (
    instituteId: string,
    accessPointId: string
): Promise<{ daily: DailyStats | null; hourly: HourlyStats | null; overall: OverallStats | null }> => {
    const statsCol = collection(db, 'institutes', instituteId, 'accessPoints', accessPointId, 'statistics');
    const today = new Date().toISOString().split('T')[0];

    const dailyRef = doc(statsCol, `daily_${today}`);
    const hourlyRef = doc(statsCol, 'hourly_summary');
    const overallRef = doc(statsCol, 'overall');
    
    const [dailySnap, hourlySnap, overallSnap] = await Promise.all([
        getDoc(dailyRef),
        getDoc(hourlyRef),
        getDoc(overallRef)
    ]);
    
    return {
        daily: dailySnap.exists() ? dailySnap.data() as DailyStats : null,
        hourly: hourlySnap.exists() ? hourlySnap.data() as HourlyStats : null,
        overall: overallSnap.exists() ? overallSnap.data() as OverallStats : null,
    };
};

export const getLastAccessLog = async (
    instituteId: string,
    accessPointId: string,
    rfidCardId: string,
    date: Date
): Promise<AccessLog | null> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logsCollection = collectionGroup(db, 'accessLogs');
    const q = query(
        logsCollection,
        where('instituteId', '==', instituteId),
        where('accessPointId', '==', accessPointId),
        where('rfidCardId', '==', rfidCardId),
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay),
        orderBy('timestamp', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AccessLog;
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

// --- SCHEDULES / AMBIENTES ---
export const addEnvironment = async (instituteId: string, data: Omit<Environment, 'id'>): Promise<void> => {
    const envCol = getSubCollectionRef(instituteId, 'environments');
    await addDoc(envCol, data);
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const envCol = getSubCollectionRef(instituteId, 'environments');
    const q = query(envCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Environment));
};

export const updateEnvironment = async (instituteId: string, envId: string, data: Partial<Environment>): Promise<void> => {
    const envRef = doc(db, 'institutes', instituteId, 'environments', envId);
    await updateDoc(envRef, data);
};

export const deleteEnvironment = async (instituteId: string, envId: string): Promise<void> => {
    const envRef = doc(db, 'institutes', instituteId, 'environments', envId);
    await deleteDoc(envRef);
};
    
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
        // Fallback to get any template if no default is set
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

    // Unset any existing default
    const q = query(templatesCol, where("isDefault", "==", true));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
    });

    // Set the new default
    const newDefaultRef = doc(templatesCol, templateId);
    batch.update(newDefaultRef, { isDefault: true });

    await batch.commit();
}


// --- SCHEDULE DATA ---
const getScheduleDocRef = (instituteId: string, programId: string, year: string, semester: number) => {
    const scheduleId = `${programId}_${year}_${semester}`;
    return doc(db, 'institutes', instituteId, 'schedules', scheduleId);
}

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
    // We can't query based on a part of the document ID easily. We fetch all and filter.
    // This is acceptable if the number of programs/schedules per institute isn't massive.
    const snapshot = await getDocs(schedulesCol);
    const allBlocks: Record<string, ScheduleBlock> = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        // Filter by year and semester from the document's fields
        if (data.year === year && data.semester === semester) {
            Object.assign(allBlocks, data.schedule);
        }
    });

    return allBlocks;
}

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, schedule: Record<string, ScheduleBlock>): Promise<void> => {
    const scheduleRef = getScheduleDocRef(instituteId, programId, year, semester);
    await setDoc(scheduleRef, { schedule, programId, year, semester });
}


    




