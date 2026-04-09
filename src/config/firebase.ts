
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, DocumentSnapshot, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

// --- UTILIDADES ---
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- AUTENTICACIÓN Y DISEÑO DE LOGIN ---
export const getLoginDesignSettings = async (): Promise<LoginDesign | null> => {
    const snap = await getDoc(doc(db, 'config', 'login_design')).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'config/login_design', operation: 'get' }));
        throw err;
    });
    return snap.exists() ? snap.data() as LoginDesign : null;
};

export const saveLoginDesignSettings = async (data: LoginDesign) => {
    await setDoc(doc(db, 'config', 'login_design'), data, { merge: true });
};

export const getLoginImages = async (): Promise<LoginImage[]> => {
    const snap = await getDocs(query(collection(db, 'config', 'login_design', 'images'), orderBy('createdAt', 'desc')));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginImage));
};

export const uploadLoginImage = async (file: File, name: string) => {
    const id = Math.random().toString(36).substring(7);
    const url = await uploadFileAndGetURL(file, `config/login/images/${id}`);
    const data = { id, name, url, createdAt: Timestamp.now() };
    await setDoc(doc(db, 'config', 'login_design', 'images', id), data);
};

export const deleteLoginImage = async (image: LoginImage) => {
    await deleteDoc(doc(db, 'config', 'login_design', 'images', image.id));
    try { await deleteObject(ref(storage, image.url)); } catch (e) {}
};

export const setActiveLoginImage = async (imageUrl: string) => {
    await updateDoc(doc(db, 'config', 'login_design'), { imageUrl });
};

export const getInstituteLoginPageImage = async (): Promise<string | null> => {
    const settings = await getLoginDesignSettings();
    return settings?.imageUrl || null;
};

// --- GESTIÓN DE USUARIOS (SUPERADMIN) ---
export const getAllUsersPaginated = async (options: { instituteId?: string, limit: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'users'), orderBy('displayName'), limit(options.limit));
    if (options.instituteId) q = query(q, where('instituteId', '==', options.instituteId));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    
    const snap = await getDocs(q);
    return {
        users: snap.docs.map(d => d.data() as AppUser),
        lastVisible: snap.docs[snap.docs.length - 1] || null
    };
};

export const getTotalUsersCount = async (instituteId?: string) => {
    let q = query(collection(db, 'users'));
    if (instituteId) q = query(q, where('instituteId', '==', instituteId));
    const snap = await getCountFromServer(q);
    return snap.data().count;
};

export const updateUserBySuperAdmin = async (uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const updateUserByInstituteAdmin = async (instituteId: string, uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

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
  await setDoc(userDocRef, data, { merge: true });
};

export const linkUserToProfile = async (userId: string, documentId: string, email: string) => {
    const institutesSnap = await getDocs(collection(db, 'institutes'));
    for (const instDoc of institutesSnap.docs) {
        const instId = instDoc.id;
        const staffRef = doc(db, 'institutes', instId, 'staffProfiles', documentId);
        const studentRef = doc(db, 'institutes', instId, 'studentProfiles', documentId);

        const [staffSnap, studentSnap] = await Promise.all([getDoc(staffRef), getDoc(studentRef)]);

        if (staffSnap.exists() && staffSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(staffRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: staffRef.path, operation: 'update', requestResourceData: updateData }));
                throw err;
            });
            const data = staffSnap.data() as StaffProfile;
            await updateDoc(doc(db, 'users', userId), { instituteId: instId, documentId, role: data.role, roleId: data.roleId });
            return { role: data.role, instituteName: instDoc.data().name };
        }

        if (studentSnap.exists() && studentSnap.data().email === email) {
            const updateData = { linkedUserUid: userId };
            await updateDoc(studentRef, updateData).catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: updateData }));
                throw err;
            });
            await updateDoc(doc(db, 'users', userId), { instituteId: instId, documentId, role: 'Student', roleId: 'student' });
            return { role: 'Student', instituteName: instDoc.data().name };
        }
    }
    throw new Error("No se encontró un perfil que coincida con los datos.");
};

export const getRoles = async (instituteId: string): Promise<Role[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'roles'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Role));
};

export const addRole = async (instituteId: string, data: Omit<Role, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'roles'), data);
};

export const updateRole = async (instituteId: string, id: string, data: Partial<Role>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'roles', id), data);
};

export const deleteRole = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'roles', id));
};

