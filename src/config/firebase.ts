
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { AppUser, UserRole, DidacticUnit } from '@/types';

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

const APP_SETTINGS_COLLECTION = 'appSettings';
const LOGIN_PAGE_CONFIG_DOC = 'loginPageConfig';

export const getLoginPageImageURL = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, APP_SETTINGS_COLLECTION, LOGIN_PAGE_CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data()?.imageUrl || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching login page image URL from Firestore:", error);
    return null;
  }
};

export const setLoginPageImageURL = async (imageUrl: string): Promise<void> => {
  try {
    const docRef = doc(db, APP_SETTINGS_COLLECTION, LOGIN_PAGE_CONFIG_DOC);
    await setDoc(docRef, { imageUrl }, { merge: true });
  } catch (error) {
    console.error("Error setting login page image URL in Firestore:", error);
    throw error;
  }
};

// Functions for Admin User Management
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    const usersCol = collection(db, 'users');
    // It's good practice to order results, e.g., by email or displayName
    const q = query(usersCol, orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((docSnap) => {
      // Ensure uid is part of the AppUser, either from doc.id or a field
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

// Function to add a new Didactic Unit
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
