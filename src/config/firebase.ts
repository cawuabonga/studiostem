

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator } from '@/types';

const firebaseConfig = {
  apiKey: "AIzaSyDrtLhQIGsfH9RHl02Gs6fOX_honSi610I",
  authDomain: "app-iestp.firebaseapp.com",
  projectId: "app-iestp",
  storageBucket: "app-iestp.appspot.com", 
  messagingSenderId: "599711250596",
  appId: "1:599711250596:web:a570b99c0db17039540e31"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
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
    await setDoc(imageDocRef, { name, url, createdAt: new Date() });
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
export const addUnit = async (instituteId: string, data: Omit<Unit, 'id' | 'totalHours'> & { totalHours?: number }) => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
     const unitData = {
        ...data,
        totalHours: (data.theoreticalHours || 0) + (data.practicalHours || 0)
    };
    await addDoc(unitsCol, unitData);
}

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    const docSnap = await getDoc(unitRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Unit;
    }
    return null;
}

export const getUnits = async (instituteId: string): Promise<Unit[]> => {
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    const q = query(unitsCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await updateDoc(unitRef, data);
}

export const deleteUnit = async (instituteId: string, unitId: string) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    await deleteDoc(unitRef);
}

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours'>[]) => {
    const batch = writeBatch(db);
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    units.forEach(unitData => {
        const docRef = doc(unitsCol); 
        const dataWithHours = {
            ...unitData,
            totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0)
        }
        batch.set(docRef, dataWithHours);
    });
    await batch.commit();
}


// Teachers (derived from StaffProfiles)
export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
    const staffCol = getSubCollectionRef(instituteId, 'staffProfiles');
    const programs = await getPrograms(instituteId);
    const programMap = new Map(programs.map(p => [p.id, p.name]));
    
    const q = query(staffCol, where("role", "in", ["Teacher", "Coordinator"]));
    const snapshot = await getDocs(q);

    const teachers = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as StaffProfile;
        return { 
            id: data.documentId,
            fullName: data.displayName,
            documentId: data.documentId,
            email: data.email,
            phone: data.phone || '',
            specialty: (data as any).specialty || 'N/A',
            active: !!data.linkedUserUid,
            condition: data.condition,
            programName: programMap.get(data.programId) || 'N/A'
        } as Teacher;
    });

    return teachers.sort((a, b) => a.fullName.localeCompare(b.fullName));
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
    return snapshot.docs.map(doc => ({ ...doc.data() } as StaffProfile));
};


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
}

export const deleteStaffProfile = async (instituteId: string, documentId: string) => {
    const staffRef = doc(db, 'institutes', instituteId, 'staffProfiles', documentId);
    await deleteDoc(staffRef);
}

// STUDENT PROFILES
export const addStudentProfile = async (instituteId: string, data: Omit<StudentProfile, 'fullName' | 'linkedUserUid'>) => {
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    const profileRef = doc(studentsCol, data.documentId);
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
        throw new Error(`Un perfil de estudiante con el documento ${data.documentId} ya existe.`);
    }

    const profileData: StudentProfile = {
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

export const bulkAddStudents = async (instituteId: string, studentList: Omit<StudentProfile, 'fullName'| 'linkedUserUid'>[]) => {
    const batch = writeBatch(db);
    const studentsCol = getSubCollectionRef(instituteId, 'studentProfiles');
    studentList.forEach(studentData => {
        const docRef = doc(studentsCol, studentData.documentId);
        const profileData: StudentProfile = {
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
    // 1. Get all institutes
    const institutes = await getInstitutes();
    let foundProfile: (StaffProfile | StudentProfile) & { type: 'staff' | 'student' } | null = null;
    let foundInstituteId: string | null = null;

    // 2. Search for a matching profile in all institutes
    for (const institute of institutes) {
        // Search in staffProfiles
        const staffProfileRef = doc(db, 'institutes', institute.id, 'staffProfiles', documentId);
        const staffDoc = await getDoc(staffProfileRef);
        if (staffDoc.exists() && staffDoc.data().email === email) {
            foundProfile = { ...staffDoc.data() as StaffProfile, type: 'staff' };
            foundInstituteId = institute.id;
            break;
        }

        // Search in studentProfiles
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
    
    // 3. Update the AppUser document
    const userDocRef = doc(db, 'users', uid);
    const userUpdateData: Partial<AppUser> = {
        documentId: foundProfile.documentId,
        instituteId: foundInstituteId,
        displayName: (foundProfile as StaffProfile).displayName || `${(foundProfile as StudentProfile).firstName} ${(foundProfile as StudentProfile).lastName}`,
    };
    // Only update the role if the found profile is not a student
    if (foundProfile.role) {
        userUpdateData.role = foundProfile.role;
    }
    if ((foundProfile as StudentProfile).programId) {
        (userUpdateData as any).programId = (foundProfile as StudentProfile).programId;
    }
     if (foundProfile.photoURL) {
        userUpdateData.photoURL = foundProfile.photoURL;
    }

    await updateDoc(userDocRef, userUpdateData);

    // 4. Update the profile document with the linked UID
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

// --- ACHIEVEMENT INDICATORS ---

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    await addDoc(indicatorsCol, data);
};

export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const indicatorsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators');
    const q = query(indicatorsCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
};

export const updateAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string, data: Partial<Omit<AchievementIndicator, 'id'>>) => {
    const indicatorRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', indicatorId);
    await updateDoc(indicatorRef, data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
    const indicatorRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'achievementIndicators', indicatorId);
    await deleteDoc(indicatorRef);
};