export const getRolePermissions = async (instituteId: string, roleId: string): Promise<Record<Permission, boolean> | null> => {
    if (roleId === 'SuperAdmin') return null;
    if (roleId === 'student') return { 'student:unit:view': true, 'student:grades:view': true, 'student:payments:manage': true, 'student:efsrt:view': true } as any;
    const docSnap = await getDoc(doc(db, 'institutes', instituteId, 'roles', roleId));
    return docSnap.exists() ? (docSnap.data() as Role).permissions : null;
};

// --- INSTITUTOS ---
export const getInstitutes = async (): Promise<Institute[]> => {
  const snap = await getDocs(collection(db, 'institutes'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute));
};

export const getInstitute = async (id: string): Promise<Institute | null> => {
  const snap = await getDoc(doc(db, 'institutes', id));
  return snap.exists() ? snap.data() as Institute : null;
};

export const updateUserProfile = async (data: Partial<AppUser>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), data);
    if (data.displayName) {
        await firebaseUpdateProfile(currentUser, { displayName: data.displayName });
    }
};

// --- PROGRAMAS Y UNIDADES ---
export const getPrograms = async (instituteId: string): Promise<Program[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'programs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
};

export const addProgram = async (instituteId: string, data: Omit<Program, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'programs'), data);
};

export const updateProgram = async (instituteId: string, id: string, data: Partial<Program>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'programs', id), data);
};

export const deleteProgram = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'programs', id));
};

// --- INFRAESTRUCTURA ---
export const getBuildings = async (instituteId: string): Promise<Building[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Building));
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

export const getEnvironments = async (instituteId: string): Promise<Environment[]> => {
    const q = query(collectionGroup(db, 'environments'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Environment));
};

export const getEnvironmentsForBuilding = async (instituteId: string, buildingId: string): Promise<Environment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Environment));
};

export const addEnvironment = async (instituteId: string, buildingId: string, data: Omit<Environment, 'id' | 'buildingId'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments'), { ...data, buildingId, instituteId });
};

export const updateEnvironment = async (instituteId: string, buildingId: string, envId: string, data: Partial<Environment>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId), data);
};

export const deleteEnvironment = async (instituteId: string, buildingId: string, envId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId));
};

// --- ACTIVOS (ACTIVOS FIJOS) ---
export const getAssetTypeById = async (instituteId: string, id: string): Promise<AssetType | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as AssetType : null;
};

export const getAssetTypes = async (instituteId: string, options: { search?: string, limit?: number, startAfter?: DocumentSnapshot }) => {
    let q = query(collection(db, 'institutes', instituteId, 'assetTypes'), orderBy('name'));
    if (options.search) {
        const s = options.search.toUpperCase();
        q = query(q, where('name', '>=', s), where('name', '<=', s + '\uf8ff'));
    }
    if (options.limit) q = query(q, limit(options.limit));
    if (options.startAfter) q = query(q, startAfter(options.startAfter));
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetType));
};

export const addAssetType = async (instituteId: string, data: Omit<AssetType, 'id' | 'lastAssignedNumber'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'assetTypes'), { ...data, lastAssignedNumber: 0 });
};

export const updateAssetType = async (instituteId: string, id: string, data: Partial<AssetType>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'assetTypes', id), data);
};

export const deleteAssetType = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'assetTypes', id));
};

export const bulkAddAssetTypes = async (instituteId: string, items: any[]) => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const ref = doc(collection(db, 'institutes', instituteId, 'assetTypes'));
        batch.set(ref, { ...item, lastAssignedNumber: 0 });
    });
    await batch.commit();
};

export const getAssetsForEnvironment = async (instituteId: string, buildingId: string, environmentId: string): Promise<Asset[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', environmentId, 'assets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const getAllAssets = async (instituteId: string): Promise<Asset[]> => {
    const q = query(collectionGroup(db, 'assets'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
};

export const addAsset = async (instituteId: string, buildingId: string, envId: string, assetTypeId: string, data: any) => {
    return await runTransaction(db, async (tx) => {
        const typeRef = doc(db, 'institutes', instituteId, 'assetTypes', assetTypeId);
        const typeSnap = await tx.get(typeRef);
        if (!typeSnap.exists()) throw new Error("Tipo de activo no encontrado");
        
        const typeData = typeSnap.data() as AssetType;
        const newNumber = (typeData.lastAssignedNumber || 0) + 1;
        const fullCode = `${typeData.patrimonialCode}-${String(newNumber).padStart(4, '0')}`;
        
        const assetRef = doc(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId, 'assets'));
        tx.set(assetRef, { 
            ...data, 
            id: assetRef.id, 
            assetTypeId, 
            codeOrSerial: fullCode, 
            instituteId, 
            buildingId, 
            environmentId: envId,
            name: typeData.name,
            type: typeData.class
        });
        tx.update(typeRef, { lastAssignedNumber: newNumber });
        return fullCode;
    });
};

export const updateAsset = async (instituteId: string, buildingId: string, envId: string, assetId: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId, 'assets', assetId), data);
};

