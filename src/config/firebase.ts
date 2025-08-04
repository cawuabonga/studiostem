

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PaymentConcept } from '@/types';

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

// Helper function to convert a file to a Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
export const addUnit = async (instituteId: string, data: Omit<Unit, 'id'>) => {
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
        const data = docSnap.data();
        // Convert Timestamps to Dates if they exist
        // This is a common requirement when fetching data that will be serialized
        // for client components, but for this component, we can probably leave them.
        return { id: docSnap.id, ...data } as Unit;
    }
    return null;
};

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

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'semester'>[]) => {
    const batch = writeBatch(db);
    const unitsCol = getSubCollectionRef(instituteId, 'unidadesDidacticas');
    units.forEach(unitData => {
        const docRef = doc(unitsCol); 
        const dataWithHours = {
            ...unitData,
            totalHours: (unitData.theoreticalHours || 0) + (unitData.practicalHours || 0),
            semester: 0, // Default value, should be set properly
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

// --- PAYMENTS ---
export const addPaymentConcept = async (instituteId: string, data: Omit<PaymentConcept, 'id' | 'createdAt'>): Promise<void> => {
    const conceptsCol = getSubCollectionRef(instituteId, 'paymentConcepts');
    await addDoc(conceptsCol, { ...data, createdAt: Timestamp.now() });
};

export const getPaymentConcepts = async (instituteId: string, activeOnly = false): Promise<PaymentConcept[]> => {
    const conceptsCol = getSubCollectionRef(instituteId, 'paymentConcepts');
    let q;
    // We only filter, not sort, to avoid composite indexes if not needed
    if (activeOnly) {
        q = query(conceptsCol, where("isActive", "==", true));
    } else {
        q = query(conceptsCol);
    }
    const snapshot = await getDocs(q);
    const concepts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentConcept));
    
    // Sort manually in the code
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

    const voucherUrl = await fileToDataUri(voucherFile);

    const paymentData: Omit<Payment, 'id'> = {
        ...data,
        voucherUrl,
        status: 'Pendiente',
        createdAt: Timestamp.now()
    };
    await setDoc(paymentDocRef, paymentData);
}

export const getStudentPayments = async (instituteId: string, studentId: string): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(paymentsCol, where("studentId", "==", studentId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
}

export const getPaymentsByStatus = async (instituteId: string, status: PaymentStatus): Promise<Payment[]> => {
    const paymentsCol = getSubCollectionRef(instituteId, 'payments');
    const q = query(paymentsCol, where("status", "==", status), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
}

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
    
    // Fetch all programs and units in parallel to create maps for efficient lookup
    const [programs, allUnits] = await Promise.all([
        getPrograms(instituteId),
        getUnits(instituteId)
    ]);
    const programMap = new Map(programs.map(p => [p.id, p]));
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
    // Simple query by studentId only
    const q = query(matriculationsCol, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    const matriculations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matriculation));

    // Manual sorting in code to avoid composite index
    matriculations.sort((a, b) => {
        if (a.year !== b.year) {
            return b.year.localeCompare(a.year); // Sort by year descending
        }
        return b.period.localeCompare(a.period); // Then by period descending
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
            // Filter out the evaluation to delete
            const updatedEvalsForIndicator = record.evaluations[indicatorId].filter(e => e.id !== evaluationId);
            const updatedEvaluations = {
                ...record.evaluations,
                [indicatorId]: updatedEvalsForIndicator
            };

            // Also remove associated grades
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
    // Use set with merge to create the document if it doesn't exist or update it if it does.
    await setDoc(attendanceRef, attendanceData, { merge: true });
};

// --- PLANNING: CONTENT & TASKS ---
export const addContentToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Content, 'id' | 'createdAt' | 'value'> & { value: string }, file?: File) => {
    const contentCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'contents');
    const contentDocRef = doc(contentCol);

    let finalValue = data.value;
    if (data.type === 'file' && file) {
        const storageRef = ref(firebaseStorage, `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/${contentDocRef.id}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalValue = await getDownloadURL(storageRef);
    }
    
    await setDoc(contentDocRef, { ...data, value: finalValue, createdAt: Timestamp.now() });
}

export const getContentsForWeek = async (instituteId: string, unitId: string, weekNumber: number): Promise<Content[]> => {
    const contentCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'contents');
    const q = query(contentCol, orderBy("createdAt"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
}

export const updateContentInWeek = async (instituteId: string, unitId: string, weekNumber: number, contentId: string, data: Partial<Content>) => {
    const contentRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'contents', contentId);
    await updateDoc(contentRef, data);
}

export const deleteContentFromWeek = async (instituteId: string, unitId: string, weekNumber: number, content: Content) => {
    const contentRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'contents', content.id);
    await deleteDoc(contentRef);
    if (content.type === 'file') {
        try {
            const fileRef = ref(firebaseStorage, content.value);
            await deleteObject(fileRef);
        } catch(error: any) {
            // Ignore if file doesn't exist, might have been cleaned up already.
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting file from storage:", error);
            }
        }
    }
}


export const addTaskToWeek = async (instituteId: string, unitId: string, weekNumber: number, data: Omit<Task, 'id' | 'createdAt' | 'weekNumber'>) => {
    const taskCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks');
    await addDoc(taskCol, { ...data, weekNumber, createdAt: Timestamp.now() });
}

export const getTasksForWeek = async (instituteId: string, unitId: string, weekNumber: number): Promise<Task[]> => {
    const taskCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks');
    const q = query(taskCol, orderBy("dueDate"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export const getAllTasksForUnit = async (instituteId: string, unitId: string, totalWeeks: number): Promise<Task[]> => {
    const allTasks: Task[] = [];
    for (let i = 1; i <= totalWeeks; i++) {
        const weeklyTasks = await getTasksForWeek(instituteId, unitId, i);
        allTasks.push(...weeklyTasks);
    }
    return allTasks;
}

export const updateTaskInWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, data: Partial<Task>) => {
    const taskRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId);
    await updateDoc(taskRef, data);
}

export const deleteTaskFromWeek = async (instituteId: string, unitId: string, weekNumber: number, taskId: string) => {
    const taskRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId);
    await deleteDoc(taskRef);
}

export const setWeekVisibility = async (instituteId: string, unitId: string, weekNumber: number, isVisible: boolean) => {
    const visibilityRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', 'visibility');
    await setDoc(visibilityRef, { [`week_${weekNumber}`]: isVisible }, { merge: true });
}

export const getWeeksVisibility = async (instituteId: string, unitId: string): Promise<Record<string, boolean>> => {
    const visibilityRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', 'visibility');
    const docSnap = await getDoc(visibilityRef);
    if (docSnap.exists()) {
        return docSnap.data() as Record<string, boolean>;
    }
    return {};
}
