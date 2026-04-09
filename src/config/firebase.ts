
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.firebasestorage.app",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8",
  measurementId: "G-5FP9BYXHPF"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

// --- UTILS ---
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- AUTH & USERS ---
export const saveUserAdditionalData = async (user: any, role: UserRole, instituteId: string | null) => {
  const userDocRef = doc(db, 'users', user.uid);
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
    instituteId: instituteId,
    createdAt: Timestamp.now(),
  };
  setDoc(userDocRef, data, { merge: true })
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: data,
      }));
    });
};

export const updateUserProfile = async (data: Partial<AppUser>) => {
  const user = auth.currentUser;
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  updateDoc(userDocRef, data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
    });
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    const userDocRef = doc(db, 'users', uid);
    updateDoc(userDocRef, data)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
        }));
      });
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>) => {
    const userDocRef = doc(db, 'users', uid);
    updateDoc(userDocRef, data)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
        }));
      });
};

export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'users'), orderBy('email'));
    if (options.instituteId) q = query(q, where('instituteId', '==', options.instituteId));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    q = query(q, limit(options.limit));
    
    const snap = await getDocs(q).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
      throw err;
    });
    return {
        users: snap.docs.map(doc => doc.data() as AppUser),
        lastVisible: snap.docs[snap.docs.length - 1] || null
    };
};

export const getTotalUsersCount = async (instituteId?: string) => {
    let q = query(collection(db, 'users'));
    if (instituteId) q = query(q, where('instituteId', '==', instituteId));
    const snap = await getDocs(q).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
      throw err;
    });
    return snap.size;
};

export const linkUserToProfile = async (userId: string, documentId: string, email: string) => {
    const institutesSnap = await getDocs(collection(db, 'institutes')).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'institutes',
        operation: 'list',
      }));
      throw err;
    });

    for (const instDoc of institutesSnap.docs) {
        const instId = instDoc.id;
        const staffRef = doc(db, 'institutes', instId, 'staffProfiles', documentId);
        const studentRef = doc(db, 'institutes', instId, 'studentProfiles', documentId);

        const [staffSnap, studentSnap] = await Promise.all([
          getDoc(staffRef).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: staffRef.path,
              operation: 'get',
            }));
            throw err;
          }),
          getDoc(studentRef).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: studentRef.path,
              operation: 'get',
            }));
            throw err;
          })
        ]);

        if (staffSnap.exists() && staffSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(staffRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: staffRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
                throw err;
            });
            const data = staffSnap.data() as StaffProfile;
            const userUpdateData = { 
                instituteId: instId, 
                documentId, 
                role: data.role, 
                roleId: data.roleId 
            };
            await updateDoc(doc(db, 'users', userId), userUpdateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: userUpdateData,
                }));
                throw err;
            });
            return { role: data.role, instituteName: instDoc.data().name };
        }

        if (studentSnap.exists() && studentSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(studentRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: studentRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
                throw err;
            });
            const data = studentSnap.data() as StudentProfile;
            const userUpdateData = { 
                instituteId: instId, 
                documentId, 
                role: 'Student', 
                roleId: 'student' 
            };
            await updateDoc(doc(db, 'users', userId), userUpdateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: userUpdateData,
                }));
                throw err;
            });
            return { role: 'Student', instituteName: instDoc.data().name };
        }
    }
    throw new Error("No se encontró un perfil que coincida con el DNI y Email proporcionados.");
};

// --- INSTITUTES ---
export const addInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
  let logoUrl = '';
  if (logoFile) {
    logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
  }
  const instRef = doc(db, 'institutes', id);
  const instData = { ...data, id, logoUrl };
  setDoc(instRef, instData, { merge: true })
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: instRef.path,
        operation: 'write',
        requestResourceData: instData,
      }));
    });
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const snap = await getDoc(doc(db, 'institutes', id)).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `institutes/${id}`,
      operation: 'get',
    }));
    throw err;
  });
  return snap.exists() ? snap.data() as Institute : null;
};

