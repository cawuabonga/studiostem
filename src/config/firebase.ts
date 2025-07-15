
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, where, QueryConstraint, serverTimestamp, writeBatch, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { AppUser, UserRole, DidacticUnit, StudyProgram, Teacher, UnitAssignment, LoginImage, Institute } from '@/types';

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

// This function needs to be aware of the instituteId in a multi-tenant setup
export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: UserRole) => {
  console.log(`Saving additional data for UID: ${user.uid}, Role: ${role}`);
  try {
    // For now, users are stored globally. In a multi-tenant app, this might change.
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { 
      uid: user.uid,
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
    } catch (error) {
        console.error(`Error updating user profile for ${user.uid}:`, error);
        throw error;
    }
};

const getInstituteDocRef = (instituteId: string) => {
    if (!instituteId) throw new Error("Institute ID is required for this operation.");
    return doc(db, 'institutes', instituteId);
};


// --- Institute Management (for SuperAdmins) ---
export const addInstitute = async (instituteId: string, data: { name: string }): Promise<void> => {
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


// --- Login Image Management (Per Institute) ---
export const getLoginPageImageURL = async (instituteId: string): Promise<string | null> => {
  try {
    const imagesRef = collection(getInstituteDocRef(instituteId), 'loginImages');
    const q = query(imagesRef, where("isActive", "==", true), limit(1));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].data().url;
  } catch (error) {
    console.error("Error fetching active login page image URL:", error);
    return null;
  }
};

export const getLoginImages = async (instituteId: string): Promise<LoginImage[]> => {
    const imagesRef = collection(getInstituteDocRef(instituteId), 'loginImages');
    const q = query(imagesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
    } as LoginImage));
};

export const addLoginImage = async (instituteId: string, imageDataUri: string): Promise<void> => {
    const imagesRef = collection(getInstituteDocRef(instituteId), 'loginImages');
    await addDoc(imagesRef, {
        url: imageDataUri,
        isActive: false,
        createdAt: serverTimestamp(),
    });
};

export const setActiveLoginImage = async (instituteId: string, imageId: string): Promise<void> => {
    const batch = writeBatch(db);
    const imagesRef = collection(getInstituteDocRef(instituteId), 'loginImages');
    const q = query(imagesRef, where("isActive", "==", true));
    const activeDocs = await getDocs(q);
    activeDocs.forEach(doc => batch.update(doc.ref, { isActive: false }));
    const newActiveRef = doc(imagesRef, imageId);
    batch.update(newActiveRef, { isActive: true });
    await batch.commit();
};

export const deleteLoginImage = async (instituteId: string, imageId: string): Promise<void> => {
    await deleteDoc(doc(collection(getInstituteDocRef(instituteId), 'loginImages'), imageId));
};


// --- User Management (Global for now) ---
export const getAllUsers = async (): Promise<AppUser[]> => {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, orderBy("displayName"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
};

export const updateUserByAdmin = async (uid: string, data: { displayName?: string; role?: UserRole }) => {
  await updateDoc(doc(db, 'users', uid), data);
};

// --- Didactic Units (Per Institute) ---
export const addDidacticUnit = async (instituteId: string, unitData: Omit<DidacticUnit, 'id'>): Promise<void> => {
  await addDoc(collection(getInstituteDocRef(instituteId), 'didacticUnits'), unitData);
};

export const getDidacticUnits = async (instituteId: string): Promise<DidacticUnit[]> => {
  const unitsCol = collection(getInstituteDocRef(instituteId), 'didacticUnits');
  const q = query(unitsCol, orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as DidacticUnit));
};

export const updateDidacticUnit = async (instituteId: string, unitId: string, data: Partial<Omit<DidacticUnit, 'id'>>): Promise<void> => {
  await updateDoc(doc(collection(getInstituteDocRef(instituteId), 'didacticUnits'), unitId), data);
};

export const deleteDidacticUnit = async (instituteId: string, unitId: string): Promise<void> => {
  await deleteDoc(doc(collection(getInstituteDocRef(instituteId), 'didacticUnits'), unitId));
};

// --- Study Programs (Per Institute) ---
export const addStudyProgram = async (instituteId: string, programData: Omit<StudyProgram, 'id'>): Promise<void> => {
  await addDoc(collection(getInstituteDocRef(instituteId), 'studyPrograms'), programData);
};

export const getStudyPrograms = async (instituteId: string): Promise<StudyProgram[]> => {
  const programsCol = collection(getInstituteDocRef(instituteId), 'studyPrograms');
  const q = query(programsCol, orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as StudyProgram));
};

export const updateStudyProgram = async (instituteId: string, programId: string, data: Partial<Omit<StudyProgram, 'id'>>): Promise<void> => {
  await updateDoc(doc(collection(getInstituteDocRef(instituteId), 'studyPrograms'), programId), data);
};

export const deleteStudyProgram = async (instituteId: string, programId: string): Promise<void> => {
  await deleteDoc(doc(collection(getInstituteDocRef(instituteId), 'studyPrograms'), programId));
};

// --- Teachers (Per Institute) ---
export const addTeacher = async (instituteId: string, teacherData: Omit<Teacher, 'id'>): Promise<void> => {
  await addDoc(collection(getInstituteDocRef(instituteId), 'teachers'), teacherData);
};

export const getTeachers = async (instituteId: string): Promise<Teacher[]> => {
  const teachersCol = collection(getInstituteDocRef(instituteId), 'teachers');
  const q = query(teachersCol, orderBy("fullName"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Teacher));
};

export const updateTeacher = async (instituteId: string, teacherId: string, data: Partial<Omit<Teacher, 'id'>>): Promise<void> => {
  await updateDoc(doc(collection(getInstituteDocRef(instituteId), 'teachers'), teacherId), data);
};

export const deleteTeacher = async (instituteId: string, teacherId: string): Promise<void> => {
  await deleteDoc(doc(collection(getInstituteDocRef(instituteId), 'teachers'), teacherId));
};

// --- Unit Assignments (Per Institute) ---
export const addUnitAssignment = async (instituteId: string, assignmentData: Omit<UnitAssignment, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(getInstituteDocRef(instituteId), 'unitAssignments'), assignmentData);
  return docRef.id;
};

export const getUnitAssignments = async (instituteId: string, year: number, studyProgram?: string): Promise<UnitAssignment[]> => {
  const assignmentsCol = collection(getInstituteDocRef(instituteId), 'unitAssignments');
  const constraints: QueryConstraint[] = [where("year", "==", year)];
  if (studyProgram) {
    constraints.push(where("studyProgram", "==", studyProgram));
  }
  const q = query(assignmentsCol, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as UnitAssignment));
};

export const deleteUnitAssignment = async (instituteId: string, assignmentId: string): Promise<void> => {
  await deleteDoc(doc(collection(getInstituteDocRef(instituteId), 'unitAssignments'), assignmentId));
};
