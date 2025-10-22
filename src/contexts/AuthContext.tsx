
"use client";

import type { AppUser, UserRole, Institute, Permission, StaffProfile, StudentProfile } from '@/types';
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
  getPrograms
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
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userDataFromDb = userDocSnap.data() as AppUser;

      let permissions: Permission[] = [];
      if (userDataFromDb.roleId && userDataFromDb.instituteId) {
        try {
          permissions = await getRolePermissions(userDataFromDb.instituteId, userDataFromDb.roleId) || [];
        } catch (error) {
          console.error("Error fetching permissions, defaulting to empty:", error);
          permissions = [];
        }
      } else if (userDataFromDb.role === 'SuperAdmin') {
        permissions = []; // SuperAdmin has implicit global access
      }
      
      let profileData: Partial<StudentProfile | StaffProfile> & {programId?: string} = {};
      let programName: string | undefined = undefined;

      if (userDataFromDb.documentId && userDataFromDb.instituteId) {
        const programs = await getPrograms(userDataFromDb.instituteId);
        const programMap = new Map(programs.map(p => [p.id, p.name]));

        let foundProfile: StudentProfile | StaffProfile | null = null;
        if (userDataFromDb.role === 'Student') {
          foundProfile = await getStudentProfile(userDataFromDb.instituteId, userDataFromDb.documentId);
        } else {
           foundProfile = await getStaffProfileByDocumentId(userDataFromDb.instituteId, userDataFromDb.documentId);
        }

        if (foundProfile) {
            profileData = foundProfile;
            if (foundProfile.programId) {
                programName = programMap.get(foundProfile.programId);
            }
        }
      }

      const appUser: AppUser = {
        ...userDataFromDb,
        ...profileData,
        uid: firebaseUser.uid,
        displayName: profileData.displayName || userDataFromDb.displayName || firebaseUser.displayName,
        photoURL: profileData.photoURL || userDataFromDb.photoURL || firebaseUser.photoURL,
        email: firebaseUser.email,
        permissions: permissions,
        programName: programName
      };
      
      setUser(appUser);
      if (appUser.instituteId && appUser.instituteId !== instituteId) {
        await setInstitute(appUser.instituteId);
      } else if (!appUser.instituteId && instituteId) {
        await setInstitute(null);
      }
    } else {
      // This is a brand new user who has just signed up but has not created a user document yet.
      // This is a valid state.
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'Student', 
        instituteId: null, 
        documentId: '',
        roleId: 'student', // Default roleId for new signups
        permissions: [],
      };
      // Let's create their user document now.
      await saveUserAdditionalData(
        { uid: firebaseUser.uid, email: firebaseUser.email, displayName: appUser.displayName, photoURL: appUser.photoURL },
        appUser.role,
        null
      );
      setUser(appUser);
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
           // Signing out to prevent being stuck in a broken state
           await firebaseSignOut(auth);
           setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
      
      // Explicitly create the default user state, save it, and then set it.
      const appUser: AppUser = {
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
          { uid: firebaseUser.uid, email: firebaseUser.email, displayName: name, photoURL: firebaseUser.photoURL },
          'Student',
          null
      );
      
      setUser(appUser);
      // The onAuthStateChanged listener will also fire, but setting it here ensures a smooth UI transition.
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const appUser: AppUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            role: 'Student',
            instituteId: null,
            documentId: '',
            roleId: 'student',
            permissions: []
        };
        await saveUserAdditionalData({
            uid: appUser.uid,
            email: appUser.email,
            displayName: appUser.displayName,
            photoURL: appUser.photoURL
        }, 'Student', null);
        setUser(appUser);
      }
      // If user exists, onAuthStateChanged will handle fetching the data.

    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle the state update and redirection.
      setUser(null);
      setInstitute(null);
      router.push('/');

    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Fallo al Cerrar Sesión', description: error.message || 'No se pudo cerrar sesión.', variant: 'destructive' });
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