export const deleteAsset = async (instituteId: string, buildingId: string, envId: string, assetId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId, 'assets', assetId));
};

export const bulkUpdateAssetsStatus = async (instituteId: string, assets: Asset[], status: string) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        const ref = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        batch.update(ref, { status });
    });
    await batch.commit();
};

export const moveAssets = async (instituteId: string, assets: Asset[], targetEnv: Environment) => {
    const batch = writeBatch(db);
    assets.forEach(a => {
        // En Firestore, "mover" es crear en el nuevo destino y borrar el viejo
        const oldRef = doc(db, 'institutes', instituteId, 'buildings', a.buildingId, 'environments', a.environmentId, 'assets', a.id);
        const newRef = doc(db, 'institutes', instituteId, 'buildings', targetEnv.buildingId, 'environments', targetEnv.id, 'assets', a.id);
        
        const { id, ...data } = a;
        batch.set(newRef, { ...data, buildingId: targetEnv.buildingId, environmentId: targetEnv.id });
        batch.delete(oldRef);
    });
    await batch.commit();
};

export const getAssetHistory = async (instituteId: string, buildingId: string, envId: string, assetId: string): Promise<AssetHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'buildings', buildingId, 'environments', envId, 'assets', assetId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetHistoryLog));
};

// --- SUMINISTROS E INSUMOS ---
export const getSupplyCatalog = async (instituteId: string): Promise<SupplyItem[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'supplyCatalog'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyItem));
};

export const addSupplyItem = async (instituteId: string, data: Omit<SupplyItem, 'id' | 'stock'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'supplyCatalog'), { ...data, stock: 0 });
};

export const updateSupplyItem = async (instituteId: string, id: string, data: Partial<SupplyItem>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id), data);
};

export const deleteSupplyItem = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'supplyCatalog', id));
};

export const updateStock = async (instituteId: string, itemId: string, change: number, notes: string) => {
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', itemId);
        const snap = await tx.get(itemRef);
        if (!snap.exists()) throw new Error("Insumo no encontrado");
        
        const currentStock = snap.data().stock || 0;
        const newStock = currentStock + change;
        if (newStock < 0) throw new Error("Stock insuficiente");
        
        tx.update(itemRef, { stock: newStock });
        const logRef = doc(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'history'));
        tx.set(logRef, {
            timestamp: Timestamp.now(),
            userId: user?.uid || 'system',
            userName: user?.displayName || 'Sistema',
            change,
            newStock,
            notes
        });
    });
};

export const getSupplyItemHistory = async (instituteId: string, itemId: string): Promise<StockHistoryLog[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'supplyCatalog', itemId, 'history'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryLog));
};