export const updateInstitute = async (id: string, data: Partial<Institute>, logoFile?: File) => {
    const updateData = { ...data };
    if (logoFile) {
        updateData.logoUrl = await uploadFileAndGetURL(logoFile, `institutes/${id}/logo`);
    }
    const instRef = doc(db, 'institutes', id);
    updateDoc(instRef, updateData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: instRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
};

export const getInstitutes = async (): Promise<Institute[]> => {
  const snap = await getDocs(collection(db, 'institutes')).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: 'institutes',
      operation: 'list',
    }));
    throw err;
  });
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const deleteInstitute = async (id: string) => {
    deleteDoc(doc(db, 'institutes', id))
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `institutes/${id}`,
          operation: 'delete',
        }));
      });
};

// --- ROLES & PERMISSIONS ---
export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'roles')).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/roles`,
        operation: 'list',
      }));
      throw err;
    });
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (instituteId: string, data: Omit<Role, 'id'>) => {
    addDoc(collection(db, 'institutes', instituteId, 'roles'), data)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `institutes/${instituteId}/roles`,
          operation: 'create',
          requestResourceData: data,
        }));
      });
};

export const updateRole = async (instituteId: string, roleId: string, data: Partial<Role>) => {
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    updateDoc(roleRef, data)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: roleRef.path,
          operation: 'update',
          requestResourceData: data,
        }));
      });
};

export const deleteRole = async (instituteId: string, roleId: string) => {
    const roleRef = doc(db, 'institutes', instituteId, 'roles', roleId);
    deleteDoc(roleRef)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: roleRef.path,
          operation: 'delete',
        }));
      });
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'SuperAdmin') return null;
    if (roleId === 'student') {
        return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true } as any;
    }
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/roles/${roleId}`,
        operation: 'get',
      }));
      throw err;
    });
    return docSnap.exists() ? (docSnap.data() as Role).permissions : null;
};

// --- PROGRAMS ---
export const getPrograms = async (instituteId: string): Promise<Program[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'programs')).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `institutes/${instituteId}/programs`,
      operation: 'list',
    }));
    throw err;
  });
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
  addDoc(collection(db, 'institutes', instituteId, 'programs'), data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/programs`,
        operation: 'create',
        requestResourceData: data,
      }));
    });
};

export const updateProgram = async (instituteId: string, programId: string, data: Partial<Program>) => {
  const programRef = doc(db, 'institutes', instituteId, 'programs', programId);
  updateDoc(programRef, data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: programRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
    });
};

export const deleteProgram = async (instituteId: string, programId: string) => {
  const programRef = doc(db, 'institutes', instituteId, 'programs', programId);
  deleteDoc(programRef)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: programRef.path,
        operation: 'delete',
      }));
    });
};

// --- UNITS ---
export const getUnits = async (instituteId: string): Promise<Unit[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas')).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `institutes/${instituteId}/unidadesDidacticas`,
      operation: 'list',
    }));
    throw err;
  });
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
};

export const getUnit = async (instituteId: string, unitId: string): Promise<Unit | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/unidadesDidacticas/${unitId}`,
        operation: 'get',
      }));
      throw err;
    });
    return snap.exists() ? { id: snap.id, ...snap.data() } as Unit : null;
};

export const addUnit = async (instituteId: string, data: Omit<Unit, 'id'>) => {
  const docRef = await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas'), data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `institutes/${instituteId}/unidadesDidacticas`,
      operation: 'create',
      requestResourceData: data,
    }));
    throw err;
  });
  return docRef.id;
};

export const updateUnit = async (instituteId: string, unitId: string, data: Partial<Unit>) => {
  const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
  updateDoc(unitRef, data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: unitRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
    });
};

export const deleteUnit = async (instituteId: string, unitId: string) => {
  const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
  deleteDoc(unitRef)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: unitRef.path,
        operation: 'delete',
      }));
    });
};

export const bulkAddUnits = async (instituteId: string, units: Omit<Unit, 'id' | 'totalHours' | 'imageUrl'>[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'institutes', instituteId, 'unidadesDidacticas');
    units.forEach(u => {
        const docRef = doc(colRef);
        batch.set(docRef, { ...u, totalHours: u.theoreticalHours + u.practicalHours });
    });
    await batch.commit().catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/unidadesDidacticas (bulk)`,
        operation: 'write',
      }));
      throw err;
    });
};

export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId);
    updateDoc(unitRef, { imageUrl })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: unitRef.path,
          operation: 'update',
          requestResourceData: { imageUrl },
        }));
      });
};

// --- INDICATORS ---
export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
  const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators')).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `institutes/${instituteId}/unidadesDidacticas/${unitId}/indicators`,
      operation: 'list',
    }));
    throw err;
  });
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
  addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators'), data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/unidadesDidacticas/${unitId}/indicators`,
        operation: 'create',
        requestResourceData: data,
      }));
    });
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
  const indRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators', indicatorId);
  deleteDoc(indRef)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: indRef.path,
        operation: 'delete',
      }));
    });
};

