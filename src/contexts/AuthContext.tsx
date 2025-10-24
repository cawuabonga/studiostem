
"use client";

import type { AppUser, UserRole, Institute, Permission, StaffProfile, StudentProfile, Program } from '@/types';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  saveUserAdditionalData,
  getInstitute,
  createUserWithEmailAndPassword,
  getRolePermissions,
  getStaffProfileByDocumentId,
  getStudentProfile,
  getPrograms,
  getRoles
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
    if (instituteId && !institute) {
        getInstitute(instituteId).then(data => {
            setInstituteObject(data);
        }).catch(err => {
            console.error("Failed to load initial institute data:", err);
            setInstitute(null);
        });
    }
  }, [instituteId, institute, setInstitute]);


  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'Student',
        instituteId: null,
        documentId: '',
        roleId: 'student', 
        permissions: [],
      };
      await saveUserAdditionalData(
        { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName, photoURL: newUser.photoURL },
        newUser.role,
        null
      );
      setUser(newUser);
      return;
    }

    const baseUserData = userDocSnap.data() as AppUser;
    let finalUser: AppUser = { ...baseUserData, uid: firebaseUser.uid, permissions: [] };

    if (baseUserData.instituteId) {
        finalUser.instituteId = baseUserData.instituteId;
        if(baseUserData.roleId) {
             const permissions = await getRolePermissions(baseUserData.instituteId, baseUserData.roleId);
             finalUser.permissions = permissions || [];
        }

        if (baseUserData.documentId) {
            let profileData: StudentProfile | StaffProfile | null = null;
            if (baseUserData.role === 'Student') {
                profileData = await getStudentProfile(baseUserData.instituteId, baseUserData.documentId);
            } else {
                profileData = await getStaffProfileByDocumentId(baseUserData.instituteId, baseUserData.documentId);
            }

            if (profileData) {
                finalUser = { ...finalUser, ...profileData };
                 if (profileData.programId) {
                    const programs = await getPrograms(baseUserData.instituteId);
                    const programMap = new Map(programs.map(p => [p.id, p.name]));
                    finalUser.programName = programMap.get(profileData.programId) || undefined;
                }
            }
        }
    } else if (baseUserData.role === 'SuperAdmin') {
         finalUser.permissions = ['superadmin:institute:manage', 'superadmin:users:manage', 'superadmin:design:manage', 'superadmin:roles:manage'];
    }

    finalUser.displayName = finalUser.displayName || firebaseUser.displayName;
    finalUser.photoURL = finalUser.photoURL || firebaseUser.photoURL;

    setUser(finalUser);
    if (finalUser.instituteId && finalUser.instituteId !== instituteId) {
      await setInstitute(finalUser.instituteId);
    } else if (!finalUser.instituteId && instituteId) {
      await setInstitute(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          await fetchAndSetUser(firebaseUser);
        } catch (error) {
           console.error("Error fetching user data from Firestore:", error);
           toast({ title: 'Error de Autenticación', description: 'No se pudo cargar el perfil del usuario.', variant: 'destructive' });
           await firebaseSignOut(auth);
           setUser(null);
        }
      } else {
        setUser(null);
        setInstitute(null);
      }
      setLoading(false);
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
        setLoading(false);
    }
  };

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (user?.role === 'SuperAdmin') return true;
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

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
      await fetchAndSetUser(firebaseUser);
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest.
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Fallo al Cerrar Sesión', description: error.message || 'No se pudo cerrar sesión.', variant: 'destructive' });
    }
  };

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