export const createSupplyRequest = async (instituteId: string, data: any) => {
    const countSnap = await getCountFromServer(collection(db, 'institutes', instituteId, 'supplyRequests'));
    const code = `PED-${new Date().getFullYear()}-${String(countSnap.data().count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), {
        ...data,
        code,
        status: 'Pendiente',
        createdAt: Timestamp.now()
    });
};

export const getRequestsForUser = async (instituteId: string, authUid: string): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where('requesterAuthUid', '==', authUid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const getSupplyRequestsByStatus = async (instituteId: string, status: SupplyRequestStatus): Promise<SupplyRequest[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'supplyRequests'), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest));
};

export const updateSupplyRequest = async (instituteId: string, id: string, data: Partial<SupplyRequest>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'supplyRequests', id), data);
};

export const updateSupplyRequestStatus = async (instituteId: string, id: string, status: SupplyRequestStatus, extraData: any) => {
    const user = auth.currentUser;
    await runTransaction(db, async (tx) => {
        const reqRef = doc(db, 'institutes', instituteId, 'supplyRequests', id);
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists()) throw new Error("Pedido no encontrado");
        const reqData = reqSnap.data() as SupplyRequest;

        // Si se marca como entregado, descontar stock
        if (status === 'Entregado') {
            for (const item of reqData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemSnap = await tx.get(itemRef);
                if (itemSnap.exists()) {
                    const qty = item.approvedQuantity ?? item.requestedQuantity;
                    const newStock = (itemSnap.data().stock || 0) - qty;
                    if (newStock < 0) throw new Error(`Stock insuficiente para ${item.name}`);
                    tx.update(itemRef, { stock: newStock });
                }
            }
        }
        
        // Si se anula un entregado, devolver stock
        if (status === 'Anulado' && reqData.status === 'Entregado') {
             for (const item of reqData.items) {
                const itemRef = doc(db, 'institutes', instituteId, 'supplyCatalog', item.itemId);
                const itemSnap = await tx.get(itemRef);
                if (itemSnap.exists()) {
                    const qty = item.approvedQuantity ?? item.requestedQuantity;
                    tx.update(itemRef, { stock: (itemSnap.data().stock || 0) + qty });
                }
            }
        }

        tx.update(reqRef, { 
            ...extraData, 
            status, 
            processedAt: Timestamp.now(),
            processedBy: user?.displayName || 'Sistema'
        });
    });
};

export const createDirectApprovedRequest = async (instituteId: string, data: any) => {
    const countSnap = await getCountFromServer(collection(db, 'institutes', instituteId, 'supplyRequests'));
    const code = `PED-DIR-${new Date().getFullYear()}-${String(countSnap.data().count + 1).padStart(4, '0')}`;
    await addDoc(collection(db, 'institutes', instituteId, 'supplyRequests'), {
        ...data,
        code,
        status: 'Aprobado',
        createdAt: Timestamp.now(),
        isDirect: true
    });
};

// --- ASIGNACIONES Y CARGA HORARIA ---
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

export const getAssignments = async (instituteId: string, year: string, programId: string) => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'assignments', `${year}_${programId}`));
    return snap.exists() ? snap.data() as { 'MAR-JUL': Assignment, 'AGO-DIC': Assignment } : { 'MAR-JUL': {}, 'AGO-DIC': {} };
};

export const getAllNonTeachingAssignmentsForYear = async (instituteId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collectionGroup(db, 'nonTeachingAssignments'), where('instituteId', '==', instituteId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const getNonTeachingActivities = async (instituteId: string): Promise<NonTeachingActivity[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'nonTeachingActivities'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingActivity));
};

export const getNonTeachingAssignments = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod): Promise<NonTeachingAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'staffProfiles', teacherId, 'nonTeachingAssignments'), where('year', '==', year), where('period', '==', period));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

export const saveNonTeachingAssignmentsForTeacher = async (instituteId: string, teacherId: string, year: string, period: UnitPeriod, assignments: Omit<NonTeachingAssignment, 'id'>[]) => {
    const colRef = collection(db, 'institutes', instituteId, 'staffProfiles', teacherId, 'nonTeachingAssignments');
    const existingSnap = await getDocs(query(colRef, where('year', '==', year), where('period', '==', period)));
    
    const batch = writeBatch(db);
    existingSnap.docs.forEach(d => batch.delete(d.ref));
    assignments.forEach(a => {
        const newRef = doc(colRef);
        batch.set(newRef, { ...a, instituteId });
    });
    await batch.commit();
};

export const getAssignmentsForActivity = async (instituteId: string, activityId: string, year: string): Promise<NonTeachingAssignment[]> => {
    const q = query(collectionGroup(db, 'nonTeachingAssignments'), where('instituteId', '==', instituteId), where('activityId', '==', activityId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NonTeachingAssignment));
};

// --- EFSRT (PRÁCTICAS) ---
export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const q = query(collection(db, 'institutes', instituteId, 'efsrtAssignments'), where('supervisorId', '==', supervisorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const getAllEFSRTAssignments = async (instituteId: string): Promise<EFSRTAssignment[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'efsrtAssignments'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'efsrtAssignments'), { ...data, status: 'Programado', visits: [], createdAt: Timestamp.now() });
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), {
        visits: arrayUnion({ ...visit, id })
    });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string) => {
    const status: EFSRTStatus = grade >= 13 ? 'Aprobado' : 'Desaprobado';
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { grade, observations, status });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`);
    const field = type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl';
    await updateDoc(doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId), { [field]: url });
};

// --- ASISTENCIA ---
export const getAttendanceForUnit = async (instituteId: string, unitId: string, year: string, period: UnitPeriod): Promise<AttendanceRecord | null> => {
    const id = `${unitId}_${year}_${period}`;
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'attendance', id));
    return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const saveAttendance = async (instituteId: string, record: AttendanceRecord) => {
    await setDoc(doc(db, 'institutes', instituteId, 'attendance', record.id), record);
};

