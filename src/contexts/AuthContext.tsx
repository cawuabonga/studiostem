"use client";

import type { AppUser, UserRole, Institute, Permission, StaffProfile, StudentProfile, Program, Role } from '@/types';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  saveUserAdditionalData,
  getInstitute,
  createUserWithEmailAndPassword,
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

// Función para recuperar el último instituto visitado del navegador
const getInitialInstituteId = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('last_institute_id');
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
        // Guardamos en la memoria del navegador para persistencia de marca
        if (typeof window !== 'undefined') {
            localStorage.setItem('last_institute_id', id);
        }
        try {
            const instituteData = await getInstitute(id);
            setInstituteObject(instituteData);
        } catch (error) {
            console.error("Error fetching institute:", error);
            setInstituteObject(null);
        }
    } else {
        setInstituteObject(null);
    }
  }, []);

  useEffect(() => {
    if (instituteId && (!institute || institute.id !== instituteId)) {
        getInstitute(instituteId).then(data => {
            setInstituteObject(data);
        }).catch(err => {
            console.error("Failed to load initial institute data:", err);
        });
    }
  }, [instituteId, institute]);

  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
    try {
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

        if (baseUserData.instituteId && baseUserData.roleId) {
            finalUser.instituteId = baseUserData.instituteId;
            
            const roles = await getRoles(baseUserData.instituteId);
            const userRole = roles.find(r => r.id === baseUserData.roleId);
            if (userRole) {
                finalUser.roleName = userRole.name;
                finalUser.permissions = Object.keys(userRole.permissions).filter(p => userRole.permissions[p as Permission]) as Permission[];
            }

            if (baseUserData.documentId) {
                let profileData: StudentProfile | StaffProfile | null = null;
                
                // AJUSTE CRÍTICO: Detectar si el usuario debe buscarse en perfiles de alumnos (Estudiantes y Egresados)
                const isStudentType = 
                    baseUserData.role === 'Student' || 
                    baseUserData.role === 'Graduate' || 
                    baseUserData.roleId === 'student' || 
                    baseUserData.roleId === 'graduate';

                if (isStudentType) {
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
             finalUser.roleName = 'Super Administrador';
        }

        finalUser.displayName = finalUser.displayName || firebaseUser.displayName;
        finalUser.photoURL = finalUser.photoURL || firebaseUser.photoURL;

        setUser(finalUser);
        
        // Si el usuario tiene un instituto asignado, actualizamos la memoria de marca
        if (finalUser.instituteId) {
          await setInstitute(finalUser.instituteId);
        }
    } catch (error) {
        console.error("Error in fetchAndSetUser:", error);
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'Student',
            instituteId: null,
            documentId: '',
            roleId: 'student', 
            permissions: [],
        });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        await fetchAndSetUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setInstitute]);
  
  const reloadUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        try {
            await firebaseUser.reload();
            const refreshedFirebaseUser = auth.currentUser;
            if(refreshedFirebaseUser) {
                await fetchAndSetUser(refreshedFirebaseUser);
            }
        } catch (e) {
            console.error("Error reloading user:", e);
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
      toast({ title: 'Fallo de Registro', description: error.message || 'No se pudo crear la cuenta.', variant: 'destructive' });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({ title: 'Fallo de Inicio de Sesión con Google', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
  };

  const signOutUser = async () => {
    try {
      const currentInstId = user?.instituteId || instituteId;
      const isSuperAdmin = user?.role === 'SuperAdmin';

      await firebaseSignOut(auth);
      
      let redirectPath = '/';
      if (currentInstId && !isSuperAdmin) {
          redirectPath = `/login/${currentInstId}`;
      }

      router.push(redirectPath);
    } catch (error: any) {
      toast({ title: 'Fallo al Cerrar Sesión', description: 'No se pudo cerrar la sesión correctamente.', variant: 'destructive' });
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