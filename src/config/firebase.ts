
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider as FirebaseGoogleAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDrtLhQIGsfH9RHl02Gs6fOX_honSi610I",
  authDomain: "app-iestp.firebaseapp.com",
  projectId: "app-iestp",
  storageBucket: "app-iestp.appspot.com",
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
const storage = getStorage(app);


// Export real Firebase services
export { auth, db, storage, firebaseUpdateProfile };

// GoogleAuthProvider can be instantiated directly
export class GoogleAuthProvider extends FirebaseGoogleAuthProvider {}

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
    // Potentially re-throw or handle as per application's error handling strategy
    throw error;
  }
};
