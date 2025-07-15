
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, where, QueryConstraint, serverTimestamp, writeBatch, limit, collectionGroup } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { AppUser, UserRole, Institute } from '@/types';

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
    // This is a simplified function that fetches the logo for a "main" institute
    // to display on the login page. In a real multi-tenant app, you might have
    // a more complex way of determining this (e.g., based on domain).
    const mainInstituteId = 'istp-principal'; 
    const institute = await getInstitute(mainInstituteId);
    return institute?.logoUrl || null;
}

export const updateInstitute = async (instituteId: string, data: Partial<Omit<Institute, 'id'>>): Promise<void> => {
    await updateDoc(doc(db, 'institutes', instituteId), data);
};

export const deleteInstitute = async (instituteId: string): Promise<void> => {
    await deleteDoc(doc(db, 'institutes', instituteId));
};

// --- User Management ---
export const getAllUsersFromAllInstitutes = async (): Promise<AppUser[]> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as AppUser));
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};
