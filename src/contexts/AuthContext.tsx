
"use client";

import type { AppUser, UserRole } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  saveUserAdditionalData, 
  firebaseUpdateProfile
} from '@/config/firebase'; // Real Firebase config
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
// Storage related imports are no longer needed here for profile picture upload
// import { ref as storageRef, uploadBytes, getDownloadURL as getStorageDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let role: UserRole = 'Student'; // Default role
          let displayName = firebaseUser.displayName;
          let photoURL = firebaseUser.photoURL;

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            role = userData?.role || 'Student';
            displayName = userData?.displayName || firebaseUser.displayName;
            photoURL = userData?.photoURL || firebaseUser.photoURL;
          } else {
            await saveUserAdditionalData(
              { uid: firebaseUser.uid, email: firebaseUser.email, displayName, photoURL },
              role
            );
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: displayName,
            photoURL: photoURL || `https://placehold.co/100x100.png?text=${displayName?.[0]?.toUpperCase() || 'U'}`,
            role: role,
          });
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ title: 'Authentication Error', description: 'Could not load user profile.', variant: 'destructive' });
          setUser(null); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAuthSuccess = async (firebaseUser: FirebaseUser, roleInput?: UserRole, nameInput?: string) => {
    let photoURL = firebaseUser.photoURL; // Use photoURL from auth provider (e.g. Google)
    let displayName = nameInput || firebaseUser.displayName;
    
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser) {
      const profileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (displayName && currentAuthUser.displayName !== displayName) {
        profileUpdates.displayName = displayName;
      }
      // Only update photoURL if it's explicitly provided (e.g., from Google) and different
      if (photoURL && currentAuthUser.photoURL !== photoURL) {
        profileUpdates.photoURL = photoURL;
      }
      if (Object.keys(profileUpdates).length > 0) {
        try {
          await firebaseUpdateProfile(currentAuthUser, profileUpdates);
        } catch (error) {
          console.error("Error updating Firebase Auth profile:", error);
          toast({ title: 'Profile Update Failed', description: 'Could not update Firebase profile.', variant: 'destructive' });
        }
      }
    }
    
    const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    const finalRole = roleInput || (userDocSnap.exists() ? userDocSnap.data()?.role : 'Student');
    
    try {
      await saveUserAdditionalData(
        { uid: firebaseUser.uid, email: firebaseUser.email, displayName, photoURL },
        finalRole
      );
    } catch (error) {
       toast({ title: 'Database Error', description: 'Could not save user details.', variant: 'destructive' });
    }

    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      photoURL: photoURL || `https://placehold.co/100x100.png?text=${displayName?.[0]?.toUpperCase() || 'U'}`,
      role: finalRole as UserRole,
    });
    router.push('/dashboard');
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user state and redirecting
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: 'Login Failed', description: error.message || 'Please check your credentials.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await handleAuthSuccess(userCredential.user, role, name);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Registration Failed', description: error.message || 'Could not create account.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting user state and redirecting
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Google Sign-In Failed', description: error.message || 'Could not sign in with Google.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      router.push('/');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Sign Out Failed', description: error.message || 'Could not sign out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser }}>
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