export const getAcademicPeriods = async (instituteId: string, year: string): Promise<AcademicYearSettings | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'config', `periods_${year}`));
    return snap.exists() ? snap.data() as AcademicYearSettings : null;
};

export const saveAcademicPeriods = async (instituteId: string, year: string, data: AcademicYearSettings) => {
    await setDoc(doc(db, 'institutes', instituteId, 'config', `periods_${year}`), data);
};

export const getScheduledDaysForUnit = async (instituteId: string, unitId: string, year: string, semester: number): Promise<string[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('unitId', '==', unitId), where('year', '==', year));
    const snap = await getDocs(q);
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const days = Array.from(new Set(snap.docs.map(d => d.data().dayOfWeek as string)));
    return days.sort((a,b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

// --- HORARIOS ---
export const getDefaultScheduleTemplate = async (instituteId: string): Promise<ScheduleTemplate | null> => {
    const q = query(collection(db, 'institutes', instituteId, 'scheduleTemplates'), where('isDefault', '==', true), limit(1));
    let snap = await getDocs(q);
    if (snap.empty) {
        snap = await getDocs(query(collection(db, 'institutes', instituteId, 'scheduleTemplates'), limit(1)));
    }
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleTemplate;
};

export const getScheduleTemplates = async (instituteId: string): Promise<ScheduleTemplate[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'scheduleTemplates'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
};

export const addScheduleTemplate = async (instituteId: string, data: Omit<ScheduleTemplate, 'id'>) => {
    const ref = await addDoc(collection(db, 'institutes', instituteId, 'scheduleTemplates'), data);
    return ref.id;
};

export const updateScheduleTemplate = async (instituteId: string, id: string, data: Partial<ScheduleTemplate>) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id), data);
};

export const deleteScheduleTemplate = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'scheduleTemplates', id));
};

export const setDefaultScheduleTemplate = async (instituteId: string, id: string) => {
    const all = await getScheduleTemplates(instituteId);
    const batch = writeBatch(db);
    all.forEach(t => batch.update(doc(db, 'institutes', instituteId, 'scheduleTemplates', t.id), { isDefault: t.id === id }));
    await batch.commit();
};

export const getAllSchedules = async (instituteId: string, year: string, semester: number): Promise<Record<string, ScheduleBlock>> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('year', '==', year), where('semester', '==', semester));
    const snap = await getDocs(q);
    const res: Record<string, ScheduleBlock> = {};
    snap.docs.forEach(d => {
        const b = d.data() as ScheduleBlock;
        res[`${b.dayOfWeek}-${b.startTime}`] = b;
    });
    return res;
};

export const getInstituteSchedulesForYear = async (instituteId: string, year: string): Promise<ScheduleBlock[]> => {
    const q = query(collectionGroup(db, 'scheduleBlocks'), where('instituteId', '==', instituteId), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ScheduleBlock);
};

export const saveSchedule = async (instituteId: string, programId: string, year: string, semester: number, turno: UnitTurno, blocks: Record<string, ScheduleBlock>) => {
    const colRef = collection(db, 'institutes', instituteId, 'programs', programId, 'schedules', `${year}_S${semester}_${turno}`, 'blocks');
    const existing = await getDocs(colRef);
    const batch = writeBatch(db);
    existing.docs.forEach(d => batch.delete(d.ref));
    Object.values(blocks).forEach(b => batch.set(doc(colRef), { ...b, instituteId }));
    await batch.commit();
};

// --- OTROS ACADÉMICOS ---
export const getAchievementIndicators = async (instituteId: string, unitId: string): Promise<AchievementIndicator[]> => {
    const snap = await getDocs(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AchievementIndicator));
};

export const addAchievementIndicator = async (instituteId: string, unitId: string, data: Omit<AchievementIndicator, 'id'>) => {
    await addDoc(collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators'), data);
};

export const deleteAchievementIndicator = async (instituteId: string, unitId: string, indicatorId: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'indicators', indicatorId));
};

export const getSyllabus = async (instituteId: string, unitId: string): Promise<Syllabus | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus'));
    return snap.exists() ? snap.data() as Syllabus : null;
};

export const saveSyllabus = async (instituteId: string, unitId: string, data: Syllabus) => {
    await setDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'config', 'syllabus'), data);
};