// --- ATTENDANCE ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const id = `${unitId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', id)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/attendance/${id}`,
        operation: 'get',
      }));
      throw err;
    });
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, record: AttendanceRecord) => {
    const attRef = doc(db, 'institutes', instituteId, 'attendance', record.id);
    setDoc(attRef, record)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: attRef.path,
          operation: 'write',
          requestResourceData: record,
        }));
      });
};

// --- EFSRT ---
export const programEFSRT = async (instituteId: string, data: Omit<EFSRTAssignment, 'id' | 'status' | 'createdAt' | 'visits'>) => {
    const assignmentData = { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() };
    addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), assignmentData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `institutes/${instituteId}/efsrtAssignments`,
          operation: 'create',
          requestResourceData: assignmentData,
        }));
      });
};

// --- ASSETS ---
export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const assetRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        batch.update(assetRef, { status });
    });
    await batch.commit().catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'assets (bulk status change)',
        operation: 'write',
      }));
      throw err;
    });
};

// --- SUPPLY REQUESTS ---
export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: SupplyRequestStatus, data?: any) => {
    const ref = doc(db, 'institutes', instituteId, 'supplyRequests', id);
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Pedido no encontrado.");
        const req = snap.data() as SupplyRequest;
        if (status === 'Entregado') {
            for (const item of req.items) {
                const qty = item.approvedQuantity ?? item.requestedQuantity;
                const itemRef = doc(db, 'institutes', instituteId, 'supplyItems', item.itemId);
                const itemSnap = await tx.get(itemRef);
                const current = itemSnap.data()?.stock || 0;
                tx.update(itemRef, { stock: current - qty });
                tx.set(doc(collection(itemRef, 'history')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change: -qty, newStock: current - qty, notes: `Entrega pedido ${req.code}` });
            }
        } else if (status === 'Anulado' && req.status === 'Entregado') {
            for (const item of req.items) {
                const qty = item.approvedQuantity ?? item.requestedQuantity;
                const itemRef = doc(db, 'institutes', instituteId, 'supplyItems', item.itemId);
                const itemSnap = await tx.get(itemRef);
                const current = itemSnap.data()?.stock || 0;
                tx.update(itemRef, { stock: current + qty });
                tx.set(doc(collection(itemRef, 'history')), { timestamp: Timestamp.now(), userId: user?.uid, userName: user?.displayName, change: qty, newStock: current + qty, notes: `Anulación entrega ${req.code}` });
            }
        }
        tx.update(ref, { status, processedAt: Timestamp.now(), ...data });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: { status, ...data },
      }));
      throw err;
    });
};

// ... Resto de las funciones de exportación simplificadas para mantener el archivo manejable ...
// Todas las funciones de escritura/lectura deben seguir el patrón de .catch(errorEmitter.emit)

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus) => {
    const sylRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus');
    await setDoc(sylRef, data).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: sylRef.path,
        operation: 'write',
        requestResourceData: data,
      }));
      throw err;
    });
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, blocks: Record<string, ScheduleBlock>) => {
    const colId = `${programId}_${year}_${semester}_${turno}`;
    const batch = writeBatch(db);
    const colRef = collection(db, 'institutes', instituteId, 'schedules', colId, 'scheduleBlocks');
    const existing = await getDocs(colRef);
    existing.docs.forEach(d => batch.delete(d.ref));
    Object.entries(blocks).forEach(([key, b]) => batch.set(doc(colRef, key), { ...b, instituteId }));
    await batch.commit().catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `institutes/${instituteId}/schedules/${colId}`,
        operation: 'write',
      }));
      throw err;
    });
};

