"use client";

import type { AppUser, UserRole } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, GoogleAuthProvider, saveUserAdditionalData, storage } from '@/config/firebase'; // Mocked
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
// Explicitly import Firebase Auth types if not using the real SDK yet
// For mock, these are not strictly necessary but good for eventual transition
// import type { User as FirebaseUser, AuthProvider as FirebaseAuthProvider } from 'firebase/auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole, profilePicture?: File) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  // Temp setter for mock environment
  setCurrentUserForMock: (user: AppUser | null) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const setCurrentUserForMock = (mockUser: AppUser | null) => {
    setUser(mockUser);
    setLoading(false);
  };

  useEffect(() => {
    // In a real app, onAuthStateChanged would be used here.
    // For mock, we rely on manual setting or a timeout for initial loading state.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        // Fetch role from (mocked) Firestore
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        const role = userDoc.exists ? userDoc.data()?.role : 'Student'; // Default to student if no role
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${firebaseUser.displayName?.[0] || 'U'}`,
          role: role as UserRole,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
     // Initial mock loading state
     const timer = setTimeout(() => {
      if (user === null) setLoading(false); // If onAuthStateChanged hasn't set user, stop loading
    }, 1000);


    return () => {
      unsubscribe();
      clearTimeout(timer);
    }
  }, []);

  const handleAuthSuccess = async (firebaseUser: any, role?: UserRole, displayName?: string, photoFile?: File) => {
    let photoURL = firebaseUser.photoURL;
    if (photoFile) {
      // Simulate file upload
      const storageRef = storage.ref(`profilePictures/${firebaseUser.uid}/${photoFile.name}`);
      const snapshot = await storageRef.put(photoFile); // Mocked put
      photoURL = await snapshot.ref.getDownloadURL(); // Mocked getDownloadURL
    }
    
    if (displayName && firebaseUser.displayName !== displayName) {
        await auth.updateProfile(firebaseUser, { displayName }); // Mocked updateProfile
    }
    if (photoURL && firebaseUser.photoURL !== photoURL) {
        await auth.updateProfile(firebaseUser, { photoURL });
    }

    // Fetch/set role
    const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
    const finalRole = role || (userDoc.exists ? userDoc.data()?.role : 'Student');
    
    if (!userDoc.exists || userDoc.data()?.role !== finalRole || userDoc.data()?.displayName !== displayName || userDoc.data()?.photoURL !== photoURL) {
      await saveUserAdditionalData( // Mocked save
        { uid: firebaseUser.uid, email: firebaseUser.email, displayName: displayName || firebaseUser.displayName, photoURL },
        finalRole
      );
    }

    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName || firebaseUser.displayName,
      photoURL: photoURL || `https://placehold.co/100x100.png?text=${(displayName || firebaseUser.displayName)?.[0] || 'U'}`,
      role: finalRole as UserRole,
    });
    router.push('/dashboard');
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password); // Mocked
      if (userCredential.user) {
        await handleAuthSuccess(userCredential.user);
      }
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message || 'Please check your credentials.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole, profilePicture?: File) => {
    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password); // Mocked
      if (userCredential.user) {
        await handleAuthSuccess(userCredential.user, role, name, profilePicture);
      }
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message || 'Could not create account.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider(); // Mocked
      const result = await auth.signInWithPopup(provider); // Mocked
      if (result.user) {
        // For Google Sign In, typically default to Student or check if user exists to retain role
        await handleAuthSuccess(result.user, 'Student'); 
      }
    } catch (error: any) {
      toast({ title: 'Google Sign-In Failed', description: error.message || 'Could not sign in with Google.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await auth.signOut(); // Mocked
      setUser(null);
      router.push('/');
    } catch (error: any) {
      toast({ title: 'Sign Out Failed', description: error.message || 'Could not sign out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser, setCurrentUserForMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
