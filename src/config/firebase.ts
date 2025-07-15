
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, where, QueryConstraint, serverTimestamp, writeBatch, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { AppUser, UserRole, DidacticUnit, StudyProgram, Teacher, UnitAssignment, LoginImage } from '@/types';

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

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider };

export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: UserRole) => {
  console.log(`Saving additional data for UID: ${user.uid}, Role: ${role}, Name: ${user.displayName}, photoURL: ${user.photoURL}`);
  try {
    const userDocRef = doc(collection(db, 'users'), user.uid);
    await setDoc(userDocRef, { 
      uid: user.uid, // Ensure UID is also stored in the document
      role, 
      email: user.email, 
      displayName: user.displayName, 
      photoURL: user.photoURL 
    }, { merge: true });
    console.log("User data saved to Firestore.");
  } catch (error) {
    console.error("Error saving user data to Firestore:", error);
    throw error;
  }
};

export const updateUserProfile = async (data: { displayName?: string | null; photoURL?: string | null, dni?: string | null }) => {
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
        if (data.dni !== undefined) firestoreUpdates.dni = data.dni;
        
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, firestoreUpdates);
        }

        console.log(`User profile for ${user.uid} updated successfully.`);
    } catch (error) {
        console.error(`Error updating user profile for ${user.uid}:`, error);
        throw error;
    }
};


// --- Login Image Management ---

export const getLoginPageImageURL = async (): Promise<string | null> => {
  try {
    const imagesRef = collection(db, 'loginImages');
    const q = query(imagesRef, where("isActive", "==", true), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return docData.url;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching active login page image URL:", error);
    return null; // Return null on error to avoid breaking the UI
  }
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    try {
        const imagesRef = collection(db, 'loginImages');
        const q = query(imagesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt.toDate(),
        } as LoginImage));
    } catch (error) {
        console.error("Error fetching login images:", error);
        throw error;
    }
};

export const addLoginImage = async (imageDataUri: string): Promise<void> => {
    try {
        const imagesRef = collection(db, 'loginImages');
        await addDoc(imagesRef, {
            url: imageDataUri, // Storing the Base64 data URI
            isActive: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding login image:", error);
        throw error;
    }
};

export const setActiveLoginImage = async (id: string): Promise<void> => {
    const batch = writeBatch(db);
    try {
        // Find currently active image(s) to deactivate them
        const imagesRef = collection(db, 'loginImages');
        const q = query(imagesRef, where("isActive", "==", true));
        const activeDocs = await getDocs(q);

        activeDocs.forEach(doc => {
            batch.update(doc.ref, { isActive: false });
        });

        // Set the new image as active
        const newActiveRef = doc(db, 'loginImages', id);
        batch.update(newActiveRef, { isActive: true });

        await batch.commit();
    } catch (error) {
        console.error("Error setting active login image:", error);
        throw error;
    }
};

export const deleteLoginImage = async (id: string): Promise<void> => {
    try {
        const imageDocRef = doc(db, 'loginImages', id);
        await deleteDoc(imageDocRef);
    } catch (error) {
        console.error("Error deleting login image:", error);
        throw error;
    }
};


// Functions for Admin User Management
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ uid: docSnap.id, ...docSnap.data() } as AppUser);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

export const updateUserByAdmin = async (uid: string, data: { displayName?: string; role?: UserRole }) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
    console.log(`User ${uid} updated by admin with data:`, data);
  } catch (error) {
    console.error(`Error updating user ${uid} by admin:`, error);
    throw error;
  }
};

// Functions for Didactic Units
export const addDidacticUnit = async (unitData: Omit<DidacticUnit, 'id'>): Promise<void> => {
  try {
    const unitsCollectionRef = collection(db, 'didacticUnits');
    await addDoc(unitsCollectionRef, unitData);
    console.log("Didactic Unit added successfully with data:", unitData);
  } catch (error) {
    console.error("Error adding Didactic Unit to Firestore:", error);
    throw error;
  }
};

export const getDidacticUnits = async (): Promise<DidacticUnit[]> => {
  try {
    const unitsCol = collection(db, 'didacticUnits');
    const q = query(unitsCol, orderBy("name"));
    const querySnapshot = await getDocs(q);
    const units: DidacticUnit[] = [];
    querySnapshot.forEach((docSnap) => {
      units.push({ id: docSnap.id, ...docSnap.data() } as DidacticUnit);
    });
    return units;
  } catch (error) {
    console.error("Error fetching all didactic units:", error);
    throw error;
  }
};

export const updateDidacticUnit = async (id: string, data: Partial<Omit<DidacticUnit, 'id'>>): Promise<void> => {
  try {
    const unitDocRef = doc(db, 'didacticUnits', id);
    await updateDoc(unitDocRef, data);
    console.log(`Didactic Unit ${id} updated with data:`, data);
  } catch (error) {
    console.error(`Error updating didactic unit ${id}:`, error);
    throw error;
  }
};