// Re-exporting missing functions from the request
export const getAssignments = async (instituteId: string, year: string, programId: string) => {
    const docRef = doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAcademicYearSettings = async (instituteId: string, year: string) => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('unitId', '==', unitId), where('year', '==', year));
    const snap = await getDocs(q);
    const daysFound = new Set<string>();
    snap.docs.forEach(d => daysFound.add(d.data().dayOfWeek));
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return Array.from(daysFound).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supervisorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>) => {
    const ref = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(ref, { visits: arrayUnion({ ...visit, id: Math.random().toString(36).substring(7) }) });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { grade, observations, status: grade >= 13 ? 'Aprobado' : 'Desaprobado', processedAt: Timestamp.now() });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [`${type}ReportUrl`]: url });
};

export const getSyllabusData = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
};

export const getWeekSyllabusData = async (instituteId: string, unitId: string, weekNumber: number): Promise<WeekData | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`));
    return snap.exists() ? { ...snap.data(), weekNumber } as WeekData : null;
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings) => {
    await setDoc(doc(db, 'institutes', instituteId, 'config', `academic_periods_${year}`), data);
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('teacherId', '==', teacherId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, assignments: Omit<NonTeachingAssignment, 'id'>[]) => {
    const batch = writeBatch(db);
    const existing = await getNonTeachingAssignments(instituteId, teacherId, year, period);
    existing.forEach(e => batch.delete(doc(db, 'institutes', instituteId, 'nonTeachingAssignments', e.id)));
    assignments.forEach(a => batch.set(doc(collection(db, 'institutes', instituteId, 'nonTeachingAssignments')), a));
    await batch.commit();
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'nonTeachingAssignments'), where('activityId', '==', activityId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingAssignment));
};

export const getStockHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyItems', itemId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyItems', itemId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const bulkAddAssetTypes = async (instituteId: string, types: any[]) => {
    const batch = writeBatch(db);
    types.forEach(t => batch.set(doc(collection(db, 'institutes', instituteId, 'assetTypes')), { ...t, lastAssignedNumber: 0 }));
    await batch.commit();
};

export const getAssetTypes = async (instituteId: string, options: { search?: string, limit?: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'institutes', instituteId, 'assetTypes'), orderBy('name'));
    if (options.search) q = query(q, where('name', '>=', options.search), where('name', '<=', options.search + '\uf8ff'));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    if (options.limit) q = query(q, limit(options.limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const getAssetTypeById = async (instituteId: string, typeId: string): Promise<AssetType | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', typeId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AssetType : null;
};

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const addAsset = async (instituteId: string, buildingId: string, environmentId: string, assetTypeId: string, data: any) => {
    const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
    const typeSnap = await getDoc(typeRef);
    if (!typeSnap.exists()) throw new Error("Tipo de activo no encontrado.");
    const typeData = typeSnap.data() as AssetType;
    const newNumber = (typeData.lastAssignedNumber || 0) + 1;
    const code = `${typeData.patrimonialCode}-${String(newNumber).padStart(4, '0')}`;
    const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    await runTransaction(db, async (tx) => {
        tx.update(typeRef, { lastAssignedNumber: newNumber });
        tx.set(assetRef, { ...data, id: assetRef.id, assetTypeId, codeOrSerial: code, name: typeData.name, type: typeData.class, instituteId, buildingId, environmentId });
    });
    return code;
};

export const updateAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string, data: Partial<Asset>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId), data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, environmentId: string, assetId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets', assetId));
};

export const getAssetHistory = async (instituteId: string, bId: string, eId: string, aId: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', bId, 'environments', eId, 'assets', aId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const q = query(collectionGroup(db, 'assets'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const moveAssets = async (instituteId: string, assets: Asset[], target: Environment) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const oldRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        const newRef = doc(db, 'institutes', instituteId, 'buildings', target.buildingId, 'environments', target.id, 'assets', a.id);
        batch.delete(oldRef);
        batch.set(newRef, { ...a, buildingId: target.buildingId, environmentId: target.id, buildingName: deleteField(), environmentName: deleteField() });
    });
    await batch.commit();
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'scheduleTemplates'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: Partial<ScheduleTemplate>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string) => {
    const batch = writeBatch(db);
    const all = await getScheduleTemplates(instituteId);
    all.forEach(t => batch.update(doc(db, 'institutes', instituteId, 'scheduleTemplates', t.id), { isDefault: t.id === id }));
    await batch.commit();
};

export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData> => {
    const programs = await getPrograms(instituteId);
    const prog = programs.find(p => p.id === programId);
    if (!prog) throw new Error("Programa no encontrado.");
    
    const units = (await getUnits(instituteId)).filter(u => u.programId === programId && u.semester === semester);
    const assignments = await getAssignments(instituteId, year, programId);
    const teachers = await getTeachers(instituteId);
    
    const reportUnits = [];
    for (const u of units) {
        const tId = assignments[u.period]?.[u.id];
        const teacher = teachers.find(t => t.documentId === tId);
        const students = await getEnrolledStudentProfiles(instituteId, u.id, year, u.period);
        reportUnits.push({ unit: u, teacherName: teacher?.fullName || null, students });
    }
    
    return { program: prog, units: reportUnits };
};

export const getApprovedPaymentsInDateRange = async (instituteId: string, start: Date, end: Date): Promise<Payment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'payments'), where('status', '==', 'Aprobado'), where('paymentDate', '>=', Timestamp.fromDate(start)), where('paymentDate', '<=', Timestamp.fromDate(end)));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
};

export const bulkAddAssetTypesFromExcel = async (instituteId: string, types: any[]) => {
    const batch = writeBatch(db);
    types.forEach(t => batch.set(doc(collection(db, 'institutes', instituteId, 'assetTypes')), { ...t, lastAssignedNumber: 0 }));
    await batch.commit();
};

export const updateAssetType = async (instituteId: string, id: string, data: Partial<AssetType>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
};

export const getAlbum = async (instituteId: string, id: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const updateAlbum = async (instituteId: string, id: string, data: Partial<Album>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
    try { await deleteObject(ref(storage, photo.url)); } catch (e) {}
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]) => {
    const batch = writeBatch(db);
    for (const f of files) {
        const id = Math.random().toString(36).substring(7);
        const url = await uploadFileAndGetURL(f, `institutes/${instituteId}/albums/${albumId}/${id}`);
        batch.set(doc(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos')), { url, createdAt: Timestamp.now(), albumId });
        if (files.indexOf(f) === 0) await updateDoc(doc(db, 'institutes', instituteId, 'albums', albumId), { coverImageUrl: url });
    }
    await batch.commit();
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const addAlbum = async (instituteId: string, data: Omit<Album, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const getEnrolledStudentProfiles = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<StudentProfile[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'matriculations'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    const studentIds = snap.docs.map(d => d.data().studentId);
    const profiles: StudentProfile[] = [];
    for (const id of studentIds) {
        const p = await getStudentProfile(instituteId, id);
        if (p) profiles.push(p);
    }
    return profiles;
};

export const getAllAssignmentsForYear = async (instituteId: string, year: string) => {
    const q = query(collection(db, 'institutes', instituteId, 'assignments'), where('__name__', '>=', `${year}_`), where('__name__', '<=', `${year}_\uf8ff`));
    const snap = await getDocs(q);
    const all: { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } = { 'MAR-JUL': {}, 'AGO-DIC': {} };
    snap.docs.forEach(doc => {
        const data = doc.data();
        Object.assign(all['MAR-JUL'], data['MAR-JUL'] || {});
        Object.assign(all['AGO-DIC'], data['AGO-DIC'] || {});
    });
    return all;
};

export const getAchievementRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const getAcademicRecordsForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AcademicRecord[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'academicRecords'), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicRecord));
};

export const batchUpdateAcademicRecords = async (instituteId: string, records: AcademicRecord[]) => {
    const batch = writeBatch(db);
    records.forEach(r => batch.set(doc(db, 'institutes', instituteId, 'academicRecords', r.id), r, { merge: true }));
    await batch.commit();
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]) => {
    const batch = writeBatch(db);
    for (const res of results) {
        const recordId = `${unitId}_${res.studentId}_${year}_${period}`;
        batch.update(doc(db, 'institutes', instituteId, 'academicRecords', recordId), { finalGrade: res.finalGrade, status: res.status });
        
        // Use individual getDocs for update because recursive batch updates inside loop are safer with direct refs
        const q = query(collection(db, 'institutes', instituteId, 'matriculations'), 
            where('studentId', '==', res.studentId), 
            where('unitId', '==', unitId), 
            where('year', '==', year), 
            where('period', '==', period)
        );
        const matSnap = await getDocs(q);
        matSnap.docs.forEach(d => batch.update(d.ref, { status: res.status }));
    }
    await batch.commit();
};

export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const colRef = collection(db, 'institutes', instituteId, 'scheduleTemplates');
    const snap = await getDocs(colRef);
    if (snap.empty) return null;
    const templates = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
    return templates.find(t => t.isDefault) || templates[0];
};

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), 
        where('instituteId', '==', instituteId), 
        where('year', '==', year), 
        where('semester', '==', semester)
    );
    const snap = await getDocs(q);
    const map: Record<string, ScheduleBlock> = {};
    snap.docs.forEach(d => {
        const b = d.data() as ScheduleBlock;
        map[`${b.dayOfWeek}-${b.startTime}`] = b;
    });
    return map;
};

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), 
        where('instituteId', '==', instituteId), 
        where('year', '==', year)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleBlock));
};

export const updateStock = async (instituteId: string, itemId: string, change: number, notes: string) => {
    const ref = doc(db, 'institutes', instituteId, 'supplyItems', itemId);
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Insumo no encontrado.");
        const current = snap.data().stock || 0;
        const next = current + change;
        if (next < 0) throw new Error("Stock insuficiente.");
        tx.update(ref, { stock: next });
        tx.set(doc(collection(ref, 'history')), { 
            timestamp: Timestamp.now(), 
            userId: user?.uid, 
            userName: user?.displayName, 
            change, 
            newStock: next, 
            notes 
        });
    });
};

export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'supplyItems'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyItem));
};

export const getRequestsForUser = async (instituteId: string, authUid: string): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), 
        where('requesterAuthUid', '==', authUid), 
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const createSupplyRequest = async (instituteId: string, data: Omit<SupplyRequest, 'id' | 'status' | 'createdAt' | 'code'>) => {
    const count = (await getDocs(collection(db, 'institutes', instituteId, 'supplyRequests'))).size;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { ...data, code, status: 'Pendiente', createdAt: Timestamp.now() });
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), 
        where('status', '==', status), 
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const updateSupplyRequest = async (instituteId: string, id: string, data: Partial<SupplyRequest>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), data);
};

export const createDirectApprovedRequest = async (instituteId: string, data: Omit<SupplyRequest, 'id' | 'status' | 'createdAt' | 'code'>) => {
    const count = (await getDocs(collection(db, 'institutes', instituteId, 'supplyRequests'))).size;
    const code = `PED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), { 
        ...data, 
        code, 
        status: 'Aprobado', 
        createdAt: Timestamp.now(), 
        processedAt: Timestamp.now() 
    });
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'nonTeachingActivities'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NonTeachingActivity));
};

