
"use client";

import type { AppUser, UserRole } from '@/types';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  instituteId: string | null;
  setInstitute: (instituteId: string) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple in-memory store for the institute ID for the session.
// In a real multi-tenant app, you might use localStorage or session storage.
let memoryInstituteId: string | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [instituteId, setInstituteId] = useState<string | null>(memoryInstituteId);
  const router = useRouter();
  const { toast } = useToast();

  const setInstitute = useCallback((id: string) => {
    memoryInstituteId = id;
    setInstituteId(id);
  }, []);

  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
      try {
          // This path will need to adapt if users are stored per-institute
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let role: UserRole = 'Student'; 
          let displayName = firebaseUser.displayName;
          let photoURL = firebaseUser.photoURL;
          let dni = '';
          // In a multi-tenant app, the user document should also contain the institute ID(s)
          // let userInstituteId = null; 

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            role = userData?.role || 'Student';
            displayName = userData?.displayName || firebaseUser.displayName;
            photoURL = userData?.photoURL || firebaseUser.photoURL;
            dni = userData?.dni || '';
            // userInstituteId = userData?.instituteId // Example
          } else {
             // When a user signs up, they should be associated with an institute.
             // This logic will need to be enhanced.
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
            dni: dni
          });

        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ title: 'Error de Autenticación', description: 'No se pudo cargar el perfil del usuario.', variant: 'destructive' });
          setUser(null); 
        } finally {
            setLoading(false);
        }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setLoading(true);
        await fetchAndSetUser(firebaseUser);
      } else {
        setUser(null);
        setInstitute(null); // Clear institute on sign out
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast, setInstitute]);
  
  const reloadUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        await firebaseUser.reload();
        const refreshedFirebaseUser = auth.currentUser;
        if(refreshedFirebaseUser) {
            await fetchAndSetUser(refreshedFirebaseUser);
        }
    }
  };

  const handleAuthSuccess = async (firebaseUser: FirebaseUser, roleInput?: UserRole, nameInput?: string) => {
    // This function will need to be aware of the institute context
    // For now, it works as before.
    let photoURL = firebaseUser.photoURL; 
    let displayName = nameInput || firebaseUser.displayName;
    
    if (auth.currentUser) {
       // ... (profile update logic remains the same for now)
    }
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    const finalRole = roleInput || (userDocSnap.exists() ? userDocSnap.data()?.role : 'Student');
    
    await saveUserAdditionalData(
      { uid: firebaseUser.uid, email: firebaseUser.email, displayName, photoURL },
      finalRole
    );

    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      photoURL: photoURL || `https://placehold.co/100x100.png?text=${displayName?.[0]?.toUpperCase() || 'U'}`,
      role: finalRole as UserRole,
    });
    router.push('/dashboard/institute'); // Redirect to institute selector
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión', description: error.message || 'Por favor, verifica tus credenciales.', variant: 'destructive' });
      setUser(null);
      setLoading(false);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await handleAuthSuccess(userCredential.user, 'Student', name);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
      setUser(null);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
      setUser(null);
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setInstitute(null); // Clear institute on sign out
      router.push('/');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Fallo al Cerrar Sesión', description: error.message || 'No se pudo cerrar sesión.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, instituteId, setInstitute, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser, reloadUser }}>
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
