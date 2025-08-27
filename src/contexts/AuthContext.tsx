
"use client";

import type { AppUser, UserRole, Institute, Permission } from '@/types';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  saveUserAdditionalData,
  getInstitute,
  createUserWithEmailAndPassword,
  getRolePermissions
} from '@/config/firebase'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  instituteId: string | null;
  institute: Institute | null;
  setInstitute: (instituteId: string | null) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  reloadUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialInstituteId = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('instituteId');
    }
    return null;
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [instituteId, setInstituteIdState] = useState<string | null>(getInitialInstituteId);
  const [institute, setInstituteObject] = useState<Institute | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const setInstitute = useCallback(async (id: string | null) => {
    setInstituteIdState(id);
    if (id) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('instituteId', id);
        }
        try {
            const instituteData = await getInstitute(id);
            setInstituteObject(instituteData);
        } catch (error) {
            console.error("Error fetching institute:", error);
            setInstituteObject(null);
        }
    } else {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('instituteId');
        }
        setInstituteObject(null);
    }
  }, []);

  useEffect(() => {
    // On initial load, if there's an instituteId from localStorage, load its data.
    if (instituteId && !institute) {
        getInstitute(instituteId).then(data => {
            setInstituteObject(data);
        }).catch(err => {
            console.error("Failed to load initial institute data:", err);
            // Maybe the ID is stale, clear it
            setInstitute(null);
        });
    }
  }, [instituteId, institute, setInstitute]);


  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let appUser: AppUser;

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as AppUser;
            
            // Fetch permissions if roleId and instituteId exist
            if (userData.roleId && userData.instituteId) {
                const permissions = await getRolePermissions(userData.instituteId, userData.roleId);
                userData.permissions = permissions || [];
            } else {
                 userData.permissions = [];
            }
            
            appUser = {
                ...userData,
                displayName: userData.displayName || firebaseUser.displayName,
                photoURL: userData.photoURL || firebaseUser.photoURL,
            };

          } else {
             // This case is now primarily for Google Sign-In users or if the doc was manually deleted.
             appUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: 'Student', // Default role for new users
                instituteId: null, 
                documentId: '',
                permissions: [],
             };
             await saveUserAdditionalData(
              { uid: firebaseUser.uid, email: firebaseUser.email, displayName: appUser.displayName, photoURL: appUser.photoURL },
              appUser.role,
              appUser.instituteId
            );
          }
          
          setUser(appUser);
          
          if (appUser.instituteId && appUser.instituteId !== instituteId) {
            await setInstitute(appUser.instituteId);
          } else if (!appUser.instituteId && instituteId) {
            await setInstitute(null);
          }

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
      // Set loading to true immediately on any auth state change
      setLoading(true);
      if (firebaseUser) {
        await fetchAndSetUser(firebaseUser);
      } else {
        setUser(null);
        await setInstitute(null); // Clear institute on sign out
        setLoading(false); // Set loading to false if no user
      }
    });

    return () => unsubscribe();
  }, [setInstitute, toast]);
  
  const reloadUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        await firebaseUser.reload();
        const refreshedFirebaseUser = auth.currentUser;
        if(refreshedFirebaseUser) {
            await fetchAndSetUser(refreshedFirebaseUser);
        }
        setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión', description: 'Por favor, verifica tus credenciales.', variant: 'destructive' });
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });
      
      await saveUserAdditionalData(
          { uid: firebaseUser.uid, email: firebaseUser.email, displayName: name, photoURL: firebaseUser.photoURL },
          'Student', // Default role for new sign-ups
          null
      );
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/';
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Fallo al Cerrar Sesión', description: error.message || 'No se pudo cerrar sesión.', variant: 'destructive' });
      window.location.href = '/';
    }
  };

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (user?.role === 'SuperAdmin') return true;
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, instituteId, institute, setInstitute, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser, reloadUser, hasPermission }}>
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
