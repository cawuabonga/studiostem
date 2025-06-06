
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider as FirebaseGoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Keep storage for other potential uses

const firebaseConfig = {
  apiKey: "AIzaSyDrtLhQIGsfH9RHl02Gs6fOX_honSi610I",
  authDomain: "app-iestp.firebaseapp.com",
  projectId: "app-iestp",
  storageBucket: "app-iestp.appspot.com", // Corrected from your previous input, ensuring it ends with .com
  messagingSenderId: "599711250596",
  appId: "1:599711250596:web:a570b99c0db17039540e31"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const firebaseStorage = getStorage(app); // Renamed to avoid conflict if you use 'storage' as a variable

// Export real Firebase services
export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider };


// Helper to save user role and additional info to Firestore
export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: string) => {
  console.log(`Saving additional data for UID: ${user.uid}, Role: ${role}, Name: ${user.displayName}, photoURL: ${user.photoURL}`);
  try {
    const userDocRef = doc(collection(db, 'users'), user.uid);
    await setDoc(userDocRef, { 
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

// Function to get the login page image URL
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

// Function to set the login page image URL
export const setLoginPageImageURL = async (imageUrl: string): Promise<void> => {
  try {
    const docRef = doc(db, APP_SETTINGS_COLLECTION, LOGIN_PAGE_CONFIG_DOC);
    await setDoc(docRef, { imageUrl }, { merge: true });
  } catch (error) {
    console.error("Error setting login page image URL in Firestore:", error);
    throw error;
  }
};
