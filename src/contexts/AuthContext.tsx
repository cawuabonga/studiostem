
"use client";

import type { AppUser, UserRole } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  saveUserAdditionalData, 
  firebaseUpdateProfile
} from '@/config/firebase'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>; // Role removed
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
          
          let role: UserRole = 'Student'; 
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
              role // This will be 'Student' if new user
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
          toast({ title: 'Error de Autenticación', description: 'No se pudo cargar el perfil del usuario.', variant: 'destructive' });
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
    let photoURL = firebaseUser.photoURL; 
    let displayName = nameInput || firebaseUser.displayName;
    
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser) {
      const profileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (displayName && currentAuthUser.displayName !== displayName) {
        profileUpdates.displayName = displayName;
      }
      if (photoURL && currentAuthUser.photoURL !== photoURL) {
        profileUpdates.photoURL = photoURL;
      }

      if (Object.keys(profileUpdates).length > 0) {
        try {
          await firebaseUpdateProfile(currentAuthUser, profileUpdates);
        } catch (error) {
          console.error("Error updating Firebase Auth profile:", error);
        }
      }
       if (auth.currentUser) { 
          displayName = auth.currentUser.displayName || displayName;
          photoURL = auth.currentUser.photoURL || photoURL;
       }
    }
    
    const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    // Default role is 'Student' if not provided (e.g., for Google sign-in or initial email sign-up)
    const finalRole = roleInput || (userDocSnap.exists() ? userDocSnap.data()?.role : 'Student');
    
    try {
      await saveUserAdditionalData(
        { uid: firebaseUser.uid, email: firebaseUser.email, displayName, photoURL },
        finalRole
      );
    } catch (error) {
       toast({ title: 'Error de Base de Datos', description: 'No se pudieron guardar los detalles del usuario.', variant: 'destructive' });
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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión', description: error.message || 'Por favor, verifica tus credenciales.', variant: 'destructive' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Role parameter removed, defaults to 'Student'
  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        // Pass name and 'Student' role to handleAuthSuccess
        await handleAuthSuccess(userCredential.user, 'Student', name);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
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
      // onAuthStateChanged will handle the rest, including calling handleAuthSuccess
      // which will default to 'Student' if it's a new user.
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
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
      toast({ title: 'Fallo al Cerrar Sesión', description: error.message || 'No se pudo cerrar sesión.', variant: 'destructive' });
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