export const deleteDidacticUnit = async (id: string): Promise<void> => {
  try {
    const unitDocRef = doc(db, 'didacticUnits', id);
    await deleteDoc(unitDocRef);
    console.log(`Didactic Unit ${id} deleted.`);
  } catch (error) {
    console.error(`Error deleting didactic unit ${id}:`, error);
    throw error;
  }
};

// Functions for Study Programs
export const addStudyProgram = async (programData: Omit<StudyProgram, 'id'>): Promise<void> => {
  try {
    const programsCollectionRef = collection(db, 'studyPrograms');
    await addDoc(programsCollectionRef, programData);
    console.log("Study Program added successfully with data:", programData);
  } catch (error) {
    console.error("Error adding Study Program to Firestore:", error);
    throw error;
  }
};

export const getStudyPrograms = async (): Promise<StudyProgram[]> => {
  try {
    const programsCol = collection(db, 'studyPrograms');
    const q = query(programsCol, orderBy("name"));
    const querySnapshot = await getDocs(q);
    const programs: StudyProgram[] = [];
    querySnapshot.forEach((docSnap) => {
      programs.push({ id: docSnap.id, ...docSnap.data() } as StudyProgram);
    });
    return programs;
  } catch (error) {
    console.error("Error fetching all study programs:", error);
    throw error;
  }
};

export const updateStudyProgram = async (id: string, data: Partial<Omit<StudyProgram, 'id'>>): Promise<void> => {
  try {
    const programDocRef = doc(db, 'studyPrograms', id);
    await updateDoc(programDocRef, data);
    console.log(`Study Program ${id} updated with data:`, data);
  } catch (error) {
    console.error(`Error updating study program ${id}:`, error);
    throw error;
  }
};

export const deleteStudyProgram = async (id: string): Promise<void> => {
  try {
    const programDocRef = doc(db, 'studyPrograms', id);
    await deleteDoc(programDocRef);
    console.log(`Study Program ${id} deleted.`);
  } catch (error) {
    console.error(`Error deleting study program ${id}:`, error);
    throw error;
  }
};


// Functions for Teachers
export const addTeacher = async (teacherData: Omit<Teacher, 'id'>): Promise<void> => {
  try {
    const teachersCollectionRef = collection(db, 'teachers');
    await addDoc(teachersCollectionRef, teacherData);
    console.log("Teacher added successfully with data:", teacherData);
  } catch (error) {
    console.error("Error adding Teacher to Firestore:", error);
    throw error;
  }
};

export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    const teachersCol = collection(db, 'teachers');
    const q = query(teachersCol, orderBy("fullName"));
    const querySnapshot = await getDocs(q);
    const teachers: Teacher[] = [];
    querySnapshot.forEach((docSnap) => {
      teachers.push({ id: docSnap.id, ...docSnap.data() } as Teacher);
    });
    return teachers;
  } catch (error) {
    console.error("Error fetching all teachers:", error);
    throw error;
  }
};

export const updateTeacher = async (id: string, data: Partial<Omit<Teacher, 'id'>>): Promise<void> => {
  try {
    const teacherDocRef = doc(db, 'teachers', id);
    await updateDoc(teacherDocRef, data);
    console.log(`Teacher ${id} updated with data:`, data);
  } catch (error) {
    console.error(`Error updating teacher ${id}:`, error);
    throw error;
  }
};

export const deleteTeacher = async (id: string): Promise<void> => {
  try {
    const teacherDocRef = doc(db, 'teachers', id);
    await deleteDoc(teacherDocRef);
    console.log(`Teacher ${id} deleted.`);
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    throw error;
  }
};

// Functions for Unit Assignments
export const addUnitAssignment = async (assignmentData: Omit<UnitAssignment, 'id'>): Promise<string> => {
  try {
    const assignmentsCollectionRef = collection(db, 'unitAssignments');
    const docRef = await addDoc(assignmentsCollectionRef, assignmentData);
    console.log("Unit Assignment added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding Unit Assignment to Firestore:", error);
    throw error;
  }
};

export const getUnitAssignments = async (year: number, studyProgram?: string): Promise<UnitAssignment[]> => {
  try {
    const assignmentsCol = collection(db, 'unitAssignments');
    const constraints: QueryConstraint[] = [where("year", "==", year)];
    if (studyProgram) {
      constraints.push(where("studyProgram", "==", studyProgram));
    }
    const q = query(assignmentsCol, ...constraints);
    const querySnapshot = await getDocs(q);
    const assignments: UnitAssignment[] = [];
    querySnapshot.forEach((docSnap) => {
      assignments.push({ id: docSnap.id, ...docSnap.data() } as UnitAssignment);
    });
    return assignments;
  } catch (error) {
    console.error("Error fetching unit assignments:", error);
    throw error;
  }
};

export const deleteUnitAssignment = async (id: string): Promise<void> => {
  try {
    const assignmentDocRef = doc(db, 'unitAssignments', id);
    await deleteDoc(assignmentDocRef);
    console.log(`Unit Assignment ${id} deleted.`);
  } catch (error) {
    console.error(`Error deleting unit assignment ${id}:`, error);
    throw error;
  }
};