export const closeUnitGrades = async (instituteId: string, unitId: string, year: string, period: UnitPeriod, results: { studentId: string, finalGrade: number | null, status: 'aprobado' | 'desaprobado' }[]) => {
    const batch = writeBatch(db);
    results.forEach(res => {
        const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', `${unitId}_${res.studentId}_${year}_${period}`);
        batch.update(recordRef, { finalGrade: res.finalGrade, status: res.status });
        
        // Actualizar el estado en la matrícula
        const matQuery = query(collection(db, 'institutes', instituteId, 'matriculations'), where('studentId', '==', res.studentId), where('unitId', '==', unitId), where('year', '==', year), where('period', '==', period));
        getDocs(matQuery).then(snap => {
            snap.docs.forEach(d => batch.update(d.ref, { status: res.status }));
        });
    });
    await batch.commit();
};

export const getMatriculationReportData = async (instituteId: string, programId: string, year: string, semester: number): Promise<MatriculationReportData> => {
    const [program, allUnits, allMats, allStudents] = await Promise.all([
        getProgram(instituteId, programId),
        getUnits(instituteId),
        getDocs(query(collection(db, 'institutes', instituteId, 'matriculations'), where('programId', '==', programId), where('year', '==', year), where('semester', '==', semester))),
        getStudentProfiles(instituteId)
    ]);
    
    if (!program) throw new Error("Programa no encontrado");
    
    const unitsInSem = allUnits.filter(u => u.programId === programId && u.semester === semester);
    const unitResults = await Promise.all(unitsInSem.map(async unit => {
        const enrolledIds = allMats.docs.filter(d => d.data().unitId === unit.id).map(d => d.data().studentId);
        const students = enrolledIds.map(id => allStudents.find(s => s.documentId === id)).filter(Boolean) as StudentProfile[];
        const assignments = await getAssignments(instituteId, year, programId);
        const teacherId = assignments[unit.period]?.[unit.id];
        const teacher = teacherId ? (await getStaffProfileByDocumentId(instituteId, teacherId))?.displayName || null : null;
        return { unit, teacherName: teacher, students };
    }));
    
    return { program, units: unitResults };
};

const getProgram = async (instituteId: string, programId: string): Promise<Program | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'programs', programId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Program : null;
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

// --- STORAGE / IMÁGENES ---
export const updateUnitImage = async (instituteId: string, unitId: string, imageUrl: string) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId), { imageUrl });
};

export const uploadCustomUnitImage = async (instituteId: string, unitId: string, file: File) => {
    const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/units/${unitId}/cover`);
    await updateUnitImage(instituteId, unitId, url);
};

export const getAlbums = async (instituteId: string): Promise<Album[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album));
};

export const getAlbum = async (instituteId: string, albumId: string): Promise<Album | null> => {
    const snap = await getDoc(doc(db, 'institutes', instituteId, 'albums', albumId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Album : null;
};

export const addAlbum = async (instituteId: string, data: any) => {
    await addDoc(collection(db, 'institutes', instituteId, 'albums'), { ...data, createdAt: Timestamp.now() });
};

export const updateAlbum = async (instituteId: string, id: string, data: any) => {
    await updateDoc(doc(db, 'institutes', instituteId, 'albums', id), data);
};

export const deleteAlbum = async (instituteId: string, id: string) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', id));
};

export const getAlbumPhotos = async (instituteId: string, albumId: string): Promise<Photo[]> => {
    const snap = await getDocs(query(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
};

export const addPhotosToAlbum = async (instituteId: string, albumId: string, files: File[]) => {
    const batch = writeBatch(db);
    let firstUrl = '';
    for (const file of files) {
        const id = Math.random().toString(36).substring(7);
        const url = await uploadFileAndGetURL(file, `institutes/${instituteId}/albums/${albumId}/${id}`);
        if (!firstUrl) firstUrl = url;
        const ref = doc(collection(db, 'institutes', instituteId, 'albums', albumId, 'photos'));
        batch.set(ref, { url, createdAt: Timestamp.now(), albumId });
    }
    await batch.commit();
    // Actualizar portada si no tiene
    const album = await getAlbum(instituteId, albumId);
    if (album && !album.coverImageUrl) {
        await updateDoc(doc(db, 'institutes', instituteId, 'albums', albumId), { coverImageUrl: firstUrl });
    }
};

export const deletePhotoFromAlbum = async (instituteId: string, albumId: string, photo: Photo) => {
    await deleteDoc(doc(db, 'institutes', instituteId, 'albums', albumId, 'photos', photo.id));
    try { await deleteObject(ref(storage, photo.url)); } catch (e) {}
};
