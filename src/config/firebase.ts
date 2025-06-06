// This is a mock Firebase configuration.
// In a real application, use your actual Firebase project credentials
// and initialize Firebase App.

// import { initializeApp, getApp, getApps } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
// let app;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp();
// }

// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// Mocked exports for UI development
export const auth = {
  onAuthStateChanged: (callback: (user: any) => void) => {
    console.warn("Firebase auth.onAuthStateChanged is mocked. Call `setCurrentUser` in AuthContext for testing.");
    // Simulate no user initially
    setTimeout(() => callback(null), 100); 
    return () => {}; // Unsubscribe function
  },
  // Add other mocked auth methods as needed for compilation
  signInWithEmailAndPassword: async (email?: string, password?: string) => {
    console.warn("signInWithEmailAndPassword mock called");
    if (email === "admin@capfap.com" && password === "password") {
      return { user: { uid: "admin123", email, displayName: "Admin User", photoURL: "https://placehold.co/100x100.png" } };
    }
    if (email === "student@capfap.com" && password === "password") {
      return { user: { uid: "student123", email, displayName: "Student User", photoURL: "https://placehold.co/100x100.png" } };
    }
    throw new Error("Mock auth error: Invalid credentials");
  },
  createUserWithEmailAndPassword: async (email?: string, password?: string) => {
     console.warn("createUserWithEmailAndPassword mock called");
     if (email && password) {
        return { user: { uid: `new-${Date.now()}`, email, displayName: "New User", photoURL: "https://placehold.co/100x100.png" } };
     }
     throw new Error("Mock auth error: Email and password required");
  },
  signInWithPopup: async (provider?: any) => {
    console.warn("signInWithPopup mock called with provider:", provider);
    // Simulate a generic Google user for the mock
    const mockUser = { 
      uid: "google" + Date.now(), 
      email: "googleuser@example.com", 
      displayName: "Google User", 
      photoURL: "https://placehold.co/100x100.png?text=G" 
    };
    // Simulate saving this mock Google user's details with a default role
    await db.collection('users').doc(mockUser.uid).set({ 
      role: 'Student', // Default role for new Google sign-ins in mock
      email: mockUser.email, 
      displayName: mockUser.displayName, 
      photoURL: mockUser.photoURL 
    });
    return { user: mockUser };
  },
  signOut: async () => {
    console.warn("signOut mock called");
  },
  updateProfile: async (user: any, profile: any) => {
    console.warn("updateProfile mock called for user:", user, "with profile:", profile);
    // Simulate profile update by merging
    Object.assign(user, profile); // This mutates the mock user object passed in
    return user; // Should return void, but mock can return user for chaining if needed
  }
};

export const db = {
  // Mocked Firestore
  collection: (path: string) => ({
    doc: (id?: string) => ({
      set: async (data: any) => console.warn(`Mock Firestore set: ${path}/${id || '(auto-id)'}`, data),
      get: async () => {
        console.warn(`Mock Firestore get: ${path}/${id}`);
        // Simulate fetching user data with role
        if (path === 'users' && id) {
            if (id === "admin123") return { exists: true, id, data: () => ({ role: 'Admin', displayName: "Admin User", email: "admin@capfap.com", photoURL: "https://placehold.co/100x100.png" })};
            if (id === "student123") return { exists: true, id, data: () => ({ role: 'Student', displayName: "Student User", email: "student@capfap.com", photoURL: "https://placehold.co/100x100.png" })};
            // For mock Google users, data would have been set during signInWithPopup mock
            if (id.startsWith("google")) return { exists: true, id, data: () => ({ role: 'Student', email: "googleuser@example.com", displayName: "Google User", photoURL: "https://placehold.co/100x100.png?text=G" })};
            if (id?.startsWith("new-")) return { exists: true, id, data: () => ({ role: 'Student', displayName: "New User", email: "newuser@example.com", photoURL: "https://placehold.co/100x100.png" })}; // Default new users to student
        }
        return { exists: false, id, data: () => undefined };
      },
      update:  async (data: any) => console.warn(`Mock Firestore update: ${path}/${id}`, data),
    })
  })
};

export const storage = {
  // Mocked Storage
  ref: (path: string) => ({
    put: async (file: File) => {
      console.warn(`Mock Storage put: ${path}`, file.name);
      return {
        ref: {
          getDownloadURL: async () => {
            console.warn(`Mock Storage getDownloadURL for: ${path}`);
            // Create a blob URL for local preview if possible, otherwise placeholder
            try {
              return URL.createObjectURL(file);
            } catch (e) {
              return `https://placehold.co/200x200.png?text=${encodeURIComponent(file.name)}`;
            }
          }
        }
      };
    }
  })
};

// Mock GoogleAuthProvider
export class GoogleAuthProvider {
  // Mock provider methods if needed
  static PROVIDER_ID = 'google.com'; // Standard provider ID
  constructor() {
    // console.warn("Mock GoogleAuthProvider instantiated");
  }
}


// Helper to simulate saving user role and additional info
export const saveUserAdditionalData = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }, role: string) => {
  console.warn(`Mock saveUserAdditionalData for UID: ${user.uid}, Role: ${role}, Name: ${user.displayName}, photoURL: ${user.photoURL}`);
  // In a real app, this would write to Firestore:
  await db.collection('users').doc(user.uid).set({ role, email: user.email, displayName: user.displayName, photoURL: user.photoURL }, { merge: true });
};