export const addNonTeachingActivity = async (instituteId: string, data: Omit<NonTeachingActivity, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'nonTeachingActivities'), data);
};

export const updateNonTeachingActivity = async (instituteId: string, id: string, data: Partial<NonTeachingActivity>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id), data);
};

export const deleteNonTeachingActivity = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'nonTeachingActivities', id));
};

export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
};

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const buildings = await getBuildings(instituteId);
    const allEnvs: Environment[] = [];
    for (const b of buildings) {
        const envs = await getEnvironmentsForBuilding(instituteId, b.id);
        allEnvs.push(...envs);
    }
    return allEnvs;
};

export const addBuilding = async (instituteId: string, data: Omit<Building, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings'), data);
};

export const updateBuilding = async (instituteId: string, id: string, data: Partial<Building>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', id), data);
};

export const deleteBuilding = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', id));
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), buildingId } as Environment));
};

export const addEnvironment = async (instituteId: string, buildingId: string, data: Omit<Environment, 'id' | 'buildingId'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), data);
};

export const updateEnvironment = async (instituteId: string, buildingId: string, id: string, data: Partial<Environment>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id), data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', id));
};

export const addSupplyItem = async (instituteId: string, data: Omit<SupplyItem, 'id' | 'stock'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'supplyItems'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: Partial<SupplyItem>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyItems', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyItems', id));
};

export const addAssetType = async (instituteId: string, data: Omit<AssetType, 'id' | 'lastAssignedNumber'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'assetTypes'), { ...data, lastAssignedNumber: 0 });
};

